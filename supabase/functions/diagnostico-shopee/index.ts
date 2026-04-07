import { createClient } from "jsr:@supabase/supabase-js@2"

const SHOPEE_APP_ID_GLOBAL = Deno.env.get("SHOPEE_APP_ID") ?? ""
const SHOPEE_SECRET_GLOBAL = Deno.env.get("SHOPEE_SECRET") ?? ""
const BASE_URL             = "https://open-api.affiliate.shopee.com.br/graphql"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info"
}

function getUserIdFromJWT(authHeader: string): string | null {
  try {
    const token   = authHeader.replace("Bearer ", "")
    const payload = token.split(".")[1]
    const decoded = JSON.parse(atob(payload))
    return decoded.sub ?? null
  } catch {
    return null
  }
}

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })

  const authHeader = req.headers.get("Authorization") ?? ""
  const userId     = getUserIdFromJWT(authHeader)

  if (!userId) {
    return Response.json(
      { ok: false, erro: "Não autenticado" },
      { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("shopee_app_id, shopee_secret")
    .eq("id", userId)
    .single()

  const temCredencialPropria = !!(perfil?.shopee_app_id && perfil?.shopee_secret)
  const appId  = perfil?.shopee_app_id  || SHOPEE_APP_ID_GLOBAL
  const secret = perfil?.shopee_secret   || SHOPEE_SECRET_GLOBAL

  let fonteCredencial: string
  if (temCredencialPropria) {
    fonteCredencial = "usuario"
  } else if (appId && secret) {
    fonteCredencial = "global"
  } else {
    fonteCredencial = "ausente"
  }

  if (!appId || !secret) {
    return Response.json(
      {
        ok: false,
        erro: "Credenciais Shopee não configuradas. Acesse Configurações e salve seu App ID e Secret.",
        fonte_credencial: "ausente",
      },
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  }

  const payload = JSON.stringify({
    query: `{
      productOfferV2(
        keyword: "oferta",
        listType: 1,
        sortType: 2,
        page: 1,
        limit: 1,
        subIds: ["${appId}"]
      ) {
        nodes {
          itemId productName priceMin priceMax
          commissionRate offerLink
        }
      }
    }`
  })

  try {
    const res  = await fetch(BASE_URL, { method: "POST", headers: await getHeaders(appId, secret, payload), body: payload })
    const data = await res.json()

    if (data.errors) {
      return Response.json(
        { ok: false, erro: "Erro retornado pela API Shopee", erros_api: data.errors, fonte_credencial: fonteCredencial, app_id_usado: appId },
        { headers: { ...CORS, "Content-Type": "application/json" } }
      )
    }

    const nodes = data?.data?.productOfferV2?.nodes ?? []
    const primeiro = nodes[0] ?? null

    const offerLink = primeiro?.offerLink ?? null
    // Links de afiliado Shopee contêm "smtt" ou "af_siteid" ou "shopee_link_gen" na URL
    const offerLinkTemAfiliado = offerLink
      ? /smtt=|af_siteid=|_shopee_link_gen=|shp\.ee|shope\.ee/.test(offerLink)
      : false

    return Response.json(
      {
        ok: true,
        fonte_credencial: fonteCredencial,
        app_id_usado: appId,
        offerLink_bruto: offerLink,
        offerLink_tem_afiliado: offerLinkTemAfiliado,
        comissao_exemplo: primeiro?.commissionRate ?? null,
        produto_exemplo: primeiro ? { itemId: primeiro.itemId, productName: primeiro.productName } : null,
        erros_api: null,
      },
      { headers: { ...CORS, "Content-Type": "application/json" } }
    )
  } catch (e) {
    return Response.json(
      { ok: false, erro: `Erro ao chamar API Shopee: ${(e as Error).message}`, fonte_credencial: fonteCredencial, app_id_usado: appId },
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  }
})
