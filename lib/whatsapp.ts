/**
 * Monta o link do WhatsApp com a mensagem ja escrita.
 *
 * Devolve null quando o numero nao esta cadastrado, para quem chama poder
 * esconder o botao em vez de mostrar um link quebrado.
 */
export function linkWhatsapp(numero: string, mensagem: string): string | null {
  const digitos = numero.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}

/** A mensagem muda conforme a pagina de onde a pessoa saiu. */
export function mensagemDaPagina(contexto?: string): string {
  if (!contexto) {
    return "Oi! Vim pelo site e queria conversar sobre um projeto.";
  }
  return `Oi! Vim pelo site, da página de ${contexto}, e queria conversar sobre um projeto.`;
}
