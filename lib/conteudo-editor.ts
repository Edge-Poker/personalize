import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pagina, Secao, Servico, Trabalho } from "@/lib/conteudo";
import { comRascunho, rascunhosDaTabela, type TabelaComRascunho } from "@/lib/rascunhos";
import { TEXTOS_PADRAO, type Textos } from "@/lib/textos";
import type { Database } from "@/lib/types/database";

type Cliente = SupabaseClient<Database>;

/**
 * As mesmas leituras do site publico, mas com a sessao do admin e com o
 * rascunho sobreposto.
 *
 * Duas diferencas em relacao a lib/conteudo.ts:
 *
 * 1. usa o cliente com cookie, entao a RLS tambem devolve o que ainda nao foi
 *    publicado - da para editar uma pagina antes de ela ir ao ar;
 * 2. sobrepoe o rascunho na memoria, sem gravar. E isso que faz o modo de
 *    edicao mostrar o texto em que voce estava mexendo, e nao o que esta no ar.
 */

export async function paginaParaEditar(
  supabase: Cliente,
  slug: string,
): Promise<Pagina | null> {
  const { data: pagina, error } = await supabase
    .from("pages")
    .select("id, slug, titulo, seo")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar a página ${slug}: ${error.message}`);
  if (!pagina) return null;

  const { data: secoes, error: erroSecoes } = await supabase
    .from("sections")
    .select("*")
    .eq("page_id", pagina.id)
    .eq("visivel", true)
    .order("ordem");

  if (erroSecoes) throw new Error(`Falha ao carregar as seções: ${erroSecoes.message}`);

  const rascunhos = await rascunhosDaTabela(supabase, "sections");

  return {
    id: pagina.id,
    slug: pagina.slug,
    titulo: pagina.titulo,
    seo: (pagina.seo ?? {}) as Pagina["seo"],
    secoes: (secoes ?? []).map((secao) => comRascunho(secao, rascunhos.get(secao.id))),
  };
}

export async function servicosParaEditar(supabase: Cliente): Promise<Servico[]> {
  const { data, error } = await supabase.from("services").select("*").order("ordem");
  if (error) throw new Error(`Falha ao carregar os serviços: ${error.message}`);

  const rascunhos = await rascunhosDaTabela(supabase, "services");
  return (data ?? []).map((servico) => comRascunho(servico, rascunhos.get(servico.id)));
}

export async function trabalhosParaEditar(supabase: Cliente): Promise<Trabalho[]> {
  const { data, error } = await supabase.from("projects").select("*").order("ordem");
  if (error) throw new Error(`Falha ao carregar os trabalhos: ${error.message}`);

  const rascunhos = await rascunhosDaTabela(supabase, "projects");
  return (data ?? []).map((trabalho) => comRascunho(trabalho, rascunhos.get(trabalho.id)));
}

/** Ids de registros com rascunho pendente, para a barra saber o que oferecer. */
export async function comRascunhoPendente(
  supabase: Cliente,
  tabela: TabelaComRascunho,
  ids: string[],
): Promise<string[]> {
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("rascunhos")
    .select("registro_id")
    .eq("tabela", tabela)
    .in("registro_id", ids);

  return (data ?? []).map((linha) => linha.registro_id);
}

/** Os textos de interface com o rascunho sobreposto, para o modo de edição. */
export async function textosParaEditar(supabase: Cliente): Promise<Textos> {
  const { data: linha } = await supabase
    .from("site_settings")
    .select("valor")
    .eq("chave", "textos")
    .maybeSingle();

  const { data: rascunho } = await supabase
    .from("rascunhos")
    .select("dados")
    .eq("tabela", "site_settings")
    .eq("registro_id", "textos")
    .maybeSingle();

  const publicado = (linha?.valor ?? {}) as Partial<Textos>;
  const emRascunho = ((rascunho?.dados ?? {}) as { valor?: Partial<Textos> }).valor ?? {};

  return { ...TEXTOS_PADRAO, ...publicado, ...emRascunho };
}

/** Os mesmos blocos, com rascunho sobreposto e incluindo os invisíveis. */
export async function secoesParaEditar(
  supabase: Cliente,
  coluna: "project_id" | "service_id",
  donoId: string,
): Promise<Secao[]> {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq(coluna, donoId)
    .order("ordem");

  if (error) throw new Error(`Falha ao carregar os blocos: ${error.message}`);

  const rascunhos = await rascunhosDaTabela(supabase, "sections");
  return (data ?? []).map((secao) => comRascunho(secao, rascunhos.get(secao.id)));
}
