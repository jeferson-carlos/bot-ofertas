export const SHOPEE_BASE_URL = "https://open-api.affiliate.shopee.com.br/graphql"

export const TEMPLATE_PADRAO =
  "🔥 *OFERTA SHOPEE*\n\n" +
  "📦 {titulo}\n\n" +
  "🏪 Loja: {loja}\n" +
  "💰 De: ~R$ {preco_original}~\n" +
  "✅ Por: *R$ {preco}*\n" +
  "📉 Desconto: *{desconto}% OFF*\n\n" +
  "🛒 [Comprar agora]({link})"

export async function sha256hex(text: string): Promise<string> {
  const data   = new TextEncoder().encode(text)
  const buffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function getShopeeHeaders(appId: string, secret: string, payload: string) {
  const timestamp  = String(Math.floor(Date.now() / 1000))
  const assinatura = await sha256hex(`${appId}${timestamp}${payload}${secret}`)
  return {
    "Content-Type": "application/json",
    "Authorization": `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${assinatura}`
  }
}

export async function gerarLinkRastreavel(originUrl: string, appId: string, secret: string): Promise<string | null> {
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

export function aplicarTemplate(template: string | null, oferta: any): string {
  const base = template || TEMPLATE_PADRAO
  return base
    .replace(/{titulo}/g,         oferta.titulo || "")
    .replace(/{preco}/g,          parseFloat(oferta.preco_desconto).toFixed(2))
    .replace(/{preco_original}/g, parseFloat(oferta.preco_original).toFixed(2))
    .replace(/{desconto}/g,       String(oferta.percentual_desconto ?? 0))
    .replace(/{loja}/g,           oferta.loja || "Shopee")
    .replace(/{link}/g,           oferta.link_afiliado || "")
}

export async function enviarTelegram(oferta: any, botToken: string, chatId: string, template: string | null): Promise<boolean> {
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
