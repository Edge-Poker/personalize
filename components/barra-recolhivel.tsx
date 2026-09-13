"use client";

import { useId, useState } from "react";

/**
 * A alavanca que recolhe a navegacao no telefone.
 *
 * Existe separada do cabecalho porque o cabecalho e componente de servidor —
 * ele consulta a navegacao no banco. Estado de aberto/fechado precisa de
 * navegador, entao so este pedaco atravessa a fronteira, e os links continuam
 * sendo montados no servidor e entregues aqui como children.
 *
 * No desktop a alavanca nao existe: o css a esconde e a navegacao fica sempre
 * aberta. Nada disso e condicionado por javascript de largura, que erraria no
 * primeiro desenho e faria a barra piscar.
 */
export function BarraRecolhivel({ children }: { children: React.ReactNode }) {
  /*
    Comeca fechada.

    A capa e a primeira coisa do site e ela ocupa a tela inteira; no telefone o
    cabecalho aberto comia um pedaco dela logo de entrada. Fechado, quem chega
    ve a capa inteira e abre o menu se quiser.

    O preco e a descoberta: a navegacao deixa de estar a vista, e quem nunca
    reparar na seta nao vai saber que ela abre algo. E por isso que a seta e
    branca e cheia, e nao um traco discreto — e o unico convite que sobrou. As
    paginas continuam alcancaveis pelas pilulas da capa e pelo rodape.
  */
  const [aberta, setAberta] = useState(false);
  const id = useId();

  return (
    <>
      <button
        type="button"
        className="barra-alavanca"
        aria-expanded={aberta}
        aria-controls={id}
        aria-label={aberta ? "Esconder navegação" : "Mostrar navegação"}
        onClick={() => setAberta((estava) => !estava)}
      >
        {/*
          Uma seta so, que gira meia volta. Duas setas trocadas por estado
          fariam o icone saltar de forma; girando, o movimento e a propria
          explicacao do que aconteceu.
        */}
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M3 10.5 8 5.5l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div id={id} className={aberta ? "barra-conteudo barra-aberta" : "barra-conteudo"}>
        {children}
      </div>
    </>
  );
}
