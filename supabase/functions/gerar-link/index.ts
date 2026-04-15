import { createClient } from "jsr:@supabase/supabase-js@2"
import { gerarLinkRastreavel } from "../_shared/index.ts"

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

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

const URL_SHOPEE = /^https?:\/\/(www\.)?(shopee\.com\.br|shp\.ee|s\.shopee\.com\.br)/i

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })

  const authHeader = req.headers.get("Authorization") ?? ""
  const userId     = getUserIdFromJWT(authHeader)

  if (!userId) {
    return Response.json({ ok: false, erro: "Não autenticado" }, { status: 401, headers: CORS })
  }

  const { url, acao } = await req.json()

  if (!url || !URL_SHOPEE.test(url)) {
    return Response.json(
      { ok: false, erro: "URL inválida. Informe um link válido da Shopee (shopee.com.br)." },
      { status: 400, headers: CORS }
    )
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("shopee_app_id, shopee_secret, telegram_bot_token, telegram_chat_id")
    .eq("id", userId)
    .single()

  const shopeeAppId  = perfil?.shopee_app_id      ?? null
  const shopeeSecret = perfil?.shopee_secret       ?? null
  const botToken     = perfil?.telegram_bot_token  ?? null
  const chatId       = perfil?.telegram_chat_id    ?? null

  if (!shopeeAppId || !shopeeSecret) {
    return Response.json(
      { ok: false, erro: "Credenciais Shopee não configuradas. Acesse Configurações para adicionar." },
      { status: 400, headers: CORS }
    )
  }

  const link = await gerarLinkRastreavel(url, shopeeAppId, shopeeSecret)

  if (!link) {
    return Response.json(
      { ok: false, erro: "Falha ao gerar o link rastreável. Verifique suas credenciais Shopee e tente novamente." },
      { status: 502, headers: CORS }
    )
  }

  if (acao === "enviar") {
    if (!botToken || !chatId) {
      return Response.json(
        { ok: false, erro: "Credenciais Telegram não configuradas. Acesse Configurações para adicionar." },
        { status: 400, headers: CORS }
      )
    }

    const mensagem = `🛒 *Link Shopee*\n\n[Ver produto](${link})`

    const res  = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chat_id: chatId, text: mensagem, parse_mode: "Markdown" })
    })
    const data = await res.json()

    if (!data.ok) {
      return Response.json(
        { ok: false, erro: "Falha ao enviar no Telegram. Verifique as credenciais em Configurações." },
        { status: 500, headers: CORS }
      )
    }
  }

  return Response.json({ ok: true, link }, { headers: CORS })
})
