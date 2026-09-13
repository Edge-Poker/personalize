"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { entrar, type EstadoLogin } from "./acoes";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm border border-current px-4 py-2 text-base disabled:opacity-60"
    >
      {pending ? "Entrando" : "Entrar"}
    </button>
  );
}

export function FormularioLogin({ proximo }: { proximo: string }) {
  const [estado, acao] = useActionState<EstadoLogin, FormData>(entrar, {});

  return (
    <form action={acao} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="proximo" value={proximo} />

      {/* Isca antispam. Escondida de leitor de tela e de teclado, nao so de olho. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="site">Nao preencha</label>
        <input id="site" name="site" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-base">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="rounded-sm border border-current/40 bg-transparent px-3 py-2 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="senha" className="text-base">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="rounded-sm border border-current/40 bg-transparent px-3 py-2 text-base"
        />
      </div>

      {estado.erro ? (
        <p role="alert" className="text-base text-[#7a2e42]">
          {estado.erro}
        </p>
      ) : null}

      <div>
        <Botao />
      </div>
    </form>
  );
}
