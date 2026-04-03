"""
Debug: mostra o retorno bruto da Shopee API para uma keyword.
Uso: python debug_busca.py "capa de celular"
"""
import hashlib, time, json, requests, sys, os
from dotenv import load_dotenv

load_dotenv()

APP_ID     = os.getenv("SHOPEE_APP_ID")
SECRET_KEY = os.getenv("SHOPEE_SECRET")
BASE_URL   = "https://open-api.affiliate.shopee.com.br/graphql"

def gerar_assinatura(payload):
    timestamp = str(int(time.time()))
    string = f"{APP_ID}{timestamp}{payload}{SECRET_KEY}"
    sig = hashlib.sha256(string.encode()).hexdigest()
    return timestamp, sig

def buscar(keyword, list_type=1, sort_type=5, limite=50):
    payload = json.dumps({
        "query": f"""{{
          productOfferV2(
            keyword: "{keyword}",
            listType: {list_type},
            sortType: {sort_type},
            page: 1,
            limit: {limite}
          ) {{
            nodes {{
              itemId productName priceMin priceMax
              priceDiscountRate commissionRate
              offerLink imageUrl shopName
            }}
            pageInfo {{ page limit hasNextPage }}
          }}
        }}"""
    })

    timestamp, sig = gerar_assinatura(payload)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"SHA256 Credential={APP_ID}, Timestamp={timestamp}, Signature={sig}"
    }

    res  = requests.post(BASE_URL, headers=headers, data=payload)
    data = res.json()

    if "errors" in data:
        print(f"❌ Erro na API: {data['errors']}")
        return

    nodes    = data["data"]["productOfferV2"]["nodes"]
    pageInfo = data["data"]["productOfferV2"]["pageInfo"]

    print(f"\n{'='*60}")
    print(f"Keyword   : {keyword}")
    print(f"listType  : {list_type}  |  sortType: {sort_type}")
    print(f"Retornados: {len(nodes)} produtos  |  hasNextPage: {pageInfo['hasNextPage']}")
    print(f"{'='*60}\n")

    aprovados  = 0
    descartados = 0

    for i, n in enumerate(nodes, 1):
        preco_max = float(n.get("priceMax") or 0)
        preco_min = float(n.get("priceMin") or 0)
        taxa_api  = float(n.get("priceDiscountRate") or 0)

        # Desconto calculado a partir dos preços reais
        if preco_max > 0 and preco_min < preco_max:
            taxa_calc = round((1 - preco_min / preco_max) * 100, 1)
        else:
            taxa_calc = 0.0

        passou = taxa_calc >= 10
        if passou:
            aprovados += 1
        else:
            descartados += 1

        status = "✅ PASSOU" if passou else f"❌ descartado"
        print(f"[{i:02d}] {status}")
        print(f"     Nome       : {n['productName'][:70]}")
        print(f"     Loja       : {n.get('shopName', 'N/A')}")
        print(f"     Preço      : R$ {preco_max} → R$ {preco_min}")
        print(f"     Desc. API  : {taxa_api:.1f}%  |  Desc. CALC: {taxa_calc:.1f}%  |  Comissão: {n.get('commissionRate', 'N/A')}")
        print()

    print(f"{'='*60}")
    print(f"Resumo: {aprovados} aprovados / {descartados} descartados pelo filtro de 10%")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    keyword = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "oferta"

    # Testa com listType=1 (configuração atual)
    buscar(keyword, list_type=1, sort_type=5)

    # Testa com listType=0 (sem restrição de tipo)
    buscar(keyword, list_type=0, sort_type=5)
