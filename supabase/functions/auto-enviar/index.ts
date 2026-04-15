import { createClient } from "jsr:@supabase/supabase-js@2"
import { gerarLinkRastreavel, enviarTelegram } from "../_shared/index.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const INTERVALO_MINUTOS = 5

Deno.serve(async (_req) => {
  let processados = 0
  let enviados    = 0

  // Busca todos os usuários com auto-envio ativo, plano Pro ou Premium e credenciais configuradas
  const { data: perfis, error: erroPerfis } = await supabase
    .from("profiles")
    .select("id, plan, telegram_bot_token, telegram_chat_id, telegram_template, shopee_app_id, shopee_secret, ultima_auto_envio_em")
    .eq("auto_enviar", true)
    .in("plan", ["pro", "premium"])
    .not("telegram_bot_token", "is", null)
    .not("telegram_chat_id",   "is", null)
    .not("shopee_app_id",      "is", null)
    .not("shopee_secret",      "is", null)

  if (erroPerfis) {
    console.error("Erro ao buscar perfis:", erroPerfis.message)
    return Response.json({ ok: false, erro: erroPerfis.message }, { status: 500 })
  }

  if (!perfis || perfis.length === 0) {
    return Response.json({ ok: true, processados: 0, enviados: 0 })
  }

  const agora = new Date()

  for (const perfil of perfis) {
    // Verifica se o intervalo de 5 minutos já expirou
    if (perfil.ultima_auto_envio_em) {
      const ultimoEnvio   = new Date(perfil.ultima_auto_envio_em)
      const minutoPassados = (agora.getTime() - ultimoEnvio.getTime()) / 1000 / 60
      if (minutoPassados < INTERVALO_MINUTOS) continue
    }

    processados++

    // Busca as 10 próximas ofertas pendentes do usuário (mais antigas primeiro)
    const { data: ofertas } = await supabase
      .from("ofertas")
      .select("*")
      .eq("user_id", perfil.id)
      .eq("status", "pendente")
      .order("criado_em", { ascending: true })
      .limit(10)

    if (!ofertas || ofertas.length === 0) continue

    let enviadosNoCiclo = 0

    for (const oferta of ofertas) {
      if (!oferta.link_afiliado) {
        console.warn(`Oferta ${oferta.id} sem link_afiliado — pulando`)
        continue
      }

      try {
        const linkFinal = await gerarLinkRastreavel(oferta.link_afiliado, perfil.shopee_app_id, perfil.shopee_secret)
        if (!linkFinal) {
          console.warn(`Falha ao gerar link rastreável para oferta ${oferta.id}`)
          continue
        }

        const ofertaComLink = { ...oferta, link_afiliado: linkFinal }
        const sucesso = await enviarTelegram(ofertaComLink, perfil.telegram_bot_token, perfil.telegram_chat_id, perfil.telegram_template)

        if (!sucesso) {
          console.warn(`Falha ao enviar oferta ${oferta.id} no Telegram do usuário ${perfil.id}`)
          continue
        }

        await supabase
          .from("ofertas")
          .update({ status: "enviado", enviado_em: new Date().toISOString() })
          .eq("id", oferta.id)

        enviados++
        enviadosNoCiclo++
      } catch (e) {
        console.error(`Erro inesperado na oferta ${oferta.id}:`, (e as Error).message)
      }
    }

    // Atualiza ultima_auto_envio_em apenas se ao menos uma oferta foi processada no ciclo
    if (enviadosNoCiclo > 0) {
      await supabase
        .from("profiles")
        .update({ ultima_auto_envio_em: agora.toISOString() })
        .eq("id", perfil.id)
    }
  }

  console.log(`Auto-envio concluído — processados: ${processados}, enviados: ${enviados}`)
  return Response.json({ ok: true, processados, enviados })
})
