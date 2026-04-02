import requests
import os
from dotenv import load_dotenv

load_dotenv()

TOKEN     = os.getenv("TELEGRAM_TOKEN")
CHANNEL   = os.getenv("TELEGRAM_CHANNEL_ID")
BASE_URL  = f"https://api.telegram.org/bot{TOKEN}"

def formatar_mensagem(oferta: dict) -> str:
    """Formata a mensagem da oferta para o Telegram."""
    desconto = oferta.get("percentual_desconto", 0)
    preco_original = float(oferta.get("preco_original", 0))
    preco_desconto = float(oferta.get("preco_desconto", 0))
    titulo = oferta.get("titulo", "")
    link = oferta.get("link_afiliado", "")
    loja = oferta.get("loja", "Shopee")

    return (
        f"🔥 *OFERTA SHOPEE*\n\n"
        f"📦 {titulo}\n\n"
        f"🏪 Loja: {loja}\n"
        f"💰 De: ~~R$ {preco_original:.2f}~~\n"
        f"✅ Por: *R$ {preco_desconto:.2f}*\n"
        f"📉 Desconto: *{desconto}% OFF*\n\n"
        f"🛒 [Comprar agora]({link})"
    )

def enviar_oferta(oferta: dict) -> bool:
    """Envia uma oferta para o canal do Telegram."""
    mensagem = formatar_mensagem(oferta)
    imagem_url = oferta.get("imagem_url")

    # Se tiver imagem, envia com foto
    if imagem_url:
        endpoint = f"{BASE_URL}/sendPhoto"
        payload = {
            "chat_id":    CHANNEL,
            "photo":      imagem_url,
            "caption":    mensagem,
            "parse_mode": "Markdown"
        }
    else:
        endpoint = f"{BASE_URL}/sendMessage"
        payload = {
            "chat_id":              CHANNEL,
            "text":                 mensagem,
            "parse_mode":           "Markdown",
            "disable_web_page_preview": False
        }

    response = requests.post(endpoint, json=payload)
    result = response.json()

    if result.get("ok"):
        print(f"✅ Enviado: {oferta['titulo'][:50]}...")
        return True
    else:
        print(f"❌ Erro ao enviar: {result.get('description')}")
        return False

def testar_bot():
    """Envia uma mensagem de teste para confirmar que o bot está funcionando."""
    oferta_teste = {
        "titulo":               "Produto de Teste — Tudo funcionando!",
        "preco_original":       199.90,
        "preco_desconto":       99.90,
        "percentual_desconto":  50,
        "link_afiliado":        "https://shopee.com.br",
        "imagem_url":           None,
        "loja":                 "Loja Teste"
    }
    enviar_oferta(oferta_teste)

if __name__ == "__main__":
    testar_bot()