import { CapaMotor, type Pilula } from "@/components/capa-motor";
import { TextoSimples, type ComponenteTexto } from "@/components/texto";

/**
 * A capa.
 *
 * Um video em tela cheia que nao toca sozinho: ele e percorrido pelo movimento
 * horizontal do mouse. O visitante nao assiste a uma animacao, ele opera uma —
 * e essa e a primeira demonstracao do que o estudio faz.
 *
 * Este arquivo e do servidor de proposito. E ele que resolve o `<Texto>`
 * injetado, o mesmo que torna cada frase do site editavel no lugar; componente
 * de servidor nao atravessa a fronteira para dentro de um "use client", entao
 * os textos sao montados aqui e entregues prontos ao motor. O motor
 * (components/capa-motor.tsx) cuida do que precisa de navegador.
 */

export function Capa({
  rotulo,
  frase,
  pilulas,
  botoes,
  email,
  video,
  registroId,
  editando = false,
  Texto = TextoSimples,
}: {
  rotulo: string;
  frase: string;
  pilulas: Pilula[];
  botoes: Pilula[];
  email?: string;
  video?: string;
  registroId: string;
  /**
   * No editor a frase aparece inteira e editavel, e nao sendo digitada. Nao da
   * para escrever dentro de um texto que esta se montando letra por letra — o
   * cursor seria empurrado a cada 38 milissegundos.
   */
  editando?: boolean;
  Texto?: ComponenteTexto;
}) {
  /*
    Espaco de verdade, um so.

    Ao digitar dois espacos seguidos num campo contentEditable, o navegador
    grava o segundo como espaco inquebravel (U+00A0) — e um espaco inquebravel
    nao colapsa e nao permite quebra de linha. Quando a frase quebra ali, ele
    vai junto para a linha de baixo e aparece como um recuo que ninguem pediu:
    era isso que desalinhava a segunda linha do titulo.

    A limpeza acontece aqui, e nao so no banco, porque a origem e o proprio ato
    de editar: consertar o texto uma vez nao impede a proxima dupla de espacos.
    Como a frase quebra sozinha pela largura da coluna, ela nao tem espaco em
    branco proposital a preservar.
  */
  const fraseLimpa = frase.replace(/[\s\u00a0]+/g, " ").trim();

  return (
    <CapaMotor
      frase={fraseLimpa}
      pilulas={pilulas}
      botoes={botoes}
      email={email}
      video={video}
      editando={editando}
      rotuloSlot={
        /*
          As duas linhas vivem numa string so, com quebra de linha no meio, e o
          CSS (white-space: pre-line) e quem desenha a quebra. Poderiam ser dois
          campos, mas ai seriam dois cliques para editar uma frase — e um campo
          editavel com <br /> dentro vira um no que o contentEditable desmonta
          no primeiro Enter.
        */
        <Texto
          tabela="sections"
          registroId={registroId}
          caminho="nota"
          className="capa-rotulo"
          as="p"
        >
          {rotulo}
        </Texto>
      }
      fraseSlot={
        <Texto
          tabela="sections"
          registroId={registroId}
          caminho="titulo"
          className="capa-frase"
          as="h1"
        >
          {fraseLimpa}
        </Texto>
      }
    />
  );
}
