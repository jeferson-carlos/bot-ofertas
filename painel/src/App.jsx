import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

const API_URL = import.meta.env.VITE_API_URL
const FUNCTION_URL = "https://dkyvmwhbriomarhodhgz.supabase.co/functions/v1/enviar-oferta"


const STATUS_LABELS = {
  pendente:   { label: "Pendentes",   cor: "#f59e0b" },
  enviado:    { label: "Enviadas",    cor: "#10b981" },
  descartado: { label: "Descartadas", cor: "#ef4444" },
}



export default function App() {
  console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL)
  console.log("SUPABASE KEY:", import.meta.env.VITE_SUPABASE_KEY?.slice(0, 15))
  const [ofertas, setOfertas]   = useState([])
  const [filtro, setFiltro]     = useState("pendente")
  const [loading, setLoading]   = useState(true)
  const [acao, setAcao]         = useState(null) // id da oferta em ação

  async function carregarOfertas() {
    setLoading(true)
    const { data } = await supabase
      .from("ofertas")
      .select("*")
      .eq("status", filtro)
      .order("criado_em", { ascending: false })
    setOfertas(data || [])
    setLoading(false)
  }

  useEffect(() => { carregarOfertas() }, [filtro])

  async function enviar(id) {
  setAcao(id)
  await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, acao: "enviar" })
  })
  await carregarOfertas()
  setAcao(null)
}

  async function descartar(id) {
  setAcao(id)
  await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, acao: "descartar" })
  })
  await carregarOfertas()
  setAcao(null)
}

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.titulo}>🛒 Painel de Ofertas</h1>
        <p style={styles.subtitulo}>Gerencie e dispare ofertas para o Telegram</p>
      </div>

      {/* Filtros */}
      <div style={styles.filtros}>
        {Object.entries(STATUS_LABELS).map(([key, { label, cor }]) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            style={{
              ...styles.filtroBotao,
              borderColor: cor,
              background: filtro === key ? cor : "transparent",
              color: filtro === key ? "#fff" : cor,
            }}
          >
            {label}
          </button>
        ))}
        <button onClick={carregarOfertas} style={styles.recarregar}>🔄</button>
      </div>

      {/* Lista */}
      {loading ? (
        <p style={styles.loading}>Carregando...</p>
      ) : ofertas.length === 0 ? (
        <p style={styles.loading}>Nenhuma oferta {STATUS_LABELS[filtro].label.toLowerCase()}.</p>
      ) : (
        <div style={styles.grid}>
          {ofertas.map(oferta => (
            <div key={oferta.id} style={styles.card}>

              {/* Imagem */}
              {oferta.imagem_url && (
                <img src={oferta.imagem_url} alt={oferta.titulo} style={styles.imagem} />
              )}

              {/* Badge desconto */}
              <div style={styles.badge}>
                {oferta.percentual_desconto}% OFF
              </div>

              {/* Info */}
              <div style={styles.info}>
                <p style={styles.cardTitulo}>{oferta.titulo}</p>
                <p style={styles.loja}>🏪 {oferta.loja || "Shopee"}</p>
                <div style={styles.precos}>
                  <span style={styles.precoOriginal}>
                    R$ {parseFloat(oferta.preco_original).toFixed(2)}
                  </span>
                  <span style={styles.precoDesconto}>
                    R$ {parseFloat(oferta.preco_desconto).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Ações */}
              {filtro === "pendente" && (
                <div style={styles.acoes}>
                  <button
                    onClick={() => enviar(oferta.id)}
                    disabled={acao === oferta.id}
                    style={styles.botaoEnviar}
                  >
                    {acao === oferta.id ? "Enviando..." : "✈️ Enviar"}
                  </button>
                  <button
                    onClick={() => descartar(oferta.id)}
                    disabled={acao === oferta.id}
                    style={styles.botaoDescartar}
                  >
                    🗑️ Descartar
                  </button>
                </div>
              )}

              {/* Link */}
              <a href={oferta.link_afiliado} target="_blank" rel="noreferrer" style={styles.link}>
                Ver produto →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container:      { minHeight: "100vh", background: "#0f1117", padding: "24px", fontFamily: "sans-serif" },
  header:         { textAlign: "center", marginBottom: "24px" },
  titulo:         { color: "#e2e8f0", fontSize: "24px", marginBottom: "4px" },
  subtitulo:      { color: "#6b7280", fontSize: "14px" },
  filtros:        { display: "flex", gap: "10px", justifyContent: "center", marginBottom: "24px", flexWrap: "wrap" },
  filtroBotao:    { padding: "8px 20px", borderRadius: "20px", border: "1.5px solid", cursor: "pointer", fontWeight: "bold", fontSize: "13px", transition: "all 0.2s" },
  recarregar:     { padding: "8px 12px", borderRadius: "20px", border: "1.5px solid #374151", background: "transparent", color: "#9ca3af", cursor: "pointer", fontSize: "13px" },
  loading:        { textAlign: "center", color: "#6b7280", marginTop: "48px" },
  grid:           { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", maxWidth: "1200px", margin: "0 auto" },
  card:           { background: "#1e293b", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" },
  imagem:         { width: "100%", height: "200px", objectFit: "cover" },
  badge:          { position: "absolute", top: "10px", right: "10px", background: "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" },
  info:           { padding: "14px" },
  cardTitulo:     { color: "#e2e8f0", fontSize: "13px", marginBottom: "6px", lineHeight: "1.4" },
  loja:           { color: "#6b7280", fontSize: "12px", marginBottom: "8px" },
  precos:         { display: "flex", alignItems: "center", gap: "10px" },
  precoOriginal:  { color: "#6b7280", fontSize: "12px", textDecoration: "line-through" },
  precoDesconto:  { color: "#10b981", fontSize: "18px", fontWeight: "bold" },
  acoes:          { display: "flex", gap: "8px", padding: "0 14px 10px" },
  botaoEnviar:    { flex: 1, padding: "10px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  botaoDescartar: { flex: 1, padding: "10px", background: "#374151", color: "#9ca3af", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  link:           { textAlign: "center", color: "#6366f1", fontSize: "12px", padding: "10px", textDecoration: "none" },
}