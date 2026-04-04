import { createClient } from "jsr:@supabase/supabase-js@2"

// Credenciais globais (fallback quando usuário não configurou as próprias)
const SHOPEE_APP_ID_GLOBAL = Deno.env.get("SHOPEE_APP_ID") ?? ""
const SHOPEE_SECRET_GLOBAL = Deno.env.get("SHOPEE_SECRET") ?? ""
const BASE_URL             = "https://open-api.affiliate.shopee.com.br/graphql"
const DESCONTO_MIN         = 10

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

async function sha256hex(text: string): Promise<string> {
  const data   = new TextEncoder().encode(text)
  const buffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("")
}

async function getHeaders(appId: string, secret: string, payload: string) {
  const timestamp  = String(Math.floor(Date.now() / 1000))
  const assinatura = await sha256hex(`${appId}${timestamp}${payload}${secret}`)
  return {
    "Content-Type": "application/json",
    "Authorization": `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${assinatura}`
  }
}

function calcularDesconto(precoMax: string, precoMin: string): number {
  const max = parseFloat(precoMax || "0")
  const min = parseFloat(precoMin || "0")
  if (max > 0 && min < max) return Math.round((1 - min / max) * 1000) / 10
  return 0
}

async function buscarPorKeyword(
  keyword: string,
  sortType: number,
  appId: string,
  secret: string
): Promise<any[]> {
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

  const res  = await fetch(BASE_URL, { method: "POST", headers: await getHeaders(appId, secret, payload), body: payload })
  const data = await res.json()

  if (data.errors) {
    console.error(`Erro API Shopee (${keyword}):`, data.errors)
    return []
  }

  const nodes = data?.data?.productOfferV2?.nodes ?? []
  return nodes.filter((n: any) => calcularDesconto(n.priceMax, n.priceMin) >= DESCONTO_MIN)
}

async function salvarOfertas(ofertas: any[], userId: string | null): Promise<{ novos: number; duplicatas: number }> {
  let novos = 0, duplicatas = 0

  for (const oferta of ofertas) {
    const produto_id = String(oferta.itemId)

    // Verifica duplicata por produto_id + user_id
    let query = supabase.from("ofertas").select("id").eq("product_id", produto_id)
    if (userId) query = query.eq("user_id", userId)

    const { data: existente } = await query.single()
    if (existente) { duplicatas++; continue }

    const registro: any = {
      product_id:          produto_id,
      titulo:              oferta.productName,
      preco_original:      parseFloat(oferta.priceMax),
      preco_desconto:      parseFloat(oferta.priceMin),
      percentual_desconto: Math.round(calcularDesconto(oferta.priceMax, oferta.priceMin)),
      comissao:            parseFloat(oferta.commissionRate || "0"),
      link_afiliado:       oferta.offerLink,
      imagem_url:          oferta.imageUrl,
      loja:                oferta.shopName,
      status:              "pendente",
    }
    if (userId) registro.user_id = userId

    await supabase.from("ofertas").insert(registro)
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

  await supabase.from("uso_busca").upsert(
    { user_id: userId, data: hoje, quantidade: usado + 1 },
    { onConflict: "user_id,data" }
  )

  return { permitido: true, usado: usado + 1, limite }
}

async function registrarColeta(userId: string) {
  await supabase
    .from("profiles")
    .update({ ultima_coleta_em: new Date().toISOString() })
    .eq("id", userId)
}

// Processa um único usuário: busca suas keywords usando suas credenciais
async function processarUsuario(userId: string, appId: string, secret: string): Promise<{ novos: number; duplicatas: number }> {
  const { data: keywords } = await supabase
    .from("keywords")
    .select("keyword, sort_type")
    .eq("user_id", userId)
    .eq("ativo", true)

  const lista = keywords && keywords.length > 0
    ? keywords
    : [{ keyword: "oferta", sort_type: 2 }]

  const unique = Object.values(
    lista.reduce((acc: any, k: any) => ({ ...acc, [k.keyword]: k }), {})
  ) as { keyword: string; sort_type: number }[]

  let totalNovos = 0, totalDuplicatas = 0

  for (const { keyword, sort_type } of unique) {
    const ofertas = await buscarPorKeyword(keyword, sort_type ?? 2, appId, secret)
    const { novos, duplicatas } = await salvarOfertas(ofertas, userId)
    totalNovos      += novos
    totalDuplicatas += duplicatas
    console.log(`  [${userId}] "${keyword}": ${novos} novos, ${duplicatas} duplicatas`)
  }

  return { novos: totalNovos, duplicatas: totalDuplicatas }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })

  try {
    const body   = await req.json().catch(() => ({}))
    const userId = body?.user_id as string | undefined

    // ─── Chamada manual (painel) — user_id fornecido ───────────────────────
    if (userId) {
      const { data: perfil } = await supabase
        .from("profiles")
        .select("plan, shopee_app_id, shopee_secret")
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

      const appId  = perfil?.shopee_app_id  || SHOPEE_APP_ID_GLOBAL
      const secret = perfil?.shopee_secret   || SHOPEE_SECRET_GLOBAL

      if (!appId || !secret) {
        return Response.json(
          { ok: false, erro: "Credenciais Shopee não configuradas. Acesse Configurações para adicionar." },
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        )
      }

      const { novos, duplicatas } = await processarUsuario(userId, appId, secret)
      await registrarColeta(userId)

      return Response.json(
        { ok: true, novos, duplicatas },
        { headers: { ...CORS, "Content-Type": "application/json" } }
      )
    }

    // ─── Chamada de cron (sem user_id) — processa todos os usuários ────────
    console.log("🕐 Cron: processando todos os usuários com credenciais configuradas...")

    const { data: usuarios } = await supabase
      .from("profiles")
      .select("id, shopee_app_id, shopee_secret")
      .not("shopee_app_id", "is", null)
      .not("shopee_secret", "is", null)

    let totalNovos = 0, totalDuplicatas = 0

    if (usuarios && usuarios.length > 0) {
      // Processa usuários com credenciais próprias
      for (const u of usuarios) {
        console.log(`👤 Processando usuário ${u.id}`)
        const { novos, duplicatas } = await processarUsuario(u.id, u.shopee_app_id, u.shopee_secret)
        await registrarColeta(u.id)
        totalNovos      += novos
        totalDuplicatas += duplicatas
      }
    } else {
      // Fallback: usa credenciais globais sem user_id (comportamento legado)
      console.log("⚠️  Nenhum usuário com credenciais — usando credenciais globais")
      if (SHOPEE_APP_ID_GLOBAL && SHOPEE_SECRET_GLOBAL) {
        const { data: keywords } = await supabase
          .from("keywords")
          .select("keyword, sort_type")
          .eq("ativo", true)

        const lista = keywords && keywords.length > 0
          ? keywords
          : [{ keyword: "oferta", sort_type: 2 }]

        const unique = Object.values(
          lista.reduce((acc: any, k: any) => ({ ...acc, [k.keyword]: k }), {})
        ) as { keyword: string; sort_type: number }[]

        for (const { keyword, sort_type } of unique) {
          const ofertas = await buscarPorKeyword(keyword, sort_type ?? 2, SHOPEE_APP_ID_GLOBAL, SHOPEE_SECRET_GLOBAL)
          const { novos, duplicatas } = await salvarOfertas(ofertas, null)
          totalNovos      += novos
          totalDuplicatas += duplicatas
        }
      }
    }

    return Response.json(
      { ok: true, novos: totalNovos, duplicatas: totalDuplicatas, usuarios: usuarios?.length ?? 0 },
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
