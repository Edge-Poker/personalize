"use client";

import { useRef } from "react";
import { apagarLead } from "./acoes";

/**
 * O botao de apagar, com uma pergunta antes.
 *
 * A pagina de leads inteira e de servidor; este pedaco atravessa so por causa
 * da confirmacao. Apagar um lead nao tem desfazer — some a linha, some o link
 * do cliente e some a conversa toda —, e fica a um clique de distancia de um
 * <select> de status que a pessoa usa o tempo todo. Um clique errado ali custa
 * um contato.
 *
 * `confirm` do navegador, e nao um modal proprio: e uma pergunta de uma linha
 * num painel de uso interno, e um dialogo caseiro aqui seria mais codigo para
 * chegar num lugar pior — sem foco preso, sem Esc, sem leitor de tela.
 *
 * Sem javascript o botao continua enviando o formulario e apagando. E a escolha
 * certa entre as duas: um painel onde o botao de apagar nao funciona seria pior
 * que um painel onde ele funciona sem perguntar.
 */
export function ApagarLead({ id, nome }: { id: string; nome: string }) {
  const formulario = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formulario}
      action={apagarLead}
      onSubmit={(evento) => {
        const certeza = window.confirm(
          `Apagar o lead de ${nome}?\n\n` +
            "A linha some do painel e o link que essa pessoa guardou deixa de abrir. " +
            "Se veio de um briefing, ela recupera uma das três tentativas da hora.\n\n" +
            "Isso não tem desfazer.",
        );
        if (!certeza) evento.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="admin-apagar">
        apagar
      </button>
    </form>
  );
}
