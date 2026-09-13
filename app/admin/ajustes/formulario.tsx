"use client";

import { useActionState } from "react";
import { Aviso, CAMPO, Campo, Salvar } from "@/components/admin/ui";
import type { Ajustes } from "@/lib/conteudo";
import { salvarAjustes, type EstadoAjustes } from "./acoes";

export function FormularioAjustes({ ajustes }: { ajustes: Ajustes }) {
  const [estado, acao] = useActionState<EstadoAjustes, FormData>(salvarAjustes, {});

  return (
    <form action={acao} className="mt-[var(--e5)] flex max-w-[540px] flex-col gap-[var(--e4)]">
      <Campo id="marca_nome" rotulo="Nome da marca">
        <input id="marca_nome" name="marca_nome" defaultValue={ajustes.marca.nome} className={CAMPO} />
      </Campo>

      <Campo id="marca_descricao" rotulo="Descrição curta">
        <input
          id="marca_descricao"
          name="marca_descricao"
          defaultValue={ajustes.marca.descricao}
          className={CAMPO}
        />
      </Campo>

      <Campo
        id="contato_whatsapp"
        rotulo="WhatsApp"
        ajuda="Com DDI e DDD. Enquanto estiver vazio, nenhum botão de WhatsApp aparece no site."
      >
        <input
          id="contato_whatsapp"
          name="contato_whatsapp"
          inputMode="tel"
          placeholder="5511999999999"
          defaultValue={ajustes.contato.whatsapp}
          aria-describedby="contato_whatsapp-ajuda"
          className={CAMPO}
        />
      </Campo>

      <Campo id="contato_email" rotulo="E-mail de contato">
        <input
          id="contato_email"
          name="contato_email"
          type="email"
          defaultValue={ajustes.contato.email}
          className={CAMPO}
        />
      </Campo>

      <Campo id="contato_instagram" rotulo="Instagram" ajuda="Só o usuário, sem o @.">
        <input
          id="contato_instagram"
          name="contato_instagram"
          defaultValue={ajustes.contato.instagram}
          aria-describedby="contato_instagram-ajuda"
          className={CAMPO}
        />
      </Campo>

      <Campo id="contato_cidade" rotulo="Cidade">
        <input
          id="contato_cidade"
          name="contato_cidade"
          defaultValue={ajustes.contato.cidade}
          className={CAMPO}
        />
      </Campo>

      <Campo id="seo_titulo_padrao" rotulo="Título padrão">
        <input
          id="seo_titulo_padrao"
          name="seo_titulo_padrao"
          defaultValue={ajustes.seo.titulo_padrao}
          className={CAMPO}
        />
      </Campo>

      <Campo
        id="seo_template_titulo"
        rotulo="Modelo de título das páginas internas"
        ajuda="%s é onde entra o título da página."
      >
        <input
          id="seo_template_titulo"
          name="seo_template_titulo"
          defaultValue={ajustes.seo.template_titulo}
          aria-describedby="seo_template_titulo-ajuda"
          className={CAMPO}
        />
      </Campo>

      <Campo id="seo_descricao_padrao" rotulo="Descrição padrão">
        <textarea
          id="seo_descricao_padrao"
          name="seo_descricao_padrao"
          rows={3}
          defaultValue={ajustes.seo.descricao_padrao}
          className={CAMPO}
        />
      </Campo>

      <Aviso estado={estado} />

      <div>
        <Salvar />
      </div>
    </form>
  );
}
