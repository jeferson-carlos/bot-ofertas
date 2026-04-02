import hmac
import hashlib
import time
import json
import requests
from dotenv import load_dotenv
import os

load_dotenv()

APP_ID     = os.getenv("SHOPEE_APP_ID")
SECRET_KEY = os.getenv("SHOPEE_SECRET")
BASE_URL   = "https://open-api.affiliate.shopee.com.br/graphql"

def gerar_assinatura(app_id: str, timestamp: str, payload: str, secret: str) -> str:
    # A string completa é a mensagem, sem chave separada
    string = f"{app_id}{timestamp}{payload}{secret}"
    return hashlib.sha256(string.encode("utf-8")).hexdigest()

def get_headers(payload: str) -> dict:
    timestamp = str(int(time.time()))
    assinatura = gerar_assinatura(APP_ID, timestamp, payload, SECRET_KEY)
    return {
        "Content-Type": "application/json",
        "Authorization": f"SHA256 Credential={APP_ID}, Timestamp={timestamp}, Signature={assinatura}"
    }

def testar_autenticacao():
    payload = json.dumps({
        "query": "{ productOfferV2(keyword: \"celular\", page: 1, limit: 3) { nodes { itemId productName priceMin priceMax priceDiscountRate commissionRate offerLink imageUrl } pageInfo { page limit hasNextPage } } }"
    })

    response = requests.post(
        BASE_URL,
        headers=get_headers(payload),
        data=payload
    )

    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Resposta: {json.dumps(result, indent=2, ensure_ascii=False)}")

if __name__ == "__main__":
    testar_autenticacao()