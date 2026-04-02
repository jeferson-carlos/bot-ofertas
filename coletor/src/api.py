from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.telegram import enviar_oferta
from src.supabase_client import supabase
from datetime import datetime, timezone

app = FastAPI()

# Libera o painel React chamar a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class OfertaRequest(BaseModel):
    id: str

@app.post("/enviar")
def enviar(req: OfertaRequest):
    """Recebe o ID da oferta, dispara no Telegram e atualiza status."""

    # Busca a oferta no Supabase
    resultado = supabase.table("ofertas") \
        .select("*") \
        .eq("id", req.id) \
        .single() \
        .execute()

    oferta = resultado.data

    if not oferta:
        return {"ok": False, "erro": "Oferta não encontrada"}

    if oferta["status"] == "enviado":
        return {"ok": False, "erro": "Oferta já foi enviada"}

    # Dispara no Telegram
    sucesso = enviar_oferta(oferta)

    if not sucesso:
        return {"ok": False, "erro": "Falha ao enviar no Telegram"}

    # Atualiza status no Supabase
    supabase.table("ofertas") \
        .update({
            "status": "enviado",
            "enviado_em": datetime.now(timezone.utc).isoformat()
        }) \
        .eq("id", req.id) \
        .execute()

    return {"ok": True}

@app.post("/descartar")
def descartar(req: OfertaRequest):
    """Marca a oferta como descartada."""
    supabase.table("ofertas") \
        .update({"status": "descartado"}) \
        .eq("id", req.id) \
        .execute()

    return {"ok": True}

@app.get("/health")
def health():
    return {"status": "ok"}