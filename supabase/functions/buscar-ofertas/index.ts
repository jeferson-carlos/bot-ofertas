import { createClient } from "jsr:@supabase/supabase-js@2"

const SHOPEE_APP_ID  = Deno.env.get("SHOPEE_APP_ID")!
const SHOPEE_SECRET  = Deno.env.get("SHOPEE_SECRET")!
const BASE_URL       = "https://open-api.affiliate.shopee.com.br/graphql"
const DESCONTO_MIN   = 10

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

// Auth SHA256 — mesma lógica do coletor Python
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

async function buscarPorKeyword(keyword: string): Promise<any[]> {
  const payload = JSON.stringify({
    query: `{
      productOfferV2(
        keyword: "${keyword}",
        listType: 1,
        sortType: 5,
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
  return nodes.filter((n: any) => parseFloat(n.priceDiscountRate || "0") >= DESCONTO_MIN)
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
      percentual_desconto: Math.round(parseFloat(oferta.priceDiscountRate || "0")),
      link_afiliado:       oferta.offerLink,
      imagem_url:          oferta.imageUrl,
      loja:                oferta.shopName,
      status:              "pendente"
    })
    novos++
  }

  return { novos, duplicatas }
}

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })

  try {
    // Busca keywords ativas (de todos os usuários ou de um usuário específico)
    const body = await req.json().catch(() => ({}))
    const userId = body?.user_id

    let query = supabase.from("keywords").select("keyword").eq("ativo", true)
    if (userId) query = query.eq("user_id", userId)

    const { data: keywords, error } = await query

    if (error) throw new Error("Erro ao buscar keywords: " + error.message)

    // Fallback: se não há keywords, usa "oferta" como padrão
    const lista: string[] = keywords && keywords.length > 0
      ? [...new Set(keywords.map((k: any) => k.keyword))]
      : ["oferta"]

    console.log(`🔍 Buscando ${lista.length} keyword(s): ${lista.join(", ")}`)

    let totalNovos = 0, totalDuplicatas = 0

    for (const keyword of lista) {
      const ofertas = await buscarPorKeyword(keyword)
      const { novos, duplicatas } = await salvarOfertas(ofertas)
      totalNovos     += novos
      totalDuplicatas += duplicatas
      console.log(`  "${keyword}": ${novos} novos, ${duplicatas} duplicatas`)
    }

    return Response.json(
      { ok: true, novos: totalNovos, duplicatas: totalDuplicatas, keywords: lista.length },
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
