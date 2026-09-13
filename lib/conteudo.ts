import { cache } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { criarClientePublico } from "@/lib/supabase/publico";
import { TEXTOS_PADRAO, type Textos } from "@/lib/textos";
import type { Database } from "@/lib/types/database";

export type Servico = Database["public"]["Tables"]["services"]["Row"];
export type Trabalho = Database["public"]["Tables"]["projects"]["Row"];
export type Secao = Database["public"]["Tables"]["sections"]["Row"];
export type ItemNav = Database["public"]["Tables"]["nav_items"]["Row"];

/**
 * `cache` do React deduplica dentro de um mesmo request: o cabecalho e o
 * rodape pedem os ajustes, e so uma consulta sai daqui.
 */

/**
 * Erro de banco e erro, e tem de derrubar a renderizacao.
 *
 * Sem isso o modo de falha e horrivel e silencioso: com o banco fora do ar na
 * hora do build, `data` volta null, a pagina chama notFound() e a Vercel
 * publica a home como 404 - congelada assim ate a proxima revalidacao. Um
 * build que quebra e barulhento e o deploy anterior continua no ar.
 *
 * Linha ausente continua sendo null. So erro de verdade explode.
 */
function exigir<T>(
  resultado: { data: T; error: PostgrestError | null },
  oQue: string,
): T {
  if (resultado.error) {
    throw new Error(`Falha ao carregar ${oQue}: ${resultado.error.message}`);
  }
  return resultado.data;
}

export const buscarNav = cache(async (): Promise<ItemNav[]> => {
  const supabase = criarClientePublico();
  const resultado = await supabase
    .from("nav_items")
    .select("*")
    .eq("visivel", true)
    .order("ordem");
  return exigir(resultado, "a navegação") ?? [];
});

export type Ajustes = {
  marca: { nome: string; descricao: string };
  contato: { email: string; whatsapp: string; instagram: string; cidade: string };
  seo: { titulo_padrao: string; template_titulo: string; descricao_padrao: string };
};

const AJUSTES_PADRAO: Ajustes = {
  marca: { nome: "persona.lize", descricao: "Estúdio de criação de sites sob medida." },
  contato: { email: "", whatsapp: "", instagram: "", cidade: "" },
  seo: {
    titulo_padrao: "persona.lize",
    template_titulo: "%s | persona.lize",
    descricao_padrao: "Sites sob medida.",
  },
};

export const buscarAjustes = cache(async (): Promise<Ajustes> => {
  const supabase = criarClientePublico();
  const linhas = exigir(
    await supabase.from("site_settings").select("chave, valor"),
    "os ajustes do site",
  );

  const porChave = new Map((linhas ?? []).map((linha) => [linha.chave, linha.valor]));

  // Merge raso com o padrao: se voce apagar uma chave pelo painel, o site nao
  // quebra - ele volta ao padrao daquele pedaco.
  return {
    marca: { ...AJUSTES_PADRAO.marca, ...(porChave.get("marca") as object | undefined) },
    contato: { ...AJUSTES_PADRAO.contato, ...(porChave.get("contato") as object | undefined) },
    seo: { ...AJUSTES_PADRAO.seo, ...(porChave.get("seo") as object | undefined) },
  } as Ajustes;
});

export const buscarServicos = cache(async (): Promise<Servico[]> => {
  const supabase = criarClientePublico();
  const resultado = await supabase
    .from("services")
    .select("*")
    .eq("visivel", true)
    .order("ordem");
  return exigir(resultado, "os serviços") ?? [];
});

export const buscarServico = cache(async (slug: string): Promise<Servico | null> => {
  const supabase = criarClientePublico();
  const resultado = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("visivel", true)
    .maybeSingle();
  return exigir(resultado, `o serviço ${slug}`);
});

export const buscarTrabalhos = cache(async (): Promise<Trabalho[]> => {
  const supabase = criarClientePublico();
  const resultado = await supabase
    .from("projects")
    .select("*")
    .eq("visivel", true)
    .order("ordem");
  return exigir(resultado, "os trabalhos") ?? [];
});

export const buscarTrabalho = cache(async (slug: string): Promise<Trabalho | null> => {
  const supabase = criarClientePublico();
  const resultado = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("visivel", true)
    .maybeSingle();
  return exigir(resultado, `o trabalho ${slug}`);
});

export type Pagina = {
  id: string;
  slug: string;
  titulo: string;
  seo: { titulo?: string; descricao?: string };
  secoes: Secao[];
};

export const buscarPagina = cache(async (slug: string): Promise<Pagina | null> => {
  const supabase = criarClientePublico();

  const pagina = exigir(
    await supabase
      .from("pages")
      .select("id, slug, titulo, seo")
      .eq("slug", slug)
      .eq("publicado", true)
      .maybeSingle(),
    `a página ${slug}`,
  );

  // Aqui null e ausencia de verdade: a pagina nao existe ou nao esta
  // publicada. Isso e 404 legitimo.
  if (!pagina) return null;

  const secoes = exigir(
    await supabase
      .from("sections")
      .select("*")
      .eq("page_id", pagina.id)
      .eq("visivel", true)
      .order("ordem"),
    `as seções da página ${slug}`,
  );

  return {
    id: pagina.id,
    slug: pagina.slug,
    titulo: pagina.titulo,
    seo: (pagina.seo ?? {}) as Pagina["seo"],
    secoes: secoes ?? [],
  };
});

/** Slugs das paginas publicadas. Usado pelo sitemap e pelo gerador de rotas. */
export const listarSlugsDePaginas = cache(async (): Promise<string[]> => {
  const supabase = criarClientePublico();
  const resultado = await supabase.from("pages").select("slug").eq("publicado", true);
  return (exigir(resultado, "a lista de páginas") ?? []).map((p) => p.slug);
});

/**
 * Os textos de interface. Padrão do código, sobreposto pelo que está no banco.
 *
 * Chave apagada no painel volta ao padrão em vez de deixar buraco na tela —
 * mesma lógica do merge de buscarAjustes.
 */
export const buscarTextos = cache(async (): Promise<Textos> => {
  const supabase = criarClientePublico();
  const linha = exigir(
    await supabase.from("site_settings").select("valor").eq("chave", "textos").maybeSingle(),
    "os textos do site",
  );

  return { ...TEXTOS_PADRAO, ...((linha?.valor ?? {}) as Partial<Textos>) };
});

/**
 * Blocos livres de um trabalho ou de um serviço.
 *
 * A RLS já filtra por dono publicado e bloco visível, então aqui não é preciso
 * repetir a condição — só pedir pela coluna certa.
 */
export const buscarSecoesDe = cache(
  async (coluna: "project_id" | "service_id", donoId: string): Promise<Secao[]> => {
    const supabase = criarClientePublico();
    const resultado = await supabase
      .from("sections")
      .select("*")
      .eq(coluna, donoId)
      .eq("visivel", true)
      .order("ordem");
    return exigir(resultado, "os blocos da página") ?? [];
  },
);
