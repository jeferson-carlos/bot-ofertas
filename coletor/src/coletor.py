import hashlib
import time
import json
import requests
from dotenv import load_dotenv
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from supabase_client import supabase
import os

load_dotenv()

APP_ID     = os.getenv("SHOPEE_APP_ID")
SECRET_KEY = os.getenv("SHOPEE_SECRET")
BASE_URL   = "https://open-api.affiliate.shopee.com.br/graphql"

# Desconto mínimo para considerar a oferta (%)
DESCONTO_MINIMO = 10

def gerar_assinatura(app_id: str, timestamp: str, payload: str, secret: str) -> str:
    string = f"{app_id}{timestamp}{payload}{secret}"
    return hashlib.sha256(string.encode("utf-8")).hexdigest()

def get_headers(payload: str) -> dict:
    timestamp = str(int(time.time()))
    assinatura = gerar_assinatura(APP_ID, timestamp, payload, SECRET_KEY)
    return {
        "Content-Type": "application/json",
        "Authorization": f"SHA256 Credential={APP_ID}, Timestamp={timestamp}, Signature={assinatura}"
    }

SORT_TYPES = {
    "relevancia":   1,
    "mais_vendidos": 2,
    "menor_preco":  3,
    "maior_preco":  4,
    "comissao":     5,
}

def calcular_desconto(preco_max, preco_min) -> float:
    """Calcula desconto real a partir dos preços, ignorando o campo priceDiscountRate."""
    try:
        max_val = float(preco_max or 0)
        min_val = float(preco_min or 0)
        if max_val > 0 and min_val < max_val:
            return round((1 - min_val / max_val) * 100, 1)
    except (ValueError, TypeError):
        pass
    return 0.0

def buscar_ofertas(keyword: str = "oferta", pagina: int = 1, limite: int = 50, sort_type: int = 2) -> list:
    """Busca produtos na Shopee e retorna apenas os com desconto real."""
    payload = json.dumps({
        "query": f"""{{
          productOfferV2(
            keyword: "{keyword}",
            listType: 1,
            sortType: {sort_type},
            page: {pagina},
            limit: {limite}
          ) {{
            nodes {{
              itemId
              productName
              priceMin
              priceMax
              priceDiscountRate
              commissionRate
              offerLink
              imageUrl
              shopName
            }}
            pageInfo {{ page limit hasNextPage }}
          }}
        }}"""
    })

    response = requests.post(BASE_URL, headers=get_headers(payload), data=payload)
    data = response.json()

    if "errors" in data:
        print(f"❌ Erro na API: {data['errors']}")
        return []

    nodes = data["data"]["productOfferV2"]["nodes"]

    # Filtra por desconto CALCULADO (não confia no campo priceDiscountRate)
    ofertas = [
        n for n in nodes
        if calcular_desconto(n.get("priceMax"), n.get("priceMin")) >= DESCONTO_MINIMO
    ]

    print(f"📦 {len(nodes)} produtos recebidos → {len(ofertas)} com desconto ≥ {DESCONTO_MINIMO}%")
    return ofertas

def salvar_ofertas(ofertas: list) -> dict:
    """Salva ofertas no Supabase ignorando duplicatas."""
    novos = 0
    duplicatas = 0

    for oferta in ofertas:
        produto_id = str(oferta["itemId"])

        # Verifica se já existe no banco
        existente = supabase.table("ofertas") \
            .select("id") \
            .eq("product_id", produto_id) \
            .execute()

        if existente.data:
            duplicatas += 1
            continue

        # Monta o registro
        registro = {
            "product_id":           produto_id,
            "titulo":               oferta["productName"],
            "preco_original":       float(oferta["priceMax"]),
            "preco_desconto":       float(oferta["priceMin"]),
            "percentual_desconto":  int(calcular_desconto(oferta.get("priceMax"), oferta.get("priceMin"))),
            "comissao":             float(oferta.get("commissionRate") or 0),
            "link_afiliado":        oferta["offerLink"],
            "imagem_url":           oferta.get("imageUrl"),
            "loja":                 oferta.get("shopName"),
            "status":               "pendente"
        }

        supabase.table("ofertas").insert(registro).execute()
        novos += 1
        print(f"✅ Salvo: {oferta['productName'][:50]}...")

    return {"novos": novos, "duplicatas": duplicatas}

def executar():
    print("🔍 Buscando ofertas na Shopee...")
    ofertas = buscar_ofertas(keyword="oferta", limite=50, sort_type=2)

    if not ofertas:
        print("⚠️ Nenhuma oferta encontrada.")
        return

    print(f"\n💾 Salvando no Supabase...")
    resultado = salvar_ofertas(ofertas)

    print(f"\n📊 Resultado:")
    print(f"   ✅ Novos: {resultado['novos']}")
    print(f"   ⏭️  Duplicatas ignoradas: {resultado['duplicatas']}")

if __name__ == "__main__":
    executar()