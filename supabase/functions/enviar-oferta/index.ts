import { createClient } from "jsr:@supabase/supabase-js@2"

// Credenciais globais (fallback quando usuário não configurou as próprias)
const TELEGRAM_TOKEN_GLOBAL   = Deno.env.get("TELEGRAM_TOKEN") ?? ""
const TELEGRAM_CHAT_ID_GLOBAL = Deno.env.get("TELEGRAM_CHANNEL_ID") ?? ""

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

async function enviarTelegram(oferta: any, botToken: string, chatId: string): Promise<boolean> {
  const desconto  = oferta.percentual_desconto ?? 0
  const original  = parseFloat(oferta.preco_original).toFixed(2)
  const desconto_ = parseFloat(oferta.preco_desconto).toFixed(2)

  const mensagem =
    `🔥 *OFERTA SHOPEE*\n\n` +
    `📦 ${oferta.titulo}\n\n` +
    `🏪 Loja: ${oferta.loja || "Shopee"}\n` +
    `💰 De: ~R$ ${original}~\n` +
    `✅ Por: *R$ ${desconto_}*\n` +
    `📉 Desconto: *${desconto}% OFF*\n\n` +
    `🛒 [Comprar agora](${oferta.link_afiliado})`

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

  // Ação: descartar
  if (acao === "descartar") {
    await supabase.from("ofertas").update({ status: "descartado" }).eq("id", id)
    return Response.json({ ok: true }, { headers: CORS })
  }

  // Ação: enviar
  if (oferta.status === "enviado") {
    return Response.json({ ok: false, erro: "Oferta já enviada" }, { status: 400, headers: CORS })
  }

  // Resolve credenciais Telegram: usa as do usuário, ou fallback global
  let botToken = TELEGRAM_TOKEN_GLOBAL
  let chatId   = TELEGRAM_CHAT_ID_GLOBAL

  if (oferta.user_id) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("telegram_bot_token, telegram_chat_id")
      .eq("id", oferta.user_id)
      .single()

    if (perfil?.telegram_bot_token) botToken = perfil.telegram_bot_token
    if (perfil?.telegram_chat_id)   chatId   = perfil.telegram_chat_id
  }

  if (!botToken || !chatId) {
    return Response.json(
      { ok: false, erro: "Credenciais Telegram não configuradas. Acesse Configurações para adicionar." },
      { status: 400, headers: CORS }
    )
  }

  const sucesso = await enviarTelegram(oferta, botToken, chatId)

  if (!sucesso) {
    return Response.json({ ok: false, erro: "Falha ao enviar no Telegram. Verifique as credenciais em Configurações." }, { status: 500, headers: CORS })
  }

  await supabase
    .from("ofertas")
    .update({ status: "enviado", enviado_em: new Date().toISOString() })
    .eq("id", id)

  return Response.json({ ok: true }, { headers: CORS })
})
