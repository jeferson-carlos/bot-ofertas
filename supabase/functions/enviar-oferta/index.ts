import { createClient } from "jsr:@supabase/supabase-js@2"

const TELEGRAM_TOKEN      = Deno.env.get("TELEGRAM_TOKEN")!
const TELEGRAM_CHANNEL_ID = Deno.env.get("TELEGRAM_CHANNEL_ID")!
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!
const SUPABASE_KEY        = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function enviarTelegram(oferta: any): Promise<boolean> {
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

  const base = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`

  if (oferta.imagem_url) {
    const res = await fetch(`${base}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    TELEGRAM_CHANNEL_ID,
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
        chat_id:    TELEGRAM_CHANNEL_ID,
        text:       mensagem,
        parse_mode: "Markdown"
      })
    })
    const data = await res.json()
    return data.ok
  }
}

Deno.serve(async (req) => {
  // Libera CORS para o painel no GitHub Pages
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    })
  }

  const { id, acao } = await req.json()

  if (!id) {
    return Response.json({ ok: false, erro: "ID não informado" }, { status: 400 })
  }

  // Busca a oferta no Supabase
  const { data: oferta } = await supabase
    .from("ofertas")
    .select("*")
    .eq("id", id)
    .single()

  if (!oferta) {
    return Response.json({ ok: false, erro: "Oferta não encontrada" }, { status: 404 })
  }

  // Ação: descartar
  if (acao === "descartar") {
    await supabase
      .from("ofertas")
      .update({ status: "descartado" })
      .eq("id", id)
    return Response.json({ ok: true })
  }

  // Ação: enviar (padrão)
  if (oferta.status === "enviado") {
    return Response.json({ ok: false, erro: "Oferta já enviada" }, { status: 400 })
  }

  const sucesso = await enviarTelegram(oferta)

  if (!sucesso) {
    return Response.json({ ok: false, erro: "Falha ao enviar no Telegram" }, { status: 500 })
  }

  await supabase
    .from("ofertas")
    .update({
      status:     "enviado",
      enviado_em: new Date().toISOString()
    })
    .eq("id", id)

  return Response.json(
    { ok: true },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  )
})