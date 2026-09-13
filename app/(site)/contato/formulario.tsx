"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { enviarContato, type EstadoContato } from "./acoes";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="acao acao-forte disabled:opacity-60">
      {pending ? "enviando" : "enviar"}
    </button>
  );
}

const CAMPO =
  "w-full rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e3)] py-[var(--e2)] text-[length:inherit] focus:border-[var(--acento)]";

function Campo({
  id,
  rotulo,
  ajuda,
  children,
}: {
  id: string;
  rotulo: string;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="corpo-p block">
        {rotulo}
      </label>
      {ajuda ? (
        <p id={`${id}-ajuda`} className="nota mt-[2px]">
          {ajuda}
        </p>
      ) : null}
      <div className="mt-[var(--e2)]">{children}</div>
    </div>
  );
}

export function FormularioContato({ tipos }: { tipos: string[] }) {
  const [estado, acao] = useActionState<EstadoContato, FormData>(enviarContato, {
    estado: "parado",
  });
  const aviso = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (estado.estado !== "parado") aviso.current?.focus();
  }, [estado]);

  if (estado.estado === "enviado") {
    return (
      <div
        ref={aviso}
        tabIndex={-1}
        role="status"
        className="border-l-2 border-[var(--acento)] pl-[var(--e4)]"
      >
        <h2 className="titulo-3">Chegou aqui.</h2>
        <p className="corpo medida mt-[var(--e3)]">
          Eu leio tudo pessoalmente e respondo em até um dia útil. Se eu tiver dúvida sobre o
          que você precisa, a resposta vem com pergunta junto — é assim que todo projeto meu
          começa.
        </p>
        <p className="corpo medida mt-[var(--e3)]">
          Se for urgente, o WhatsApp aqui do lado é mais rápido que o e-mail.
        </p>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-[var(--e4)]">

      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="site">Não preencha este campo</label>
        <input id="site" name="site" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Campo id="nome" rotulo="Seu nome">
        <input id="nome" name="nome" type="text" required maxLength={120} autoComplete="name" className={CAMPO} />
      </Campo>

      <Campo id="email" rotulo="E-mail" ajuda="E-mail ou WhatsApp: um dos dois basta.">
        <input
          id="email"
          name="email"
          type="email"
          maxLength={200}
          autoComplete="email"
          aria-describedby="email-ajuda"
          className={CAMPO}
        />
      </Campo>

      <Campo id="whatsapp" rotulo="WhatsApp">
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          maxLength={30}
          autoComplete="tel"
          className={CAMPO}
        />
      </Campo>

      <Campo id="tipo_projeto" rotulo="Que tipo de projeto">
        <select id="tipo_projeto" name="tipo_projeto" className={CAMPO} defaultValue="">
          <option value="">ainda não sei</option>
          {tipos.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </Campo>

      <Campo
        id="mensagem"
        rotulo="O que você precisa"
        ajuda="Pode ser em duas linhas. O detalhe a gente resolve conversando."
      >
        <textarea
          id="mensagem"
          name="mensagem"
          rows={5}
          maxLength={4000}
          aria-describedby="mensagem-ajuda"
          className={CAMPO}
        />
      </Campo>

      {estado.estado === "erro" ? (
        <div ref={aviso} tabIndex={-1} role="alert" className="corpo text-[var(--acento)]">
          {estado.mensagem}
        </div>
      ) : null}

      <div>
        <Enviar />
      </div>
    </form>
  );
}
