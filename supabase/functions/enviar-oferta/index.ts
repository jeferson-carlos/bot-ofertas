import { createClient } from "jsr:@supabase/supabase-js@2"

const SHOPEE_BASE_URL = "https://open-api.affiliate.shopee.com.br/graphql"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

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

async function getShopeeHeaders(appId: string, secret: string, payload: string) {
  const timestamp  = String(Math.floor(Date.now() / 1000))
  const assinatura = await sha256hex(`${appId}${timestamp}${payload}${secret}`)
  return {
    "Content-Type": "application/json",
    "Authorization": `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${assinatura}`
  }
}

async function gerarLinkRastreavel(originUrl: string, appId: string, secret: string): Promise<string | null> {
  const payload = JSON.stringify({
    query: `mutation { generateShortLink(input: { originUrl: "${originUrl}", subIds: [] }) { shortLink } }`
  })

  try {
    const res  = await fetch(SHOPEE_BASE_URL, { method: "POST", headers: await getShopeeHeaders(appId, secret, payload), body: payload })
    const data = await res.json()
    const shortLink = data?.data?.generateShortLink?.shortLink ?? null
    if (shortLink) console.log(`Link rastreável gerado: ${shortLink}`)
    else console.warn("generateShortLink não retornou link:", JSON.stringify(data))
    return shortLink
  } catch (e) {
    console.warn("Erro ao gerar link rastreável:", (e as Error).message)
    return null
  }
}

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

const TEMPLATE_PADRAO =
  "🔥 *OFERTA SHOPEE*\n\n" +
  "📦 {titulo}\n\n" +
  "🏪 Loja: {loja}\n" +
  "💰 De: ~R$ {preco_original}~\n" +
  "✅ Por: *R$ {preco}*\n" +
  "📉 Desconto: *{desconto}% OFF*\n\n" +
  "🛒 [Comprar agora]({link})"

function aplicarTemplate(template: string | null, oferta: any): string {
  const base = template || TEMPLATE_PADRAO
  return base
    .replace(/{titulo}/g,         oferta.titulo || "")
    .replace(/{preco}/g,          parseFloat(oferta.preco_desconto).toFixed(2))
    .replace(/{preco_original}/g, parseFloat(oferta.preco_original).toFixed(2))
    .replace(/{desconto}/g,       String(oferta.percentual_desconto ?? 0))
    .replace(/{loja}/g,           oferta.loja || "Shopee")
    .replace(/{link}/g,           oferta.link_afiliado || "")
}

async function enviarTelegram(oferta: any, botToken: string, chatId: string, template: string | null): Promise<boolean> {
  const mensagem = aplicarTemplate(template, oferta)
  const base = `https://api.telegram.org/bot${botToken}`

  if (oferta.imagem_url) {
    const res = await fetch(`${base}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    chatId,
        photo:      oferta.imagem_url,
        caption:    mensagem,
        parse_mode: "Markdown"
      })
    })
    const data = await res.json()
    return data.ok
  } else {
    const res = await fetch(`${base}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    chatId,
        text:       mensagem,
        parse_mode: "Markdown"
      })
    })
    const data = await res.json()
    return data.ok
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })

  const authHeader   = req.headers.get("Authorization") ?? ""
  const requestingId = getUserIdFromJWT(authHeader)

  const { id, acao } = await req.json()

  if (!id) {
    return Response.json({ ok: false, erro: "ID não informado" }, { status: 400, headers: CORS })
  }

  // Busca a oferta
  const { data: oferta } = await supabase
    .from("ofertas")
    .select("*")
    .eq("id", id)
    .single()

  if (!oferta) {
    return Response.json({ ok: false, erro: "Oferta não encontrada" }, { status: 404, headers: CORS })
  }

  // Verifica propriedade — usuário só pode operar suas próprias ofertas
  if (oferta.user_id && requestingId && oferta.user_id !== requestingId) {
    return Response.json({ ok: false, erro: "Sem permissão" }, { status: 403, headers: CORS })
  }

  // Ação: descartar
  if (acao === "descartar") {
    await supabase.from("ofertas").update({ status: "descartado" }).eq("id", id)
    return Response.json({ ok: true }, { headers: CORS })
  }

  // Ação: enviar normal — bloqueia reenvio acidental
  if (acao === "enviar" && oferta.status === "enviado") {
    return Response.json({ ok: false, erro: "Oferta já enviada" }, { status: 400, headers: CORS })
  }

  // Resolve credenciais Telegram e template: usa apenas as do usuário
  let botToken: string | null = null
  let chatId: string | null = null
  let template: string | null = null

  let shopeeAppId: string | null = null
  let shopeeSecret: string | null = null

  if (oferta.user_id) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("telegram_bot_token, telegram_chat_id, telegram_template, shopee_app_id, shopee_secret")
      .eq("id", oferta.user_id)
      .single()

    botToken    = perfil?.telegram_bot_token ?? null
    chatId      = perfil?.telegram_chat_id   ?? null
    template    = perfil?.telegram_template  ?? null
    shopeeAppId = perfil?.shopee_app_id      ?? null
    shopeeSecret = perfil?.shopee_secret     ?? null
  }

  if (!botToken || !chatId) {
    return Response.json(
      { ok: false, erro: "Credenciais Telegram não configuradas. Acesse Configurações para adicionar." },
      { status: 400, headers: CORS }
    )
  }

  // Gera link rastreável fresh via generateShortLink — obrigatório para rastreamento de cliques
  if (!shopeeAppId || !shopeeSecret) {
    return Response.json(
      { ok: false, erro: "Credenciais Shopee não configuradas. Acesse Configurações para adicionar." },
      { status: 400, headers: CORS }
    )
  }

  if (!oferta.link_afiliado) {
    return Response.json(
      { ok: false, erro: "Oferta sem link de afiliado. Não é possível enviar." },
      { status: 400, headers: CORS }
    )
  }

  const linkFinal = await gerarLinkRastreavel(oferta.link_afiliado, shopeeAppId, shopeeSecret)
  if (!linkFinal) {
    return Response.json(
      { ok: false, erro: "Falha ao obter o link curto da Shopee. Verifique suas credenciais e tente novamente." },
      { status: 502, headers: CORS }
    )
  }

  const ofertaComLink = { ...oferta, link_afiliado: linkFinal }
  const sucesso = await enviarTelegram(ofertaComLink, botToken, chatId, template)

  if (!sucesso) {
    return Response.json({ ok: false, erro: "Falha ao enviar no Telegram. Verifique as credenciais em Configurações." }, { status: 500, headers: CORS })
  }

  await supabase
    .from("ofertas")
    .update({ status: "enviado", enviado_em: new Date().toISOString() })
    .eq("id", id)

  return Response.json({ ok: true }, { headers: CORS })
})
