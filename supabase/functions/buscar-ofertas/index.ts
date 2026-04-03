import { createClient } from "jsr:@supabase/supabase-js@2"

const SHOPEE_APP_ID = Deno.env.get("SHOPEE_APP_ID")!
const SHOPEE_SECRET = Deno.env.get("SHOPEE_SECRET")!
const BASE_URL      = "https://open-api.affiliate.shopee.com.br/graphql"
const DESCONTO_MIN  = 10

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

async function sha256hex(text: string): Promise<string> {
  const data   = new TextEncoder().encode(text)
  const buffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("")
}

async function getHeaders(payload: string) {
  const timestamp  = String(Math.floor(Date.now() / 1000))
  const assinatura = await sha256hex(`${SHOPEE_APP_ID}${timestamp}${payload}${SHOPEE_SECRET}`)
  return {
    "Content-Type": "application/json",
    "Authorization": `SHA256 Credential=${SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${assinatura}`
  }
}

function calcularDesconto(precoMax: string, precoMin: string): number {
  const max = parseFloat(precoMax || "0")
  const min = parseFloat(precoMin || "0")
  if (max > 0 && min < max) return Math.round((1 - min / max) * 1000) / 10
  return 0
}

async function buscarPorKeyword(keyword: string, sortType: number): Promise<any[]> {
  const payload = JSON.stringify({
    query: `{
      productOfferV2(
        keyword: "${keyword}",
        listType: 1,
        sortType: ${sortType},
        page: 1,
        limit: 50
      ) {
        nodes {
          itemId productName priceMin priceMax
          priceDiscountRate commissionRate
          offerLink imageUrl shopName
        }
        pageInfo { page limit hasNextPage }
      }
    }`
  })

  const res  = await fetch(BASE_URL, { method: "POST", headers: await getHeaders(payload), body: payload })
  const data = await res.json()

  if (data.errors) {
    console.error(`Erro API Shopee (${keyword}):`, data.errors)
    return []
  }

  const nodes = data?.data?.productOfferV2?.nodes ?? []

  // Filtra por desconto CALCULADO — não confia no campo priceDiscountRate
  return nodes.filter((n: any) => calcularDesconto(n.priceMax, n.priceMin) >= DESCONTO_MIN)
}

async function salvarOfertas(ofertas: any[]): Promise<{ novos: number; duplicatas: number }> {
  let novos = 0, duplicatas = 0

  for (const oferta of ofertas) {
    const produto_id = String(oferta.itemId)

    const { data: existente } = await supabase
      .from("ofertas")
      .select("id")
      .eq("product_id", produto_id)
      .single()

    if (existente) { duplicatas++; continue }

    await supabase.from("ofertas").insert({
      product_id:          produto_id,
      titulo:              oferta.productName,
      preco_original:      parseFloat(oferta.priceMax),
      preco_desconto:      parseFloat(oferta.priceMin),
      percentual_desconto: Math.round(calcularDesconto(oferta.priceMax, oferta.priceMin)),
      comissao:            parseFloat(oferta.commissionRate || "0"),
      link_afiliado:       oferta.offerLink,
      imagem_url:          oferta.imageUrl,
      loja:                oferta.shopName,
      status:              "pendente"
    })
    novos++
  }

  return { novos, duplicatas }
}

const LIMITE_BUSCA = { free: 0, pro: 5, premium: Infinity }

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

async function verificarEIncrementarUso(userId: string, plano: string): Promise<{ permitido: boolean; usado: number; limite: number }> {
  const limite = LIMITE_BUSCA[plano as keyof typeof LIMITE_BUSCA] ?? 0
  const hoje   = new Date().toISOString().split("T")[0]

  // Busca uso de hoje
  const { data } = await supabase
    .from("uso_busca")
    .select("quantidade")
    .eq("user_id", userId)
    .eq("data", hoje)
    .single()

  const usado = data?.quantidade ?? 0

  if (limite !== Infinity && usado >= limite) {
    return { permitido: false, usado, limite }
  }

  // Incrementa (upsert)
  await supabase.from("uso_busca").upsert(
    { user_id: userId, data: hoje, quantidade: usado + 1 },
    { onConflict: "user_id,data" }
  )

  return { permitido: true, usado: usado + 1, limite }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })

  try {
    const body   = await req.json().catch(() => ({}))
    const userId = body?.user_id

    // Verificação de limite apenas para chamadas manuais (com user_id)
    if (userId) {
      const { data: perfil } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .single()

      const plano = perfil?.plan || "free"
      const { permitido, usado, limite } = await verificarEIncrementarUso(userId, plano)

      if (!permitido) {
        return Response.json(
          { ok: false, erro: `Limite diário atingido (${usado}/${limite} buscas)`, limite_atingido: true },
          { status: 429, headers: { ...CORS, "Content-Type": "application/json" } }
        )
      }
    }

    let query = supabase.from("keywords").select("keyword, sort_type").eq("ativo", true)
    if (userId) query = query.eq("user_id", userId)

    const { data: keywords, error } = await query
    if (error) throw new Error("Erro ao buscar keywords: " + error.message)

    // Fallback: sem keywords, usa "oferta" com mais vendidos
    const lista = keywords && keywords.length > 0
      ? keywords
      : [{ keyword: "oferta", sort_type: 2 }]

    // Deduplica keywords repetidas (mantém a última configuração)
    const unique = Object.values(
      lista.reduce((acc: any, k: any) => ({ ...acc, [k.keyword]: k }), {})
    ) as { keyword: string; sort_type: number }[]

    console.log(`🔍 Buscando ${unique.length} keyword(s)`)

    let totalNovos = 0, totalDuplicatas = 0

    for (const { keyword, sort_type } of unique) {
      const sortType = sort_type ?? 2
      const ofertas  = await buscarPorKeyword(keyword, sortType)
      const { novos, duplicatas } = await salvarOfertas(ofertas)
      totalNovos      += novos
      totalDuplicatas += duplicatas
      console.log(`  "${keyword}" (sort=${sortType}): ${novos} novos, ${duplicatas} duplicatas`)
    }

    return Response.json(
      { ok: true, novos: totalNovos, duplicatas: totalDuplicatas, keywords: unique.length },
      { headers: { ...CORS, "Content-Type": "application/json" } }
    )


  } catch (e) {
    console.error("Erro:", e)
    return Response.json(
      { ok: false, erro: e.message },
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  }
})
