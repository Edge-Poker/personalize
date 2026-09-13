import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/types/database";

export type TabelaComRascunho =
  | "pages"
  | "sections"
  | "services"
  | "projects"
  | "testimonials"
  | "site_settings";

type Cliente = SupabaseClient<Database>;

/**
 * Rascunho e publicado, separados - e a separacao e por tabela, nao por
 * coluna, porque RLS filtra linha e nao coluna. A explicacao longa esta na
 * migration 0004.
 *
 * O rascunho guarda so os campos alterados. Publicar e copiar esses campos
 * para a linha real; pre-visualizar e sobrepor o rascunho a linha real, na
 * memoria, sem gravar nada.
 */

export type Rascunho = { registro_id: string; dados: Record<string, unknown> };

/** Todos os rascunhos de uma tabela, indexados pelo id do registro. */
export async function rascunhosDaTabela(
  supabase: Cliente,
  tabela: TabelaComRascunho,
): Promise<Map<string, Record<string, unknown>>> {
  const { data, error } = await supabase
    .from("rascunhos")
    .select("registro_id, dados")
    .eq("tabela", tabela);

  if (error) throw new Error(`Falha ao ler rascunhos de ${tabela}: ${error.message}`);

  return new Map(
    (data ?? []).map((linha) => [linha.registro_id, (linha.dados ?? {}) as Record<string, unknown>]),
  );
}

/** Sobrepoe o rascunho a linha publicada. Nao grava nada. */
export function comRascunho<T extends object>(
  linha: T,
  rascunho: Record<string, unknown> | undefined,
): T {
  if (!rascunho) return linha;
  return { ...linha, ...rascunho };
}

/**
 * Grava uma alteracao de rascunho, mesclando com o que ja estava la.
 *
 * O merge acontece aqui e nao no banco porque duas edicoes seguidas em campos
 * diferentes tem de somar: mudar o titulo e depois o resumo nao pode apagar a
 * mudanca do titulo.
 */
export async function salvarRascunho(
  supabase: Cliente,
  tabela: TabelaComRascunho,
  registroId: string,
  campos: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const { data: existente } = await supabase
    .from("rascunhos")
    .select("dados")
    .eq("tabela", tabela)
    .eq("registro_id", registroId)
    .maybeSingle();

  const anterior = (existente?.dados ?? {}) as Record<string, unknown>;

  const { error } = await supabase.from("rascunhos").upsert(
    {
      tabela,
      registro_id: registroId,
      dados: { ...anterior, ...campos } as Json,
      atualizado_por: userId,
    },
    { onConflict: "tabela,registro_id" },
  );

  if (error) throw new Error(`Falha ao salvar rascunho: ${error.message}`);
}

export async function descartarRascunho(
  supabase: Cliente,
  tabela: TabelaComRascunho,
  registroId: string,
): Promise<void> {
  const { error } = await supabase
    .from("rascunhos")
    .delete()
    .eq("tabela", tabela)
    .eq("registro_id", registroId);

  if (error) throw new Error(`Falha ao descartar rascunho: ${error.message}`);
}

/**
 * Publica: copia o rascunho para a linha real e apaga o rascunho.
 *
 * Nao e transacao. Se o update passar e o delete falhar, o conteudo fica no ar
 * e o rascunho sobra dizendo a mesma coisa - inofensivo, e a proxima
 * publicacao limpa. O contrario (apagar o rascunho sem gravar) seria perda de
 * texto, e por isso o update vem primeiro.
 */
export async function publicarRascunho(
  supabase: Cliente,
  tabela: TabelaComRascunho,
  registroId: string,
): Promise<{ publicou: boolean }> {
  const { data: rascunho } = await supabase
    .from("rascunhos")
    .select("dados")
    .eq("tabela", tabela)
    .eq("registro_id", registroId)
    .maybeSingle();

  if (!rascunho) return { publicou: false };

  const campos = (rascunho.dados ?? {}) as Record<string, unknown>;
  if (Object.keys(campos).length === 0) {
    await descartarRascunho(supabase, tabela, registroId);
    return { publicou: false };
  }

  /*
    O ramo separado nao e enfeite: site_settings e a unica tabela com rascunho
    cuja chave primaria e `chave` e nao `id`. Escrever isso como uma variavel
    `chave = tabela === "site_settings" ? "chave" : "id"` compila para o
    supabase-js como a intersecao das colunas de todas as tabelas do uniao - e
    nem `id` nem `chave` sobrevivem a essa intersecao.
  */
  const { error } =
    tabela === "site_settings"
      ? await supabase.from("site_settings").update(campos as never).eq("chave", registroId)
      : await supabase.from(tabela).update(campos as never).eq("id", registroId);

  if (error) throw new Error(`Falha ao publicar: ${error.message}`);

  await descartarRascunho(supabase, tabela, registroId);
  return { publicou: true };
}
