"use client";

import { useEffect, useRef } from "react";
import type { PropsTexto } from "@/components/texto";
import { useEdicao } from "./provedor";

/**
 * Um texto do site que da para editar clicando nele.
 *
 * Depois de montado, quem manda no conteudo e o DOM, nao o React: o texto
 * inicial entra como children e nunca mais e re-renderizado. Se o React
 * reescrevesse o no enquanto voce digita, o cursor pularia para o comeco a
 * cada tecla - e o motivo de contentEditable controlado por estado ser uma
 * ideia ruim.
 *
 * Salvar nao acontece aqui. Aqui so registra a alteracao; quem grava e a
 * barra flutuante, para "descartar" e "desfazer" fazerem sentido.
 */
export function Editavel({
  tabela,
  registroId,
  caminho,
  children,
  className = "",
  as: Tag = "span",
}: PropsTexto) {
  const referencia = useRef<HTMLElement>(null);
  const original = useRef("");
  const { registrar } = useEdicao();

  useEffect(() => {
    original.current = referencia.current?.textContent ?? "";
  }, []);

  return (
    <Tag
      ref={referencia as React.RefObject<never>}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={`Editar ${caminho}`}
      aria-multiline="true"
      tabIndex={0}
      spellCheck
      // O contorno tracejado so aparece no hover e no foco: em modo de edicao
      // a pagina continua parecendo a pagina, nao um formulario.
      className={`${className} cursor-text outline-offset-4 hover:outline hover:outline-1 hover:outline-dashed hover:outline-[var(--tinta-fraca)] focus:outline focus:outline-2 focus:outline-[var(--acento)]`}
      onBlur={() => {
        const atual = referencia.current?.textContent ?? "";
        if (atual === original.current) return;
        registrar({
          tabela,
          registroId,
          caminho,
          valor: atual,
          anterior: original.current,
          // Desfazer, para texto, é reescrever o nó do DOM: quem manda no
          // conteúdo depois de montado é o DOM, não o React.
          restaurar: (valor) => {
            if (referencia.current) referencia.current.textContent = valor;
            original.current = valor;
          },
        });
        original.current = atual;
      }}
      onKeyDown={(evento: React.KeyboardEvent) => {
        // Enter confirma em vez de criar linha nova: sao campos de texto, nao
        // um editor de documento. Shift+Enter continua quebrando linha.
        if (evento.key === "Enter" && !evento.shiftKey) {
          evento.preventDefault();
          referencia.current?.blur();
        }
        if (evento.key === "Escape") {
          if (referencia.current) referencia.current.textContent = original.current;
          referencia.current?.blur();
        }
      }}
      onPaste={(evento: React.ClipboardEvent) => {
        // Colar de um editor traria html com estilo junto. Aqui so entra texto.
        evento.preventDefault();
        const texto = evento.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, texto);
      }}
    >
      {children}
    </Tag>
  );
}
