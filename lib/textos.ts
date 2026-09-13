/**
 * Os textos que não pertencem a nenhum registro do banco.
 *
 * Título de serviço mora em `services`. Relato de case mora em `projects`.
 * Mas "o que ele pediu", "Está incluso", "Vamos conversar" e os estados vazios
 * não pertencem a nada — eram literais espalhados por oito arquivos, fora do
 * seu alcance. Isso contrariava o item 6 do briefing original, que pede tudo
 * editável.
 *
 * Agora todos moram numa linha só de `site_settings` (chave `textos`), e são
 * renderizados pelo mesmo componente injetado do resto. No site público são
 * texto; no modo de edição são campo.
 *
 * O que está aqui é o padrão. O banco sobrepõe o que você editar, e uma chave
 * que você apagar volta para o valor daqui — o site não fica com buraco.
 */
export const TEXTOS_PADRAO = {
  // Listagem de serviços
  servicos_nota: "quatro jeitos de começar, e um deles é dizer que nenhum serve",
  servicos_titulo: "O que eu faço",
  servicos_intro:
    "Os preços são de partida, não de tabela fechada: o que muda de um projeto para outro é quanto trabalho de texto e de estrutura ele pede. Se nada aqui encaixa, o último item existe justamente para isso.",
  servicos_vazio:
    "Nenhum serviço publicado ainda. Eles aparecem aqui assim que forem marcados como visíveis no painel.",

  // Página de um serviço
  servico_como_funciona: "como funciona",
  servico_para_quem: "para quem é",
  servico_nota_listas: "o que dizer de fora é tão útil quanto dizer o que entra",
  servico_inclui: "Está incluso",
  servico_nao_inclui: "Não está",
  servico_acao: "falar sobre este projeto",
  servico_whatsapp: "chamar no whatsapp",

  // Listagem de trabalhos
  trabalhos_nota: "não é vitrine. cada um é um relato, inclusive das partes que deram errado.",
  trabalhos_titulo: "Trabalhos",
  trabalhos_intro:
    "Prefiro contar como cada projeto andou a mostrar uma grade de miniaturas bonitas. O que decide uma contratação é ver como alguém pensa, e isso não cabe numa imagem de capa.",
  trabalhos_vazio: "Nenhum trabalho publicado ainda. Cadastre um no painel e ele aparece aqui.",

  // Capítulos do case
  case_pedido: "o que ele pediu",
  case_problema: "o problema de verdade",
  case_decisao: "a decisão",
  case_mudou: "o que mudou entre as versões",
  case_resultado: "o resultado",
  case_citacao: "o que ele disse",
  case_proximo: "próximo trabalho",

  // Contato
  contato_nota: "eu leio tudo. não tem equipe, sou eu mesmo.",
  contato_titulo: "Vamos conversar",
  contato_intro:
    "Não precisa chegar com tudo definido. A maior parte dos projetos começa com alguém dizendo mais ou menos o que quer, e a primeira coisa que eu faço é perguntar.",
  contato_pressa: "com pressa?",
  contato_campo_nome: "Seu nome",
  contato_campo_email: "E-mail",
  contato_ajuda_email: "E-mail ou WhatsApp: um dos dois basta.",
  contato_campo_whatsapp: "WhatsApp",
  contato_campo_tipo: "Que tipo de projeto",
  contato_campo_mensagem: "O que você precisa",
  contato_ajuda_mensagem: "Pode ser em duas linhas. O detalhe a gente resolve conversando.",
  contato_enviar: "enviar",
  contato_sucesso_titulo: "Chegou aqui.",
  contato_sucesso_texto:
    "Eu leio tudo pessoalmente e respondo em até um dia útil. Se eu tiver dúvida sobre o que você precisa, a resposta vem com pergunta junto — é assim que todo projeto meu começa.",
  contato_sucesso_extra: "Se for urgente, o WhatsApp aqui do lado é mais rápido que o e-mail.",

  // Briefing (a versão de verdade entra na etapa 5)
  briefing_nota: "esta parte ainda está sendo feita",
  briefing_titulo: "O briefing entra em breve",
  briefing_intro:
    "Vão ser sete perguntas curtas, uma por tela, e no fim uma página com faixa de investimento, prazo e uma amostra de direção visual montada a partir do que você respondeu.",
  briefing_extra:
    "Enquanto isso, o caminho mais curto é me escrever direto. Duas linhas já bastam para a gente começar.",
} as const;

export type ChaveDeTexto = keyof typeof TEXTOS_PADRAO;
export type Textos = Record<ChaveDeTexto, string>;
