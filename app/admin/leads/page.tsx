import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { perguntasPublicas } from "@/lib/briefing";
import { mudarStatusDoLead } from "./acoes";
import { ApagarLead } from "./apagar";

/*
  O vocabulario da 0014. Precisa bater com o CHECK `leads_status_check`:
  divergir aqui nao daria erro de tipo, daria um update recusado pelo banco em
  silencio, com o <select> oferecendo uma opcao que nunca grava.
*/
const STATUS = ["novo", "em conversa", "proposta enviada", "fechado", "perdido"] as const;

type Busca = { status?: string; q?: string };

export default async function Leads({ searchParams }: { searchParams: Promise<Busca> }) {
  const { supabase } = await exigirAdmin();
  const { status: filtro, q } = await searchParams;

  let consulta = supabase
    .from("leads")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(200);

  if (filtro && (STATUS as readonly string[]).includes(filtro)) {
    consulta = consulta.eq("status", filtro);
  }

  /*
    Busca em nome, e-mail e whatsapp.

    `%` e `,` saem antes de entrar na expressao: o `or` do PostgREST separa
    condicoes por virgula, entao um nome com virgula viraria duas condicoes
    malformadas em vez de uma busca.
  */
  const busca = (q ?? "").trim();
  if (busca) {
    const seguro = busca.replace(/[,%]/g, " ");
    consulta = consulta.or(
      `nome.ilike.%${seguro}%,email.ilike.%${seguro}%,whatsapp.ilike.%${seguro}%`,
    );
  }

  const [{ data: leads, error }, perguntas] = await Promise.all([consulta, perguntasPublicas()]);

  // Para ler resposta de briefing em portugues em vez de slug. As perguntas sao
  // editaveis, entao o mapa e montado do banco e nao de uma lista aqui.
  const rotulos = new Map<string, { enunciado: string; opcoes: Map<string, string> }>();
  for (const pergunta of perguntas) {
    rotulos.set(pergunta.chave, {
      enunciado: pergunta.enunciado,
      opcoes: new Map(pergunta.opcoes.map((o) => [o.valor, o.rotulo])),
    });
  }

  if (error) {
    return (
      <div>
        <h1 className="titulo-2">Leads</h1>
        <p role="alert" className="corpo medida mt-[var(--e4)]">
          Não consegui ler os leads: {error.message}. Se isso persistir, confira se as migrations
          foram aplicadas e se a sua conta está na tabela <code>admins</code>.
        </p>
      </div>
    );
  }

  const lista = leads ?? [];

  return (
    <div>
      <h1 className="titulo-2">Leads</h1>

      {/* Filtro e busca em GET: o estado fica na url, então um filtro aplicado
          vira um link que dá para guardar e recarregar. */}
      <form className="mt-[var(--e4)] flex flex-wrap items-end gap-[var(--e3)]">
        <label className="grid gap-[4px]">
          <span className="nota">situação</span>
          <select
            name="status"
            defaultValue={filtro ?? ""}
            className="rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e2)] py-[4px] text-[15px]"
          >
            <option value="">todas</option>
            {STATUS.map((situacao) => (
              <option key={situacao} value={situacao}>
                {situacao}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-[4px]">
          <span className="nota">busca</span>
          <input
            name="q"
            defaultValue={busca}
            placeholder="nome, e-mail ou whatsapp"
            className="rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e2)] py-[4px] text-[15px]"
          />
        </label>

        <button type="submit" className="enlace corpo-p">
          filtrar
        </button>

        {filtro || busca ? (
          <Link href="/admin/leads" className="enlace corpo-p">
            limpar
          </Link>
        ) : null}
      </form>

      <p className="nota mt-[var(--e3)]">
        {lista.length === 200
          ? "200 leads (o teto da consulta — há mais)"
          : `${lista.length} lead(s)`}
      </p>

      {lista.length === 0 ? (
        <p className="corpo medida mt-[var(--e4)]">
          {filtro || busca
            ? "Nenhum lead com esse filtro."
            : "Ninguém escreveu ainda. Quando alguém mandar mensagem pelo formulário de contato ou terminar um briefing, o contato aparece aqui e um aviso vai para o seu e-mail."}
        </p>
      ) : (
        <ul className="mt-[var(--e5)] border-t border-[var(--linha)]">
          {lista.map((lead) => {
            const respostas = (lead.respostas ?? {}) as Record<string, string | string[]>;
            const temBriefing = lead.origem === "briefing" && Object.keys(respostas).length > 0;

            return (
              <li key={lead.id} className="border-b border-[var(--linha)] py-[var(--e4)]">
                <div className="flex flex-wrap items-baseline justify-between gap-[var(--e3)]">
                  <h2 className="titulo-4">
                    {lead.nome} <span className="nota">· {lead.origem}</span>
                  </h2>
                  <p className="nota">
                    {new Date(lead.criado_em).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                <ul className="mt-[var(--e2)]">
                  {lead.email ? (
                    <li className="corpo-p">
                      <a href={`mailto:${lead.email}`} className="enlace">
                        {lead.email}
                      </a>
                    </li>
                  ) : null}
                  {lead.whatsapp ? (
                    <li className="corpo-p">
                      <a
                        href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                        className="enlace"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {lead.whatsapp}
                      </a>
                    </li>
                  ) : null}
                </ul>

                {lead.mensagem ? (
                  <p className="corpo medida mt-[var(--e3)] whitespace-pre-line">{lead.mensagem}</p>
                ) : null}

                {/*
                  As respostas ao lado do que elas geraram, como pede o 5.2. O
                  ponto é conseguir olhar para a faixa e ver de onde ela veio,
                  sem precisar abrir a tabela de pesos.
                */}
                {temBriefing ? (
                  <div className="mt-[var(--e4)] grid gap-[var(--e4)] md:grid-cols-2">
                    <dl className="grid gap-[var(--e2)]">
                      {perguntas.map((pergunta) => {
                        const bruto = respostas[pergunta.chave];
                        if (bruto === undefined) return null;
                        const mapa = rotulos.get(pergunta.chave);
                        const itens = Array.isArray(bruto) ? bruto : [bruto];
                        const texto = itens.map((valor) => mapa?.opcoes.get(valor) ?? valor).join(", ");
                        return (
                          <div key={pergunta.chave}>
                            <dt className="nota">{mapa?.enunciado ?? pergunta.chave}</dt>
                            <dd className="corpo-p">{texto || "—"}</dd>
                          </div>
                        );
                      })}
                    </dl>

                    <div className="border-l border-[var(--linha)] pl-[var(--e4)]">
                      <p className="nota">o que isso gerou</p>
                      <p className="titulo-4 mt-[var(--e2)]">
                        {lead.faixa_estimada ?? "sem faixa (tipo indefinido)"}
                      </p>
                      {lead.prazo_estimado ? (
                        <p className="corpo-p mt-[var(--e1)]">{lead.prazo_estimado}</p>
                      ) : null}
                      {lead.direcao_visual ? (
                        <p className="nota mt-[var(--e2)]">direção: {lead.direcao_visual}</p>
                      ) : null}
                      <p className="nota mt-[var(--e3)]">
                        <a
                          href={`/briefing/${lead.token_retorno}`}
                          className="enlace"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          abrir como o cliente vê
                        </a>
                      </p>
                    </div>
                  </div>
                ) : null}

                <form
                  action={mudarStatusDoLead}
                  className="mt-[var(--e3)] flex flex-wrap items-center gap-[var(--e2)]"
                >
                  <input type="hidden" name="id" value={lead.id} />
                  <label htmlFor={`status-${lead.id}`} className="nota">
                    situação
                  </label>
                  <select
                    id={`status-${lead.id}`}
                    name="status"
                    defaultValue={lead.status}
                    className="rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e2)] py-[4px] text-[15px]"
                  >
                    {STATUS.map((situacao) => (
                      <option key={situacao} value={situacao}>
                        {situacao}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="enlace corpo-p">
                    mudar
                  </button>
                </form>

                {/* Longe do <select> de status de propósito: é o único controle
                    desta lista que não tem desfazer, e ele encostado no que se
                    usa o tempo todo é um clique errado esperando acontecer. */}
                <div className="mt-[var(--e3)] flex justify-end">
                  <ApagarLead id={lead.id} nome={lead.nome} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
