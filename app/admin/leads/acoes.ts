"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";

const esquema = z.object({
  id: z.string().uuid(),
  status: z.enum(["novo", "em conversa", "proposta enviada", "fechado", "perdido"]),
});

export async function mudarStatusDoLead(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = esquema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  // Sem retorno de erro para a tela: os valores vem de um <select> que o
  // proprio servidor desenhou, entao falhar aqui significa requisicao forjada,
  // e nao usuario confuso.
  if (!analise.success) return;

  await supabase
    .from("leads")
    .update({ status: analise.data.status })
    .eq("id", analise.data.id);

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

/**
 * Apaga o lead de vez.
 *
 * Nao passa por `supabase.from("leads").delete()` porque apagar a linha e so
 * metade do trabalho: a outra metade e devolver a tentativa de briefing, e ela
 * mora em `rate_limit`, uma tabela que a 0001 revoga para anon e authenticated.
 * Nem o admin logado alcanca por fora. Quem faz as duas coisas e a funcao
 * `apagar_lead` (0018), que e `security definer` e comeca checando is_admin().
 *
 * "Apagado de todo lugar" inclui o link que o cliente guardou, e isso sai de
 * graca: `briefing_por_token` procura a linha e, sem linha, devolve null — a
 * pagina do token entao mostra "esse link nao abre mais". Nao ha copia em
 * lugar nenhum para limpar.
 */
export async function apagarLead(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  await supabase.rpc("apagar_lead", { p_id: id.data });

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}
