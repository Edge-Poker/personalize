"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { publicarRascunho, salvarRascunho, type TabelaComRascunho } from "@/lib/rascunhos";
import type { Json } from "@/lib/types/database";

const TABELAS = ["pages", "sections", "services", "projects", "testimonials", "site_settings"] as const;

/**
 * Publica exatamente os registros que acabaram de ser salvos.
 *
 * Existe porque a barra flutuante salvava rascunho e deixava a pessoa sem
 * saber onde publicar — era preciso adivinhar que a resposta estava em /admin.
 * Salvar e publicar são passos diferentes de propósito, mas o segundo tem de
 * estar ao alcance da mão no momento em que o primeiro termina.
 *
 * Publica só o que veio na lista, e não tudo que está pendente: rascunho de
 * outra página não pode ir ao ar de carona.
 */
export async function publicarRegistros(
  alvos: { tabela: string; registroId: string }[],
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const { supabase } = await exigirAdmin();

  const analise = z
    .array(z.object({ tabela: z.enum(TABELAS), registroId: z.string().min(1).max(200) }))
    .min(1)
    .max(50)
    .safeParse(alvos);

  if (!analise.success) return { ok: false, erro: "Não entendi o que publicar." };

  try {
    for (const alvo of analise.data) {
      await publicarRascunho(supabase, alvo.tabela, alvo.registroId);
    }
  } catch (erro) {
    console.error("Falha ao publicar:", erro);
    return { ok: false, erro: "Não consegui publicar. O rascunho continua salvo." };
  }

  // As páginas públicas são estáticas com revalidação de uma hora. Sem isto,
  // publicar não apareceria na hora e pareceria que não funcionou.
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------------------------------------------------------------------
   Estrutura da página, editada do próprio site

   Estas mexem na tabela de verdade, não em rascunho. Adicionar, apagar e
   reordenar seção não tem meio-termo útil: ou o bloco está lá ou não está.
   Guardar isso como rascunho daria uma página em que metade da estrutura é a
   publicada e metade é a sua — impossível de julgar olhando.

   Texto e imagem continuam passando por rascunho, porque ali o meio-termo faz
   sentido: dá para escrever, olhar e desistir.
   --------------------------------------------------------------------------- */

const TIPOS_DE_SECAO = [
  "intro",
  "texto",
  "imagem",
  "convite",
  "servicos",
  "trabalhos",
  "heroi",
] as const;

/** Cada tipo nasce preenchido, para o bloco já aparecer e poder ser editado. */
const MODELOS: Record<string, Json> = {
  intro: { nota: "uma nota de margem", titulo: "Título da página", texto: "Uma frase de abertura." },
  texto: { nota: "sobre o quê", titulo: "Um subtítulo", paragrafos: ["Escreva aqui."] },
  imagem: { alt: "", path: "", legenda: "" },
  convite: {
    nota: "o próximo passo",
    titulo: "Uma chamada.",
    texto: "Uma frase explicando o que acontece depois.",
    acao: { rotulo: "falar comigo", href: "/contato", forte: true },
  },
  servicos: { nota: "o que eu faço" },
  trabalhos: { nota: "três trabalhos reais" },
  heroi: {
    nota: "uma nota de margem",
    titulo: "Um título grande.",
    voz: { calmo: "Escreva aqui.", direto: "Escreva aqui.", autoral: "Escreva aqui." },
    acoes: [],
  },
};

const COLUNA_DO_DONO = {
  pagina: "page_id",
  trabalho: "project_id",
  servico: "service_id",
} as const;

export async function inserirSecao(
  dono: { tipo: "pagina" | "trabalho" | "servico"; id: string },
  tipo: string,
  depoisDaOrdem: number,
): Promise<void> {
  const { supabase } = await exigirAdmin();

  const analise = z
    .object({
      dono: z.object({
        tipo: z.enum(["pagina", "trabalho", "servico"]),
        id: z.string().uuid(),
      }),
      tipo: z.enum(TIPOS_DE_SECAO),
      depoisDaOrdem: z.number().int().min(0).max(9999),
    })
    .safeParse({ dono, tipo, depoisDaOrdem });

  if (!analise.success) return;

  const coluna = COLUNA_DO_DONO[analise.data.dono.tipo];

  /*
    Abre espaço empurrando quem vem depois, em vez de inserir com ordem
    fracionária. Fracionária funciona até alguém reordenar pelo painel e ficar
    com 10, 10.5 e 11 na tela.
  */
  const { data: posteriores } = await supabase
    .from("sections")
    .select("id, ordem")
    .eq(coluna, analise.data.dono.id)
    .gt("ordem", analise.data.depoisDaOrdem)
    .order("ordem");

  for (const secao of posteriores ?? []) {
    await supabase
      .from("sections")
      .update({ ordem: secao.ordem + 10 })
      .eq("id", secao.id);
  }

  // Colunas explícitas em vez de chave computada: com [coluna] o TypeScript
  // perde o formato da linha e o supabase-js recusa o objeto inteiro.
  await supabase.from("sections").insert({
    page_id: coluna === "page_id" ? analise.data.dono.id : null,
    project_id: coluna === "project_id" ? analise.data.dono.id : null,
    service_id: coluna === "service_id" ? analise.data.dono.id : null,
    tipo: analise.data.tipo,
    ordem: analise.data.depoisDaOrdem + 5,
    dados: MODELOS[analise.data.tipo] ?? {},
    visivel: true,
  });

  revalidatePath("/", "layout");
  revalidatePath("/editar", "layout");
}

export async function apagarSecao(secaoId: string): Promise<void> {
  const { supabase } = await exigirAdmin();
  const analise = z.string().uuid().safeParse(secaoId);
  if (!analise.success) return;

  // O rascunho da seção vai junto: deixar rascunho órfão apontando para seção
  // apagada encheria a lista do painel de fantasma.
  await supabase.from("rascunhos").delete().eq("tabela", "sections").eq("registro_id", analise.data);
  await supabase.from("sections").delete().eq("id", analise.data);

  revalidatePath("/", "layout");
  revalidatePath("/editar", "layout");
}

export async function moverSecao(secaoId: string, direcao: "cima" | "baixo"): Promise<void> {
  const { supabase } = await exigirAdmin();

  const analise = z
    .object({ secaoId: z.string().uuid(), direcao: z.enum(["cima", "baixo"]) })
    .safeParse({ secaoId, direcao });

  if (!analise.success) return;

  const { data: atual } = await supabase
    .from("sections")
    .select("id, page_id, project_id, service_id, ordem")
    .eq("id", analise.data.secaoId)
    .maybeSingle();

  if (!atual) return;

  // O dono sai da própria linha: o check no banco garante que só um está
  // preenchido, então não há ambiguidade para resolver aqui.
  const coluna = atual.page_id ? "page_id" : atual.project_id ? "project_id" : "service_id";
  const donoId = atual.page_id ?? atual.project_id ?? atual.service_id;
  if (!donoId) return;

  // Troca de lugar com a vizinha, em vez de somar ou subtrair da ordem: assim
  // funciona mesmo se as ordens estiverem em 10, 20, 37, 40.
  const { data: vizinha } = await supabase
    .from("sections")
    .select("id, ordem")
    .eq(coluna, donoId)
    [analise.data.direcao === "cima" ? "lt" : "gt"]("ordem", atual.ordem)
    .order("ordem", { ascending: analise.data.direcao !== "cima" })
    .limit(1)
    .maybeSingle();

  if (!vizinha) return;

  await supabase.from("sections").update({ ordem: vizinha.ordem }).eq("id", atual.id);
  await supabase.from("sections").update({ ordem: atual.ordem }).eq("id", vizinha.id);

  revalidatePath("/", "layout");
  revalidatePath("/editar", "layout");
}

export type ItemDeMidia = {
  id: string;
  path: string;
  alt: string;
  largura: number | null;
  altura: number | null;
};

/**
 * A mediateca, para o seletor de imagem do editor.
 *
 * Passa por exigirAdmin como todo o resto: a tabela `media` tem leitura
 * pública, mas esta rota não deveria responder para quem não está editando.
 */
export async function listarMidia(): Promise<ItemDeMidia[]> {
  const { supabase } = await exigirAdmin();

  const { data, error } = await supabase
    .from("media")
    .select("id, path, alt, largura, altura")
    .order("criado_em", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Falha ao listar mídia:", error);
    return [];
  }

  return data ?? [];
}

/** Colunas que não são texto e precisam de conversão antes de gravar. */
const CAMPOS_NUMERICOS = new Set(["projects.ano"]);

const esquema = z.array(
  z.object({
    tabela: z.enum(TABELAS),
    registroId: z.string().min(1).max(200),
    // Caminho e nome de campo, com no maximo um nivel de jsonb. Sem isto,
    // um caminho como "__proto__.x" viraria escrita em lugar indevido.
    caminho: z
      .string()
      .regex(/^[a-z_][a-z0-9_]*(\.[a-z0-9_]+)?$/i, "Caminho de campo inválido."),
    valor: z.string().max(20000),
  }),
).min(1).max(100);

/** Escreve `valor` em `caminho`, criando o objeto intermediario se faltar. */
function definirEmCaminho(
  alvo: Record<string, unknown>,
  caminho: string,
  valor: unknown,
): Record<string, unknown> {
  const partes = caminho.split(".");
  const primeira = partes[0]!;

  if (partes.length === 1) {
    return { ...alvo, [primeira]: valor };
  }

  const segunda = partes[1]!;
  const ninho = (alvo[primeira] ?? {}) as Record<string, unknown>;

  // Array dentro de jsonb ("paragrafos.0") precisa continuar array depois da
  // escrita, senao o Zod da secao rejeita e o bloco some da pagina.
  if (Array.isArray(ninho)) {
    const copia = [...(ninho as unknown[])];
    copia[Number(segunda)] = valor;
    return { ...alvo, [primeira]: copia };
  }

  return { ...alvo, [primeira]: { ...ninho, [segunda]: valor } };
}

export async function salvarEdicoes(
  alteracoes: { tabela: string; registroId: string; caminho: string; valor: string }[],
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const { supabase, user } = await exigirAdmin();

  const analise = esquema.safeParse(alteracoes);
  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0]?.message ?? "Alteração inválida." };
  }

  // Agrupa por registro: varias edicoes na mesma secao viram um rascunho so.
  const porRegistro = new Map<string, { tabela: TabelaComRascunho; registroId: string; campos: typeof analise.data }>();

  for (const alteracao of analise.data) {
    const chave = `${alteracao.tabela}:${alteracao.registroId}`;
    const grupo = porRegistro.get(chave);
    if (grupo) grupo.campos.push(alteracao);
    else
      porRegistro.set(chave, {
        tabela: alteracao.tabela,
        registroId: alteracao.registroId,
        campos: [alteracao],
      });
  }

  try {
    for (const { tabela, registroId, campos } of porRegistro.values()) {
      let atualizacao: Record<string, unknown> = {};

      if (tabela === "site_settings") {
        /*
          Mesma situação das seções, com outra coluna: o texto mora dentro do
          jsonb `valor`. Escrever { servicos_intro: "..." } direto na tabela
          tentaria gravar numa coluna que não existe.
        */
        const { data: linha } = await supabase
          .from("site_settings")
          .select("valor")
          .eq("chave", registroId)
          .maybeSingle();

        const { data: rascunho } = await supabase
          .from("rascunhos")
          .select("dados")
          .eq("tabela", "site_settings")
          .eq("registro_id", registroId)
          .maybeSingle();

        const publicado = (linha?.valor ?? {}) as Record<string, unknown>;
        const emRascunho = ((rascunho?.dados ?? {}) as Record<string, unknown>).valor as
          | Record<string, unknown>
          | undefined;

        let valor = { ...publicado, ...(emRascunho ?? {}) };
        for (const campo of campos) {
          valor = definirEmCaminho(valor, campo.caminho, campo.valor);
        }
        atualizacao = { valor };
      } else if (tabela === "sections") {
        /*
          Numa secao, o texto mora dentro do jsonb `dados`. Para nao apagar o
          resto do bloco, parto do `dados` que ja esta publicado, sobreponho o
          rascunho que ja existia e so entao aplico as edicoes desta rodada.
        */
        const { data: linha } = await supabase
          .from("sections")
          .select("dados")
          .eq("id", registroId)
          .maybeSingle();

        const { data: rascunho } = await supabase
          .from("rascunhos")
          .select("dados")
          .eq("tabela", "sections")
          .eq("registro_id", registroId)
          .maybeSingle();

        const publicado = (linha?.dados ?? {}) as Record<string, unknown>;
        const emRascunho = ((rascunho?.dados ?? {}) as Record<string, unknown>).dados as
          | Record<string, unknown>
          | undefined;

        let dados = { ...publicado, ...(emRascunho ?? {}) };
        for (const campo of campos) {
          dados = definirEmCaminho(dados, campo.caminho, campo.valor);
        }
        atualizacao = { dados };
      } else {
        for (const campo of campos) {
          /*
            Nem toda coluna é texto. `ano` é integer, e mandar a string "2025"
            para uma coluna numérica é sorte, não contrato: funciona até
            alguém digitar "dois mil e vinte e cinco" e o banco recusar com uma
            mensagem que ninguém entende.
          */
          if (CAMPOS_NUMERICOS.has(`${tabela}.${campo.caminho}`)) {
            const numero = Number(campo.valor.trim());
            if (!Number.isInteger(numero)) {
              return { ok: false, erro: `"${campo.valor}" não é um número. Escreva só os dígitos.` };
            }
            atualizacao = definirEmCaminho(atualizacao, campo.caminho, numero);
            continue;
          }
          atualizacao = definirEmCaminho(atualizacao, campo.caminho, campo.valor);
        }
      }

      await salvarRascunho(supabase, tabela, registroId, atualizacao, user.id);
    }
  } catch (erro) {
    console.error("Falha ao salvar edições:", erro);
    return {
      ok: false,
      erro: "Não consegui salvar. Seu texto continua na tela — tente de novo antes de sair.",
    };
  }

  // So a rota de edicao muda: o publicado segue igual ate voce publicar.
  revalidatePath("/editar", "layout");
  return { ok: true };
}
