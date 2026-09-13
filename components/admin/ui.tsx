"use client";

import { useFormStatus } from "react-dom";

export const CAMPO =
  "w-full rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e3)] py-[var(--e2)] text-[15px] focus:border-[var(--acento)]";

export function Campo({
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

export function Salvar({ rotulo = "salvar" }: { rotulo?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="acao acao-forte disabled:opacity-60">
      {pending ? "salvando" : rotulo}
    </button>
  );
}

export function Aviso({ estado }: { estado: { ok?: boolean; erro?: string } }) {
  if (estado.erro) {
    return (
      <p role="alert" className="corpo-p text-[var(--acento)]">
        {estado.erro}
      </p>
    );
  }
  if (estado.ok) {
    return (
      <p role="status" className="corpo-p text-[var(--tinta-fraca)]">
        Salvo.
      </p>
    );
  }
  return null;
}
