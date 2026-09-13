import type { PerguntaPublica, Respostas, Resultado } from "@/lib/briefing";
import { Maquete } from "@/components/briefing/maquete";

/**
 * A pagina que o cliente abre pelo link — e a mesma que o painel abre em
 * "abrir como o cliente ve".
 *
 * E componente de servidor e nao tem uma linha de javascript de cliente. Os
 * graficos sao svg com largura em porcentagem, calculada aqui: nao ha
 * biblioteca de grafico, nao ha medicao no navegador, e nada pisca enquanto
 * hidrata. Tambem imprime bem, que e o que acontece com orcamento.
 */

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function ResumoDoBriefing({
  resultado,
  respostas,
  perguntas,
  nome,
  criadoEm,
}: {
  resultado: Resultado;
  respostas: Respostas;
  perguntas: PerguntaPublica[];
  nome: string | null;
  criadoEm: string | null;
}) {
  return (
    <article className="resumo">
      <header>
        <p className="nota">{nome ? `o briefing de ${nome}` : "o seu briefing"}</p>
        <h1 className="titulo-1 medida mt-[var(--e2)]">{resultado.resumo}</h1>
        {criadoEm ? (
          <p className="nota mt-[var(--e3)]">
            respondido em{" "}
            <span className="numero">
              {new Date(criadoEm).toLocaleDateString("pt-BR", { dateStyle: "long" })}
            </span>
          </p>
        ) : null}
      </header>

      {resultado.faixa && resultado.prazo ? (
        <>
          <section className="cota">
            <p className="nota">faixa de investimento</p>
            <p className="display mt-[var(--e2)]">{resultado.faixa.texto}</p>

            {/*
              A faixa desenhada. A barra clara é o intervalo; as duas hastes são
              as pontas. Uma barra cheia sugeriria um valor; o que existe aqui é
              um intervalo, e o desenho precisa dizer isso.
            */}
            <div className="resumo-faixa mt-[var(--e4)]" aria-hidden="true">
              <span className="resumo-faixa-trilho" />
              <span className="resumo-faixa-intervalo" />
              <span className="resumo-faixa-haste resumo-faixa-haste-inicio" />
              <span className="resumo-faixa-haste resumo-faixa-haste-fim" />
            </div>
            <div className="resumo-faixa-pontas nota numero">
              <span>{moeda(resultado.faixa.min)}</span>
              {/* O "+" tem de aparecer na ponta também. Sem ele a régua diria
                  que o projeto termina em 6.500, e o título logo acima diria
                  que não — duas afirmações opostas na mesma seção. */}
              <span>
                {moeda(resultado.faixa.max)}
                {resultado.faixa.noTeto ? "+" : ""}
              </span>
            </div>

            {resultado.faixa.noTeto ? (
              <p className="nota medida mt-[var(--e4)]">
                Você marcou quase tudo o que existe aqui. A partir desse tamanho a conta para de
                fazer sentido sozinha — o valor deixa de depender de uma lista de itens e passa a
                depender de decisões que a gente toma junto. É por isso que o número termina em
                mais, e não num teto.
              </p>
            ) : null}

            {resultado.porque ? (
              <p className="nota medida mt-[var(--e4)]">{resultado.porque}</p>
            ) : null}
            <p className="nota medida mt-[var(--e2)]">
              É uma faixa, não um preço. O valor final sai depois da conversa, quando o escopo
              estiver escrito.
            </p>
          </section>

          {resultado.composicao.length > 1 ? (
            <section className="cota">
              <p className="nota">de onde vem esse número</p>

              {/* Barra empilhada: cada pedaço proporcional ao que soma. */}
              <div className="resumo-barra mt-[var(--e4)]" aria-hidden="true">
                {resultado.composicao.map((parte, indice) => (
                  <span
                    key={parte.rotulo}
                    className="resumo-fatia"
                    style={{
                      width: `${parte.fatia * 100}%`,
                      // Do aceso ao apagado, na ordem em que os pedaços entram
                      // na conta. Cor por categoria exigiria uma paleta nova
                      // só para este gráfico.
                      opacity: 1 - indice * (0.62 / Math.max(1, resultado.composicao.length - 1)),
                    }}
                  />
                ))}
              </div>

              <ul className="resumo-legenda mt-[var(--e3)]">
                {resultado.composicao.map((parte, indice) => (
                  <li key={parte.rotulo}>
                    <span
                      className="resumo-pastilha"
                      style={{
                        opacity: 1 - indice * (0.62 / Math.max(1, resultado.composicao.length - 1)),
                      }}
                      aria-hidden="true"
                    />
                    <span className="corpo-p">{parte.rotulo}</span>
                    <span className="nota numero">{Math.round(parte.fatia * 100)}%</span>
                  </li>
                ))}
              </ul>

              <p className="nota medida mt-[var(--e3)]">
                Proporções do seu projeto, calculadas sobre o meio da faixa. Servem para você ver o
                que pesa — tirar um item derruba a conta na mesma medida em que ele aparece aqui.
              </p>
            </section>
          ) : null}

          <section className="cota">
            <p className="nota">prazo estimado</p>
            <p className="titulo-1 mt-[var(--e2)]">{resultado.prazo.texto}</p>

            {/* Semanas como marcas. Contar traços é mais direto que ler um
                número quando a pergunta é "isso é muito tempo?". */}
            <div className="resumo-semanas mt-[var(--e4)]" aria-hidden="true">
              {Array.from({ length: Math.min(16, Math.max(1, Math.round(resultado.prazo.max / 7))) }).map(
                (_, indice) => (
                  <span
                    key={indice}
                    className={
                      indice < Math.round(resultado.prazo!.min / 7)
                        ? "resumo-semana resumo-semana-certa"
                        : "resumo-semana"
                    }
                  />
                ),
              )}
            </div>
            <p className="nota mt-[var(--e2)]">
              As marcas cheias são o mínimo; as vazadas, a folga até o máximo.
            </p>
          </section>
        </>
      ) : (
        <section className="cota">
          <p className="nota">faixa de investimento</p>
          <p className="corpo-g medida mt-[var(--e3)]">
            Esse caso pede uma conversa antes de qualquer número.
          </p>
          <p className="nota medida mt-[var(--e3)]">
            Sem saber que tipo de site é, qualquer faixa aqui seria invenção.
          </p>
        </section>
      )}

      {resultado.direcao ? (
        <section className="cota">
          <p className="nota">uma direção possível — {resultado.direcao.rotulo}</p>

          <div className="briefing-amostra mt-[var(--e4)]">
            <div className="briefing-paleta" aria-hidden="true">
              {resultado.direcao.cores.map((cor) => (
                <span key={cor} className="briefing-cor" style={{ background: cor }} />
              ))}
            </div>
            <div>
              <p className="corpo">
                <span className="briefing-par">{resultado.direcao.fonteTitulo}</span> para títulos,{" "}
                <span className="briefing-par">{resultado.direcao.fonteTexto}</span> para texto.
              </p>
              {resultado.direcao.nota ? (
                <p className="nota medida mt-[var(--e2)]">{resultado.direcao.nota}</p>
              ) : null}
            </div>
          </div>

          <Maquete tipo={resultado.tipoEscolhido} cores={resultado.direcao.cores} />

          <p className="nota medida mt-[var(--e3)]">
            Amostra montada a partir das palavras que você escolheu — não é promessa do que o site
            vai ser. A direção real nasce da conversa.
          </p>
        </section>
      ) : null}

      {/* Tudo que ele marcou, pergunta a pergunta. */}
      <section className="cota">
        <p className="nota">o que você respondeu</p>
        <dl className="resumo-respostas mt-[var(--e4)]">
          {perguntas.map((pergunta) => {
            const bruto = respostas[pergunta.chave];
            if (bruto === undefined) return null;
            const marcados = Array.isArray(bruto) ? bruto : [bruto];
            const rotulos = marcados
              .map((valor) => pergunta.opcoes.find((o) => o.valor === valor)?.rotulo ?? valor)
              .filter(Boolean);

            return (
              <div key={pergunta.chave} className="resumo-linha">
                <dt className="nota">{pergunta.enunciado}</dt>
                <dd className="resumo-marcadas">
                  {rotulos.map((rotulo) => (
                    <span key={rotulo} className="resumo-marca">
                      {rotulo}
                    </span>
                  ))}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </article>
  );
}
