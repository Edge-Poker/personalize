-- 0008_semente.sql
-- Conteudo inicial. Tudo daqui e editavel pelo painel depois - esta em SQL
-- so para o site nascer com texto de verdade em vez de lorem ipsum.
--
-- Os on conflict deixam a migration poder rodar de novo sem duplicar. Ela nao
-- sobrescreve o que ja existe: se voce editou um texto pelo painel, rodar de
-- novo nao desfaz a sua edicao.

-- ---------------------------------------------------------------------------
-- Ajustes globais
-- ---------------------------------------------------------------------------

insert into public.site_settings (chave, valor, publico) values
  ('marca', jsonb_build_object(
    'nome', 'persona.lize',
    'descricao', 'Estudio de criacao de sites sob medida.'
  ), true),
  ('contato', jsonb_build_object(
    'email', '',
    'whatsapp', '',
    'instagram', '',
    'cidade', ''
  ), true),
  ('seo', jsonb_build_object(
    'titulo_padrao', 'persona.lize',
    'template_titulo', '%s | persona.lize',
    'descricao_padrao', 'Faco sites sob medida para profissionais liberais, pequenos negocios e criadores. Cada projeto comeca por uma conversa, nao por um template.'
  ), true)
on conflict (chave) do nothing;

-- ---------------------------------------------------------------------------
-- Navegacao
-- ---------------------------------------------------------------------------

-- O guard e `where not exists` e nao `on conflict`: nav_items so tem unique no
-- id, que e gerado, entao on conflict nunca dispararia e rodar de novo
-- duplicaria o menu inteiro. href nao e unique de proposito - voce pode querer
-- dois itens apontando para o mesmo lugar.
insert into public.nav_items (rotulo, href, ordem, visivel)
select v.rotulo, v.href, v.ordem, true
from (values
  ('serviços',  '/servicos',  10),
  ('trabalhos', '/trabalhos', 20),
  ('sobre',     '/sobre',     30),
  ('contato',   '/contato',   40)
) as v(rotulo, href, ordem)
where not exists (select 1 from public.nav_items n where n.href = v.href);

-- ---------------------------------------------------------------------------
-- Servicos
-- ---------------------------------------------------------------------------
-- ATENCAO: os prazos abaixo sao estimativa minha, nao numero que voce me deu.
-- Confira antes de publicar - e o unico campo desta migration que nao veio de
-- voce. Os precos sao os seus.

insert into public.services
  (slug, titulo, resumo, descricao, inclui, nao_inclui, para_quem,
   preco_min, preco_texto, prazo_texto, ordem, visivel)
values
  (
    'portfolio-profissional',
    'Portfólio profissional',
    'Para quem precisa de um lugar próprio na internet, com currículo, trabalhos e um jeito fácil de te acharem.',
    'Um site que existe para responder três perguntas de quem chega: quem é você, o que você já fez e como te encontrar. Nada além disso, porque nada além disso é necessário. Escrevo o texto junto com você — a maior parte do tempo de um portfólio vai em decidir o que dizer, não em programar.',
    array[
      'Até 5 páginas ou seções',
      'Redação dos textos junto com você',
      'Currículo ou trajetória em formato legível',
      'Galeria ou lista de trabalhos',
      'Formulário de contato e botão de WhatsApp',
      'Domínio próprio configurado',
      'Ajustes por 30 dias depois de publicar'
    ],
    array[
      'Loja ou pagamento online',
      'Área de login para visitantes',
      'Produção de fotos',
      'Gestão de redes sociais'
    ],
    'Psicólogo, advogado, arquiteto, fotógrafo, consultor — quem vende o próprio nome e hoje só tem o Instagram.',
    499,
    'a partir de R$ 499',
    '2 a 3 semanas',
    10,
    true
  ),
  (
    'site-de-vendas',
    'Site de vendas',
    'Institucional com catálogo, prova social e um caminho claro até a compra ou o contato.',
    'É o site de quem já vende e precisa que a internet ajude em vez de atrapalhar. Catálogo organizado do jeito que seu cliente procura, e não do jeito que o sistema achou mais fácil. Depoimento de quem já comprou. E um caminho curto até falar com você — porque na maior parte dos negócios a venda ainda acontece na conversa.',
    array[
      'Estrutura de páginas definida junto com você',
      'Catálogo de produtos ou serviços, editável por você',
      'Depoimentos e provas sociais',
      'Formulário e WhatsApp com mensagem pré-preenchida',
      'Painel para você editar tudo sem me chamar',
      'SEO técnico e dados estruturados',
      'Domínio próprio e publicação',
      'Ajustes por 60 dias depois de publicar'
    ],
    array[
      'Carrinho e checkout com pagamento online',
      'Integração com ERP ou emissor de nota',
      'Produção de fotos de produto',
      'Anúncios pagos'
    ],
    'Comércio local, clínica, escritório, prestador de serviço que já tem clientela e quer parar de perder gente no meio do caminho.',
    1499,
    'a partir de R$ 1.499',
    '4 a 6 semanas',
    20,
    true
  ),
  (
    'landing-page-de-campanha',
    'Landing page de campanha',
    'Uma página, um objetivo. Feita para converter e para você medir se converteu.',
    'Serve quando existe uma campanha com começo e fim: um lançamento, um evento, uma turma que abre. Uma página só, sem menu que distraia, com um objetivo declarado e o caminho mais curto até ele. Sai rápido porque o escopo é pequeno de propósito — se a página precisa de menu, ela não é uma landing page.',
    array[
      'Uma página, escrita para um objetivo só',
      'Formulário de captura ou botão direto para WhatsApp',
      'Medição de conversão configurada',
      'Publicação em domínio ou subdomínio seu'
    ],
    array[
      'Menu e páginas internas',
      'Catálogo',
      'Painel de edição',
      'Criação da campanha e dos anúncios'
    ],
    'Quem vai lançar algo com data marcada e precisa de um destino para o anúncio, o story ou o e-mail.',
    599,
    'a partir de R$ 599',
    '1 semana',
    30,
    true
  ),
  (
    'projeto-sob-medida',
    'Projeto sob medida',
    'Quando o que você precisa não cabe em nenhuma das três opções acima.',
    'Plataforma, área de membros, sistema interno, ferramenta que só faz sentido no seu negócio. O escopo é definido junto, antes de existir preço — porque orçar sem entender o problema é chutar. Começamos por uma conversa e por um documento curto que diz o que entra, o que fica de fora e em que ordem. A EDGE Poker nasceu assim.',
    array[
      'Levantamento do escopo junto com você, antes do orçamento',
      'Documento de escopo com o que entra e o que fica fora',
      'Entrega em etapas, com você revisando cada uma',
      'Banco de dados, contas de usuário e permissões',
      'Painel administrativo próprio'
    ],
    array[
      'Orçamento fechado antes do escopo definido',
      'Prazo prometido antes de saber o tamanho'
    ],
    'Quem tem um produto na cabeça e precisa de alguém que pergunte bastante antes de começar a programar.',
    null,
    'a combinar',
    'definido junto com o escopo',
    40,
    true
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Trabalhos
-- ---------------------------------------------------------------------------
-- Sem citacao de cliente: nao invento depoimento. Os campos citacao ficam
-- nulos e voce preenche quando tiver frase real de gente real.

insert into public.projects
  (slug, titulo, cliente, papel, ano, resumo, pedido, problema, decisao, mudou, resultado,
   tags, ordem, visivel)
values
  (
    'bernardo-cantelli',
    'Portfolio Modelo',
    'Bernardo Cantelli',
    'Portfólio de modelo',
    2026,
    'Portfólio de modelo com abertura em roda 3D, galerias por categoria e troca das fotos pela própria página.',
    'Um portfólio de verdade, para mandar quando uma empresa pedisse para ver o trabalho dele. Quase nenhum modelo tem um — e era exatamente por isso que ele queria.',
    'O que existia era o Instagram. As empresas pediam o material e recebiam um perfil: mesma grade, mesmo formato e mesma cara de todo mundo que faz o mesmo trabalho. Não faltava foto. Faltava um lugar que fizesse aquelas fotos parecerem profissionais.',
    'A abertura virou uma roda de fotos girando em 3D, com frente e verso, feita só em CSS. Portfólio de modelo costuma ser grade parada; quem abre este entende em dois segundos que tem alguém cuidando do próprio material. Atrás da abertura as fotos ficam separadas por categoria — Editorial, Character, Expressão e Digital/Polaroid — e ele troca todas pela própria página, sem precisar me chamar.',
    'De várias versões que eu mesmo descartei para a primeira que eu achei boa o bastante para entregar.',
    'O site está no ar com as quatro galerias, e ele passou a mandar um endereço em vez de um perfil. As empresas que pediram o material se impressionaram.',
    array['portfólio', '3D em CSS', 'edição pelo site'],
    10,
    true
  ),
  (
    'edge-poker',
    'EDGE Poker',
    'EDGE Poker',
    'Plataforma de ensino',
    2025,
    'Plataforma de ensino de poker: curso, fórum, provas, ranking e assinatura paga.',
    'Uma plataforma onde o aluno assiste ao curso, discute no fórum, faz prova, aparece no ranking e paga a assinatura — tudo no mesmo lugar.',
    'Escopo grande demais para entregar de uma vez. Cada parte dependia de outra: o ranking precisava das provas, as provas precisavam do progresso do curso, e a assinatura precisava controlar o acesso a todas elas. Começar pelo lado errado significaria refazer o resto.',
    'Entreguei em etapas, na ordem em que uma coisa desbloqueava a seguinte: conta e curso, depois progresso, depois provas e ranking, depois fórum, e a cobrança por último. Cada etapa foi ao ar funcionando sozinha, antes da próxima começar.',
    'De um escopo fechado de uma vez para seis entregas revisadas uma a uma.',
    'A plataforma está no ar com curso, fórum, provas, ranking e assinatura integrada ao Mercado Pago. É o projeto mais complexo que eu já entreguei.',
    array['plataforma', 'assinatura', 'projeto longo'],
    20,
    true
  ),
  (
    'international-freshman',
    'International Freshman',
    'International Freshman',
    'Plataforma para estudantes internacionais',
    2025,
    'Plataforma para quem quer estudar nos Estados Unidos: dados de faculdades, custos e conteúdo em mais de um idioma.',
    'Um lugar onde o estudante de fora comparasse faculdades americanas por dados reais — custo, exigências, prazos — em vez de depender de fórum e de achismo.',
    'O conteúdo é dado, não texto. Centenas de faculdades, cada uma com dezenas de campos, e tudo precisando existir em mais de um idioma. Escrever isso à mão seria impossível de manter, e traduzir página por página multiplicaria o problema por cada idioma novo.',
    'Modelei os dados primeiro e a interface depois. Faculdade virou registro estruturado, não página escrita. O idioma virou uma camada por cima dos mesmos dados, então adicionar um idioma novo não significa reescrever o site.',
    'De páginas escritas uma a uma para dados estruturados com apresentação em cima.',
    'A plataforma serve estudantes de vários países com o mesmo conjunto de dados, e cabe adicionar faculdade ou idioma sem tocar no código.',
    array['dados', 'multi-idioma', 'plataforma'],
    30,
    true
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Home
-- ---------------------------------------------------------------------------
-- As secoes ficam em `sections` para eu poder reordenar, esconder e reescrever
-- pelo painel na etapa 4. O bloco `voz` guarda a mesma informacao em tres
-- vozes - e o diferencial 5.1: o temperamento nao troca so a cor, troca o
-- jeito de falar.

insert into public.pages (slug, titulo, seo, publicado, ordem)
values (
  'home',
  'persona.lize',
  jsonb_build_object(
    'titulo', 'persona.lize — sites sob medida',
    'descricao', 'Faço sites sob medida para profissionais liberais, pequenos negócios e criadores. Este aqui muda de temperamento enquanto você lê.'
  ),
  true,
  0
)
on conflict (slug) do nothing;

insert into public.sections (page_id, tipo, ordem, visivel, dados)
select p.id, v.tipo, v.ordem, true, v.dados
from public.pages p
cross join (values
  (
    'heroi', 10,
    jsonb_build_object(
      'nota', 'isto aqui muda de humor enquanto você lê',
      'titulo', 'Eu faço sites que não parecem template.',
      'voz', jsonb_build_object(
        'calmo',   'Troque o temperamento ali em cima e veja o que acontece: muda a cor, a letra, o espaço entre as coisas e o jeito que este parágrafo está escrito. A informação é a mesma. A voz é outra. É o que eu faço para cada cliente, feito aqui na sua frente.',
        'direto',  'Troque ali em cima. Muda cor, tipografia, espaçamento e este texto. Mesma informação, outra voz. É o serviço, demonstrado no próprio site.',
        'autoral', 'Vá em frente, troque ali em cima. A cor cede, a letra engorda, o espaço respira de outro jeito e este parágrafo passa a falar com outra boca. A informação não mudou uma vírgula. Quem está contando é que mudou. É exatamente isso que eu faço para cada cliente — e achei mais honesto fazer na sua frente do que prometer.'
      ),
      'acoes', jsonb_build_array(
        jsonb_build_object('rotulo', 'ver trabalhos', 'href', '/trabalhos', 'forte', true),
        jsonb_build_object('rotulo', 'começar o briefing', 'href', '/briefing', 'forte', false)
      )
    )
  ),
  (
    'servicos', 20,
    jsonb_build_object('nota', 'o que eu faço')
  ),
  (
    'trabalhos', 30,
    jsonb_build_object(
      'nota', 'três trabalhos reais. o do Cantelli é sobre refazer a primeira versão inteira.'
    )
  ),
  (
    'convite', 40,
    jsonb_build_object(
      'nota', 'em vez de formulário',
      'titulo', 'Me conta o que você precisa em sete perguntas.',
      'texto', 'No fim eu te devolvo uma faixa de investimento, um prazo e uma amostra de direção visual montada a partir do que você respondeu. Leva uns três minutos e não pede seu e-mail para começar.',
      'acao', jsonb_build_object('rotulo', 'começar o briefing', 'href', '/briefing', 'forte', true)
    )
  )
) as v(tipo, ordem, dados)
where p.slug = 'home'
  and not exists (
    select 1 from public.sections s where s.page_id = p.id and s.tipo = v.tipo
  );

-- ---------------------------------------------------------------------------
-- Sobre
-- ---------------------------------------------------------------------------
-- Esta pagina nao tem rota escrita a mao: ela e desenhada pelo segmento
-- dinamico app/(site)/[slug]. E a prova de que da para criar pagina nova pelo
-- painel sem tocar em codigo.
--
-- ATENCAO: o texto abaixo fala do processo, que da para afirmar olhando os
-- tres cases. Nao fala de voce - nome, formacao, trajetoria, onde mora. Eu nao
-- invento isso. Acrescente uma secao sua pelo painel antes de publicar.

insert into public.pages (slug, titulo, seo, publicado, ordem)
values (
  'sobre',
  'Sobre',
  jsonb_build_object(
    'titulo', 'Sobre',
    'descricao', 'Uma pessoa só, poucos projetos por vez, e o texto escrito antes do código.'
  ),
  true,
  10
)
on conflict (slug) do nothing;

insert into public.sections (page_id, tipo, ordem, visivel, dados)
select p.id, v.tipo, v.ordem, true, v.dados
from public.pages p
cross join (values
  (
    'intro', 10,
    jsonb_build_object(
      'nota', 'uma pessoa só, e isso é de propósito',
      'titulo', 'Sobre',
      'texto', 'Não é agência. Quem conversa com você é quem escreve o texto, desenha as telas e programa. Isso limita quantos projetos eu pego ao mesmo tempo — e é justamente por isso que eu prefiro poucos por vez.'
    )
  ),
  (
    'texto', 20,
    jsonb_build_object(
      'nota', 'como eu trabalho',
      'titulo', 'O texto vem antes do código',
      'paragrafos', jsonb_build_array(
        'Todo projeto começa por uma conversa e por um documento curto que diz o que entra, o que fica de fora e em que ordem. Orçar antes de entender o problema é chutar, e chute custa caro para os dois lados.',
        'Escrevo o rascunho do texto antes de programar qualquer coisa. Aprendi isso da pior maneira: entreguei um site inteiro para um psiquiatra e ouvi que estava frio. O layout estava certo. A voz estava errada. Refiz do zero, e passei a mostrar texto antes de tela.',
        'Entrego em etapas, na ordem em que uma coisa desbloqueia a seguinte, e cada etapa vai ao ar funcionando sozinha antes da próxima começar. Foi assim que a EDGE Poker saiu do papel sem precisar ser refeita no meio.',
        'Quando o conteúdo é dado e não texto, modelo os dados primeiro e a interface depois. É o que faz um site aguentar crescer sem virar cem páginas escritas à mão.'
      )
    )
  ),
  (
    'texto', 30,
    jsonb_build_object(
      'nota', 'dizer o que não faço economiza o tempo dos dois',
      'titulo', 'O que eu não faço',
      'paragrafos', jsonb_build_array(
        'Não cuido de anúncio pago, não administro rede social e não produzo foto. Quando o projeto precisa disso, eu digo antes e indico alguém.',
        'Não trabalho com prazo prometido antes de saber o tamanho do escopo. Se você precisa de uma data hoje, eu prefiro dizer que não sei a dizer um número que eu não vou cumprir.'
      )
    )
  ),
  (
    'convite', 40,
    jsonb_build_object(
      'nota', 'o próximo passo',
      'titulo', 'Me conta o que você precisa.',
      'texto', 'Duas linhas já bastam para a gente começar. Eu leio tudo e respondo em até um dia útil.',
      'acao', jsonb_build_object('rotulo', 'falar comigo', 'href', '/contato', 'forte', true)
    )
  )
) as v(tipo, ordem, dados)
where p.slug = 'sobre'
  and not exists (
    select 1 from public.sections s where s.page_id = p.id and s.ordem = v.ordem
  );
