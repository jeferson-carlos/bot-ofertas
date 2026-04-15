import { createClient } from "jsr:@supabase/supabase-js@2"
import { gerarLinkRastreavel, enviarTelegram } from "../_shared/index.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

const URL_SHOPEE = /^https?:\/\/(www\.)?(shopee\.com\.br|shp\.ee|s\.shopee\.com\.br)/i

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })

  const { url, titulo, preco, precoOriginal, desconto, loja, acao, user_id: userId } = await req.json()

  if (!userId) {
    return Response.json({ ok: false, erro: "Não autenticado" }, { status: 401, headers: CORS })
  }

  if (!url || !URL_SHOPEE.test(url)) {
    return Response.json(
      { ok: false, erro: "URL inválida. Informe um link válido da Shopee (shopee.com.br)." },
      { status: 400, headers: CORS }
    )
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("shopee_app_id, shopee_secret, telegram_bot_token, telegram_chat_id, telegram_template")
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

    const ofertaSimples = {
      titulo:               titulo        || "",
      preco_desconto:       preco         || "0",
      preco_original:       precoOriginal || "0",
      percentual_desconto:  desconto ? parseFloat(desconto) : 0,
      loja:                 loja          || "Shopee",
      link_afiliado:        link,
      imagem_url:           null,
    }

    const sucesso = await enviarTelegram(ofertaSimples, botToken, chatId, perfil?.telegram_template ?? null)

    if (!sucesso) {
      return Response.json(
        { ok: false, erro: "Falha ao enviar no Telegram. Verifique as credenciais em Configurações." },
        { status: 500, headers: CORS }
      )
    }
  }

  return Response.json({ ok: true, link }, { headers: CORS })
})
