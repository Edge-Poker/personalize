import Link from "next/link";
import type { Servico, Trabalho } from "@/lib/conteudo";
import { ImagemSimples } from "@/components/imagem";
import type { Textos } from "@/lib/textos";

/**
 * Serviços como composição, não como card nem como tabela.
 *
 * Cada serviço é uma cota: linha de desenho técnico com marcação nas pontas, e
 * a informação sentada em cima dela. Nome grande, para quem é, preço e prazo —
 * na mesma linha, sem alinhamento de planilha.
 *
 * O preço não fica escondido à direita como metadado. Ele é parte da frase.
 */
export function ListaDeServicos({ servicos, textos }: { servicos: Servico[]; textos: Textos }) {
  if (servicos.length === 0) {
    return (
      <p className="corpo medida">{textos.servicos_vazio}</p>
    );
  }

  return (
    <ul className="fx-stagger">
      {servicos.map((servico) => (
        <li key={servico.id} className="linha-viva cota">
          <Link href={`/servicos/${servico.slug}`} className="desliza group block no-underline">
            <h3 className="titulo-2 transition-colors duration-300 group-hover:text-[var(--acento)]">
              {servico.titulo}
            </h3>

            <div className="mt-[var(--e2)] flex flex-wrap items-baseline gap-x-[var(--e5)] gap-y-[var(--e1)]">
              <span className="nota max-w-[38ch]">{servico.para_quem}</span>
              <span className="numero ml-auto">{servico.preco_texto ?? "sob consulta"}</span>
              {servico.prazo_texto ? (
                <span className="nota numero">{servico.prazo_texto}</span>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Trabalhos na home.
 *
 * Cada um entra numa largura e num deslocamento diferentes — consequência da
 * grade de 13, não enfeite: se dois blocos tivessem a mesma largura e a mesma
 * altura lado a lado, um dos dois estaria errado.
 */
const LARGURAS = ["mancha", "quebra", "mancha-recuada"] as const;

export function ListaDeTrabalhos({ trabalhos, textos }: { trabalhos: Trabalho[]; textos: Textos }) {
  if (trabalhos.length === 0) {
    return (
      <p className="corpo medida">{textos.trabalhos_vazio}</p>
    );
  }

  return (
    <>
      {trabalhos.map((trabalho, indice) => (
        <article
          key={trabalho.id}
          className={`linha-viva fx-up ${LARGURAS[indice % LARGURAS.length]} mt-[var(--e6)]`}
        >
          <Link href={`/trabalhos/${trabalho.slug}`} className="grupo-imagem group block no-underline">
            {/*
              Aqui a imagem nunca é editável: a listagem inteira já é um link,
              e botão dentro de link é html inválido além de armadilha de
              teclado. A capa se troca na página do case.
            */}
            <span className="moldura fx-shine">
              <ImagemSimples
                tabela="projects"
                registroId={trabalho.id}
                caminho="capa_path"
                caminhoAlt="capa_alt"
                path={trabalho.capa_path}
                alt={trabalho.capa_alt ?? trabalho.titulo}
                reserva={trabalho.slug}
                className="w-full"
              />
            </span>

            {/*
              Só o texto anda no hover; a imagem fica onde está. A moldura já
              tem o próprio gesto (escala lenta), e mover as duas coisas ao
              mesmo tempo em direções diferentes desmonta o bloco.
            */}
            <div className="desliza mt-[var(--e3)] flex flex-wrap items-baseline justify-between gap-x-[var(--e4)]">
              <h3 className="titulo-2 transition-colors duration-300 group-hover:text-[var(--acento)]">
                {trabalho.titulo}
              </h3>
              {/* Metadado empilhado, uma informação por linha. */}
              <p className="nota text-right">
                {trabalho.papel}
                {trabalho.ano ? <span className="numero block">{trabalho.ano}</span> : null}
              </p>
            </div>

            <p className="desliza corpo medida mt-[var(--e2)]">{trabalho.resumo}</p>
          </Link>
        </article>
      ))}
    </>
  );
}
