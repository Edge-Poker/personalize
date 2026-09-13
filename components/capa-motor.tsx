"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LinkInterno } from "@/components/link-interno";

/**
 * A parte da capa que se mexe.
 *
 * Ela existe separada de components/capa.tsx por causa da edicao no lugar. O
 * `<Texto>` injetado que torna cada frase editavel e resolvido no servidor, e
 * componente de servidor nao atravessa a fronteira para dentro de um "use
 * client". Entao o servidor monta os textos e passa prontos como slot; aqui so
 * mora o que precisa de navegador: o video, a maquina de escrever, a entrada
 * das pilulas e a copia do endereco.
 */

/*
  A sobreposicao do loop, em segundos.

  O video tem comeco e fim diferentes — as flores crescem do inicio ao fim —,
  entao voltar ao zero de uma vez da um corte seco. Duas copias tocando
  defasadas resolvem: quando uma esta a 1,6s do fim, a outra comeca do zero e
  as duas trocam de opacidade. O que se ve e uma dissolucao, e o ciclo nao tem
  emenda visivel.
*/
const FUSAO = 1.6;

/*
  Quanto tempo uma troca pode durar antes de ser dada por morta, em ms.

  Uma dissolucao honesta leva FUSAO — 1,6s — mais o tempo do play(). Passou
  disso com folga, nao e lentidao: e a aba que foi para segundo plano no meio e
  deixou a promessa pendente. Quem chegar depois deste prazo tem permissao para
  arrombar a tranca e retomar o video.

  A folga e generosa de proposito. Arrombar cedo demais interromperia uma
  dissolucao que so estava devagar, e o preco de esperar um pouco mais e um
  video parado por mais um segundo — bem menor que o de cortar a transicao que
  existe justamente para nao haver corte.
*/
const LIMITE_TROCA = FUSAO * 1000 + 2500;

const VELOCIDADE = 38;
const ESPERA = 600;

/*
  O quadro parado que ocupa a capa enquanto o video nao comeca.

  E um frame do proprio arquivo da capa, extraido do video que esta no ar hoje.
  Por isso vale saber: trocar o video da capa pelo painel troca o filme e nao
  troca esta imagem, e as duas passariam a mostrar coisas diferentes. Se o
  video mudar, este arquivo precisa ser gerado de novo.
*/
const QUADRO = "/capa-quadro.jpg";

/*
  O que cada pilula vira no telefone.

  A fileira nao cabe em quatro numa tela estreita: ela quebra 2+2 e o bloco
  cresce para baixo. Entao uma sai e duas encurtam.

  A chave e o href, e nao o rotulo, de proposito: o texto das pilulas e editavel
  pelo painel, e no dia em que "quanto custa" virar outra coisa um mapa por
  rotulo pararia de casar em silencio. O destino da pilula e o que nao muda.

  Nada disso e "esconder no telefone" no sentido de sumir com informacao: quem
  esta em /sobre continua alcancavel pelo menu do topo. O que sai e a quarta
  pilula, nao a pagina.
*/
const NO_TELEFONE: Record<string, { curto?: string; esconder?: boolean }> = {
  "/trabalhos": { curto: "trabalhos" },
  "/servicos": { curto: "custos" },
  "/sobre": { esconder: true },
};

/*
  O `muted` precisa estar no DOM, e nao so no React.

  React trata `muted` como propriedade e nao escreve o atributo no html. Quem
  le a marcacao — que e quem decide se a reproducao automatica pode acontecer —
  ve `<video autoplay playsinline>` sem `muted`, conclui que e video com som
  tentando tocar sozinho, e nega. O resultado e o botao de play desenhado por
  cima do quadro: o navegador nao esta quebrado, esta pedindo o gesto que a
  politica exige para video com som.

  A propriedade que o React poe depois nao desfaz a decisao. Entao o atributo e
  escrito na mao, no instante em que o elemento entra na pagina, antes de haver
  o que tocar.

  A funcao e criada uma vez so (useCallback sem dependencias) de proposito: a
  maquina de escrever redesenha este componente a cada 38ms, e um callback de
  ref novo a cada desenho faria o React soltar e repegar o <video> — no meio da
  reproducao.
*/
function prepararFilme(filme: HTMLVideoElement | null) {
  if (!filme) return;
  filme.muted = true;
  filme.defaultMuted = true;
  filme.setAttribute("muted", "");
}

function useMaquinaDeEscrever(texto: string, ligada: boolean) {
  const [escrito, setEscrito] = useState("");
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    // Com movimento reduzido — ou no modo de edicao — a frase aparece inteira.
    if (!ligada || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEscrito(texto);
      setPronto(true);
      return;
    }

    setEscrito("");
    setPronto(false);
    let indice = 0;
    let relogio: ReturnType<typeof setInterval>;

    const inicio = setTimeout(() => {
      relogio = setInterval(() => {
        indice += 1;
        setEscrito(texto.slice(0, indice));
        if (indice >= texto.length) {
          clearInterval(relogio);
          setPronto(true);
        }
      }, VELOCIDADE);
    }, ESPERA);

    return () => {
      clearTimeout(inicio);
      clearInterval(relogio);
    };
  }, [texto, ligada]);

  return { escrito, pronto };
}

export type Pilula = { rotulo: string; href: string };

export function CapaMotor({
  frase,
  rotuloSlot,
  fraseSlot,
  pilulas,
  botoes,
  email,
  video,
  editando = false,
}: {
  frase: string;
  rotuloSlot: React.ReactNode;
  /** A frase como campo editavel. So entra no lugar da digitacao no editor. */
  fraseSlot: React.ReactNode;
  pilulas: Pilula[];
  /** O par de botoes grandes que fecha a capa. */
  botoes: Pilula[];
  email?: string;
  video?: string;
  editando?: boolean;
}) {
  const umRef = useRef<HTMLVideoElement>(null);
  const doisRef = useRef<HTMLVideoElement>(null);
  const [comVideo, setComVideo] = useState(false);
  /*
    Nao "existe um video", e sim "o video esta correndo agora".

    A diferenca e o botao de play. Quando o navegador recusa a reproducao
    automatica, ele nao fica quieto: desenha por cima do quadro o botao que pede
    o gesto. Nao ha atributo que desligue esse desenho — ele mora no shadow DOM
    do proprio <video>, fora do alcance do css da pagina.

    O que esta ao alcance e nao mostrar o elemento enquanto ele nao estiver
    tocando de verdade. Opacidade zero apaga tudo que o elemento pinta, o botao
    junto. Ate la quem ocupa o lugar e o fundo desenhado — e no instante em que
    o primeiro quadro anda, o video entra por cima dele numa dissolucao.

    Ou seja: ou o visitante ve o video tocando, ou ve o gradiente. O botao de
    play nao e mais um dos resultados possiveis.
  */
  const [tocando, setTocando] = useState(false);
  /* O mesmo estado, para quem le de dentro de um ouvinte. O efeito dos gestos e
     montado uma vez so; sem isto ele leria o `tocando` congelado do desenho em
     que foi criado. */
  const tocandoRef = useRef(false);

  /*
    Qual das duas copias esta no ar, e se uma troca esta acontecendo agora.

    Vivem em refs, e nao em variaveis dentro dos efeitos, porque os dois efeitos
    precisam concordar: um cuida do rodizio e o outro cuida de retomar depois de
    a aba voltar. Enquanto isso era variavel de closure, o segundo efeito nao
    tinha como saber que a copia visivel era a `dois` — ele mandava tocar sempre
    a `um`, que estava em opacidade zero. O visitante via a tela congelada com a
    outra copia rodando invisivel atras.

    Ref tambem sobrevive a um redesenho do componente. Variavel de closure volta
    a zero enquanto as opacidades no DOM continuam onde estavam, e ai o rodizio
    passa a vigiar a copia errada.
  */
  const visivelRef = useRef(0);
  const trocandoRef = useRef(false);
  /*
    Quando a tranca da troca foi fechada, e qual troca a fechou.

    A tranca sozinha era um impasse esperando para acontecer. `trocar()` fecha
    ela e so abre no `finally`; se a aba sai de cena bem no meio da dissolucao,
    o iOS deixa a promessa do `play()` pendente e congela o `setTimeout` — o
    `finally` nunca roda e a tranca fica fechada para sempre. Ao voltar, tudo
    que tenta retomar o video comeca por "se esta trocando, nao mexe", entao
    ninguem mexe nunca mais: video pausado, e nem tocar na tela resolve.

    O horario permite reconhecer uma tranca velha demais para ser real. A
    geracao permite descartar a troca zumbi: se ela acordar depois que alguem ja
    tomou a tranca dela, o numero nao bate e ela para de mexer nas opacidades em
    vez de brigar com quem assumiu.
  */
  const trocaEmRef = useRef(0);
  const geracaoRef = useRef(0);
  const [entrou, setEntrou] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const { escrito, pronto } = useMaquinaDeEscrever(frase, !editando);

  const montarUm = useCallback((filme: HTMLVideoElement | null) => {
    prepararFilme(filme);
    umRef.current = filme;
    /*
      Elemento novo na tela quer dizer opacidades novas: o JSX acabou de
      desenhar a primeira copia em 1 e a segunda em 0. O indice tem de voltar a
      zero junto, senao o ref fica apontando para a copia que estava no ar na
      encarnacao anterior — e o rodizio passa a vigiar a errada.
    */
    if (filme) {
      visivelRef.current = 0;
      trocandoRef.current = false;
    }
  }, []);

  const montarDois = useCallback((filme: HTMLVideoElement | null) => {
    prepararFilme(filme);
    doisRef.current = filme;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setEntrou(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!video) return;
    // Com movimento reduzido a capa fica no fundo desenhado: um video em laco
    // e exatamente o que a preferencia pede para nao acontecer.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setComVideo(true);
  }, [video]);

  /*
    Trocar o `preload` de "none" para "auto" e um pedido, nao uma ordem: parte
    dos navegadores so passa a buscar o arquivo no proximo motivo que aparecer.
    `load()` e o motivo. A segunda copia esta parada e invisivel neste instante,
    entao nao ha o que interromper.
  */
  useEffect(() => {
    if (!tocando) return;
    doisRef.current?.load();
  }, [tocando]);

  /*
    Insistir na reproducao, e so entao revelar.

    Duas coisas num efeito so porque sao a mesma conversa com o mesmo elemento.

    Insistir: a primeira tentativa acontece antes de existir um quadro
    carregado, entao ela sozinha nao basta. A tentativa se repete quando o
    arquivo avisa que ja da para tocar, quando a aba volta ao primeiro plano, e
    ao primeiro sinal de vida do visitante — qualquer um deles serve como o
    gesto que algumas politicas exigem. Mover o mouse conta.

    Revelar: `playing` mente um pouco (dispara antes de o quadro andar), entao
    quem confirma e o `timeupdate` com o relogio ja fora do zero. So ai o video
    aparece.
  */
  useEffect(() => {
    if (!comVideo) return;
    const um = umRef.current;
    if (!um) return;

    let vivo = true;

    function correndo(filme: HTMLVideoElement | null) {
      return !!filme && !filme.paused && !filme.ended;
    }

    /*
      Destravar a segunda copia — e so depois que a primeira ja estiver no ar.

      No iOS um <video> so aceita comandos de script depois de ter tocado uma
      vez dentro de um gesto de verdade. A primeira copia ganha isso de graca,
      porque e ela que o visitante destrava ao tocar na tela; a segunda nunca
      seria tocada por ninguem, e ficaria trancada para sempre.

      A tentacao e destravar as duas no primeiro toque. Nao da: mandar a segunda
      tocar faz ela baixar o arquivo tambem, e sao duas requisicoes de 7 MB
      disputando a mesma conexao. Quem paga e justamente a copia que o visitante
      esta esperando ver. Era esse o atraso — nao havia recusa nenhuma, o
      arquivo e que chegava pela metade da banda.

      Entao a ordem e: a primeira tem a conexao inteira ate comecar a andar; so
      entao o proximo gesto destrava a segunda. Nao ha pressa — a segunda so faz
      falta perto do fim do laco, e se nenhum gesto vier ate la, o rodizio se
      vira com uma copia so.
    */
    function destravarSegunda() {
      if (!tocandoRef.current) return;
      const dois = doisRef.current;
      if (!dois || dois.dataset.destravada === "1") return;
      dois
        .play()
        .then(() => {
          dois.pause();
          dois.currentTime = 0;
          dois.dataset.destravada = "1";
        })
        .catch(() => {
          // Recusou. Nao marca nada: o proximo gesto tenta de novo.
        });
    }

    /*
      Retomar — a copia certa.

      Antes isto mandava tocar sempre a primeira. Funcionava ate o rodizio
      trocar; dali em diante a copia visivel era a outra, e retomar a primeira
      significava tocar um video em opacidade zero enquanto o congelado ficava
      na tela. Era o travamento ao voltar do navegador: o iOS pausa tudo quando
      a aba sai de cena, e quem voltava a andar era a copia errada.

      Agora quem retoma e `filmes[visivelRef.current]`, e de quebra as
      opacidades sao reafirmadas: se alguma coisa as deixou trocadas — uma troca
      interrompida no meio pela aba sumindo, por exemplo —, este e o momento de
      acertar.
    */
    function tentar() {
      if (!vivo) return;

      /*
        No meio de uma dissolucao nao se mexe: as duas estao tocando de
        proposito, e "consertar" aqui desfaria a transicao.

        Mas so ate certo ponto. Uma troca que comecou ha mais de LIMITE_TROCA
        nao esta acontecendo — ela morreu com a aba em segundo plano, e sua
        tranca ficou fechada. Respeitar essa tranca para sempre e o que deixava
        o video pausado ao voltar do navegador, sem cura nem tocando na tela.
        Aqui ela e arrombada, e a geracao sobe para que a troca zumbi, se um dia
        acordar, saiba que perdeu a vez.
      */
      if (trocandoRef.current) {
        if (Date.now() - trocaEmRef.current < LIMITE_TROCA) return;
        geracaoRef.current += 1;
        trocandoRef.current = false;
      }

      const filmes = [um, doisRef.current];
      const atual = filmes[visivelRef.current];
      const outra = filmes[1 - visivelRef.current];
      if (!atual) return;

      if (correndo(atual)) {
        destravarSegunda();
        return;
      }

      atual.style.opacity = "1";
      if (outra && outra !== atual) {
        outra.style.opacity = "0";
        if (!outra.paused) outra.pause();
      }

      void atual.play().catch(() => {});
      destravarSegunda();
    }

    function confirmar() {
      if (!vivo) return;
      const andou = (f: HTMLVideoElement | null) => correndo(f) && f!.currentTime > 0;
      if (!andou(um) && !andou(doisRef.current)) return;
      tocandoRef.current = true;
      setTocando(true);
    }

    /*
      Sair de cena cancela a troca que estiver em andamento.

      Prevencao, e nao remendo: uma dissolucao so faz sentido enquanto alguem
      esta olhando. Soltando a tranca na ida, a volta ja encontra tudo
      destravado e nem precisa do prazo do LIMITE_TROCA. O prazo continua la
      para o que escapar daqui — a aba que some sem aviso, o bfcache que nao
      dispara nada.
    */
    function aoMudarVisibilidade() {
      if (document.visibilityState === "visible") {
        tentar();
        return;
      }
      geracaoRef.current += 1;
      trocandoRef.current = false;
    }

    tentar();
    um.addEventListener("loadeddata", tentar);
    um.addEventListener("canplay", tentar);
    um.addEventListener("playing", confirmar);
    um.addEventListener("timeupdate", confirmar);
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    // O iOS restaura do bfcache sem passar por visibilitychange.
    window.addEventListener("pageshow", tentar);

    /*
      A rede de gestos. Nao ha "once": a politica pode continuar recusando por
      alguns eventos ate ceder, e desistir na primeira recusa e o que fazia o
      video so comecar depois de mexer a tela — o toque estava chegando, mas
      tarde e uma vez so.
    */
    const sinais = ["pointerdown", "touchstart", "keydown", "scroll", "wheel", "mousemove"] as const;
    for (const sinal of sinais) {
      document.addEventListener(sinal, tentar, { passive: true });
    }

    return () => {
      vivo = false;
      um.removeEventListener("loadeddata", tentar);
      um.removeEventListener("canplay", tentar);
      um.removeEventListener("playing", confirmar);
      um.removeEventListener("timeupdate", confirmar);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("pageshow", tentar);
      for (const sinal of sinais) document.removeEventListener(sinal, tentar);
    };
  }, [comVideo]);

  useEffect(() => {
    const um = umRef.current;
    const dois = doisRef.current;
    if (!comVideo || !um || !dois) return;

    const filmes = [um, dois];
    let vivo = true;

    /*
      O rodizio, agora em qualquer largura.

      A copia que esta acabando avisa quando falta FUSAO para o fim; a outra
      volta ao zero, comeca a tocar, e a troca de opacidade acontece nas duas ao
      mesmo tempo. Quem estava tocando so pausa depois de sumir por completo —
      pausar antes deixaria o ultimo instante da dissolucao congelado.

      Nenhuma das duas usa `loop`: quem fecha o ciclo e este rodizio. Com `loop`
      ligado o navegador voltaria ao zero por conta propria no meio da
      transicao, e o corte que a gente esta evitando voltaria por outra porta.

      A troca so acontece depois que a segunda copia confirma que esta tocando.
      Antes eu mandava tocar e ja trocava a opacidade no mesmo folego; quando o
      iOS recusava o play(), a copia recusada aparecia congelada e a que estava
      no ar pausava — a tela ficava preta. Esperar a promessa resolver e o que
      transforma "recusou" em "faz do outro jeito" em vez de "sumiu".
    */
    /*
      Espera que da para cancelar.

      `setTimeout` solto sobrevive ao componente: se a capa sair da tela no meio
      de uma dissolucao, o temporizador ainda dispara e mexe na opacidade de um
      elemento que nao existe mais. Guardando os ids, a limpeza mata todos.
    */
    const temporizadores = new Set<number>();

    function esperar(ms: number) {
      return new Promise<void>((resolver) => {
        const id = window.setTimeout(() => {
          temporizadores.delete(id);
          resolver();
        }, ms);
        temporizadores.add(id);
      });
    }

    /*
      `minha` e a geracao desta troca. Toda vez que a funcao volta de um await
      ela pergunta se ainda e a troca da vez — se nao for, para de mexer em
      opacidade e sai sem desfazer nada. E o que impede uma dissolucao que ficou
      pendente em segundo plano de acordar dez minutos depois e apagar o video
      que alguem ja retomou.
    */
    async function trocar(minha: number) {
      const atual = () => vivo && geracaoRef.current === minha;

      const saindo = filmes[visivelRef.current]!;
      const entrando = filmes[1 - visivelRef.current]!;

      entrando.currentTime = 0;

      try {
        await entrando.play();
      } catch {
        /*
          Sem permissao para a segunda copia — o destravar do efeito acima ainda
          nao pegou. Entao o laco se fecha na propria copia que esta no ar: ela
          some, volta ao zero e reaparece. E o respiro escuro que existia antes
          aqui, so que agora como plano B em vez de regra.

          Passar pelo escuro cai bem porque o arquivo comeca quase preto: o
          caminho entre o ultimo quadro e o primeiro e escuro de qualquer jeito.
        */
        if (!atual()) return;
        saindo.style.opacity = "0";
        /*
          `await`, e nao um setTimeout solto.

          Aqui estava o "repetindo o comeco bem rapido". A funcao retornava na
          hora e deixava o temporizador correndo; quem chamou ja dava a troca
          por encerrada e destravava. Mas o video continuava tocando perto do
          fim, e `timeupdate` bate umas quatro vezes por segundo — cada batida
          entrava de novo e zerava o relogio outra vez. Esperando de verdade, a
          tranca so sai quando a emenda terminou.
        */
        await esperar(FUSAO * 1000);
        if (!atual()) return;
        saindo.currentTime = 0;
        saindo.style.opacity = "1";
        await saindo.play().catch(() => {});
        return;
      }

      if (!atual()) return;
      entrando.style.opacity = "1";
      saindo.style.opacity = "0";
      visivelRef.current = 1 - visivelRef.current;

      await esperar(FUSAO * 1000);
      if (!atual()) return;
      saindo.pause();
      saindo.currentTime = 0;
    }

    /*
      `timeupdate` bate umas quatro vezes por segundo, e a troca deixou de ser
      instantanea: ela espera a promessa do play(). Sem esta tranca, os avisos
      que chegam durante a espera disparariam a troca de novo, cada um zerando o
      currentTime da copia que esta justamente entrando.
    */
    function vigiar(this: HTMLVideoElement) {
      if (trocandoRef.current || !this.duration) return;
      if (this !== filmes[visivelRef.current]) return;
      if (this.currentTime < this.duration - FUSAO) return;

      const minha = (geracaoRef.current += 1);
      trocandoRef.current = true;
      trocaEmRef.current = Date.now();
      void trocar(minha).finally(() => {
        // So abre a tranca se ela ainda for desta troca. Se alguem ja a
        // arrombou e comecou outra coisa, abrir aqui soltaria a tranca de quem
        // esta trabalhando agora.
        if (geracaoRef.current === minha) trocandoRef.current = false;
      });
    }

    for (const filme of filmes) filme.addEventListener("timeupdate", vigiar);

    // Quem da a partida e a rede de tentativas do efeito acima; aqui mora so o
    // rodizio, que precisa de uma reproducao ja em andamento para ter o que
    // revezar.
    return () => {
      vivo = false;
      // Uma troca interrompida no meio deixaria a tranca fechada para sempre.
      trocandoRef.current = false;
      for (const id of temporizadores) window.clearTimeout(id);
      temporizadores.clear();
      for (const filme of filmes) filme.removeEventListener("timeupdate", vigiar);
    };
  }, [comVideo]);

  async function copiarEmail() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Area de transferencia negada (contexto inseguro, permissao recusada).
      // O endereco continua escrito na propria pilula, entao nao ha o que
      // salvar nem o que avisar.
    }
  }

  return (
    /*
      `capa-com-filme` desliga o fundo desenhado do ::before. Quem cobre o vazio
      ate o video comecar nao e mais ele, e sim a cortina la embaixo — que usa o
      mesmo desenho e some por opacidade quando o quadro anda.
    */
    <section className={comVideo ? "capa capa-com-filme" : "capa"}>
      {comVideo ? (
        <div className="capa-filmes" aria-hidden="true">
          {/*
            Duas copias do mesmo arquivo, defasadas, em qualquer largura: so a
            primeira comeca visivel, e a segunda entra pela troca de opacidade
            quando a primeira se aproxima do fim.

            A mesma URL nas duas nao significa baixar duas vezes — a segunda
            requisicao encontra a primeira no cache do navegador.

            `autoPlay` no atributo, e nao so o play() do efeito: o navegador
            trata o atributo como intencao declarada no documento e o libera
            em casos onde recusa a chamada de script.
          */}
          <video
            ref={montarUm}
            className="capa-filme"
            style={{ opacity: 1 }}
            src={video}
            autoPlay
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            onError={() => setComVideo(false)}
          />
          {/*
            A segunda copia so comeca a baixar depois que a primeira esta
            rodando.

            `preload="auto"` nas duas fazia o navegador buscar 7 MB duas vezes
            ao mesmo tempo, na largada, competindo pela mesma conexao — e no
            telefone isso e a diferenca entre a capa comecar ao toque e comecar
            quando o texto ja acabou de ser digitado. Com `none` a segunda nao
            gasta um byte enquanto a primeira precisa da banda inteira; quando
            `tocando` vira verdade, o atributo muda e ela busca com calma, muito
            antes de fazer falta no fim do laco.
          */}
          <video
            ref={montarDois}
            className="capa-filme"
            style={{ opacity: 0 }}
            src={video}
            muted
            playsInline
            preload={tocando ? "auto" : "none"}
            aria-hidden="true"
            tabIndex={-1}
          />

          {/*
            A cortina, com o quadro parado dentro.

            Antes o que ocupava a espera era um gradiente abstrato, e era ele o
            "video opaco" que incomodava: nao parecia o site. Agora e um quadro
            do proprio filme, entao quem chega ve a composicao certa desde o
            primeiro instante — e quando a reproducao libera, dissolve para o
            movimento em vez de trocar de assunto.

            A imagem usa a mesma classe dos videos de proposito. E ela que
            carrega o enquadramento (cover, a escala do desktop, o centro do
            telefone); repetir os valores aqui seria criar duas verdades que
            saem de sincronia no primeiro ajuste, e o corte apareceria
            exatamente no meio da dissolucao.
          */}
          <span className={tocando ? "capa-cortina capa-cortina-fora" : "capa-cortina"}>
            {/* Prioridade alta: e a primeira imagem que a pessoa ve, e chegar
                atrasada significa olhar para o gradiente sem motivo. */}
            <img
              className="capa-filme capa-quadro"
              src={QUADRO}
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              decoding="async"
            />
          </span>
        </div>
      ) : null}

      <div className="capa-veu" aria-hidden="true" />

      <div className="capa-conteudo">
        {rotuloSlot}

        {editando ? (
          fraseSlot
        ) : (
          /*
            A frase e o h1 da home. Quem usa leitor de tela recebe o texto
            inteiro de uma vez: ninguem deveria esperar quatro segundos de
            digitacao para descobrir do que a pagina trata.
          */
          <h1 className="capa-frase">
            <span className="so-leitor">{frase}</span>
            <span aria-hidden="true">
              {escrito}
              {pronto ? null : <span className="capa-cursor" />}
            </span>
          </h1>
        )}

        <div className={entrou ? "capa-pilulas capa-pilulas-visivel" : "capa-pilulas"}>
          {pilulas.map((pilula) => {
            const noTelefone = NO_TELEFONE[pilula.href];
            return (
              <LinkInterno
                key={pilula.href + pilula.rotulo}
                href={pilula.href}
                className={noTelefone?.esconder ? "pilula so-largo" : "pilula"}
              >
                {/*
                  Os dois rotulos existem na marcacao e o css escolhe qual
                  aparece. Como a escolha e por `display: none`, o que esta
                  escondido tambem sai da arvore de acessibilidade — quem usa
                  leitor de tela ouve um rotulo, nao dois.
                */}
                {noTelefone?.curto ? (
                  <>
                    <span className="so-largo">{pilula.rotulo}</span>
                    <span className="so-estreito">{noTelefone.curto}</span>
                  </>
                ) : (
                  pilula.rotulo
                )}
              </LinkInterno>
            );
          })}

          {email ? (
            <button type="button" className="pilula pilula-vazada" onClick={copiarEmail}>
              <span>
                escreva: <span className="pilula-email">{email}</span>
              </span>
              <span className="pilula-icone" aria-hidden="true">
                {copiado ? (
                  <svg viewBox="0 0 12 12" width="12" height="12">
                    <path d="M2 6.4 4.6 9 10 3.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 12 12" width="12" height="12">
                    <rect x="0.6" y="0.6" width="7.4" height="7.4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.1" />
                    <rect x="4" y="4" width="7.4" height="7.4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.1" />
                  </svg>
                )}
              </span>
              <span className="so-leitor" aria-live="polite">
                {copiado ? "endereco copiado" : ""}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {/*
        O par que fecha a capa, ancorado embaixo.

        As pilulas dizem para onde da para ir; estes dois dizem o que fazer.
        Ficam separados de proposito — mesmo peso visual entre eles e as
        pilulas transformaria seis links iguais numa lista, e a pessoa nao
        saberia por onde comecar.
      */}
      {botoes.length > 0 ? (
        <div className="capa-rodape">
          {/*
            O risco que separa as pilulas dos dois botoes.

            Mora dentro do rodape, e nao solto na capa, para nao precisar
            adivinhar a altura dos botoes: o rodape esta ancorado embaixo, entao
            o risco fica sempre logo acima deles — no meio do vazio que havia
            entre as duas fileiras. So aparece no desktop, que e onde esse vazio
            existe.
          */}
          <span className="capa-risco" aria-hidden="true" />
          <div className="capa-rodape-interno">
            {botoes.map((botao) => (
              <LinkInterno key={botao.href + botao.rotulo} href={botao.href} className="acao">
                {botao.rotulo}
              </LinkInterno>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
