-- ---------------------------------------------------------------------------
-- Briefing conversacional (5.2)
-- ---------------------------------------------------------------------------
-- As sete perguntas, as opcoes e os pesos do calculo moram todos aqui. Nenhuma
-- pergunta e chumbada no codigo: a interface le desta tabela e desenha o que
-- encontrar. Trocar um enunciado, reordenar opcoes ou mexer num preco e edicao
-- de dado, nao deploy.
--
-- O calculo tambem: os pesos sao colunas da propria opcao. A alternativa seria
-- uma tabela separada de precos apontando para opcoes, o que significaria duas
-- linhas para editar por opcao e a possibilidade de uma existir sem a outra.
--
-- As colunas de peso sao quase todas nulas em quase todas as linhas, e isso e
-- de proposito: cada pergunta usa um tipo de peso diferente. `tipo` traz base e
-- dias; `paginas` e `prazo` trazem fator; `funcoes` e `identidade` trazem
-- acrescimo. Uma tabela por tipo de peso daria cinco tabelas para um formulario
-- de sete perguntas.

-- ---------------------------------------------------------------------------
-- Perguntas
-- ---------------------------------------------------------------------------

create table if not exists public.briefing_perguntas (
  id uuid primary key default gen_random_uuid(),
  -- A chave e o contrato com o codigo. O enunciado muda quando voce quiser; a
  -- chave e o que o calculo e o resumo procuram, entao ela nao muda.
  chave text not null unique check (chave ~ '^[a-z][a-z0-9_]*$'),
  ordem integer not null default 0,
  enunciado text not null check (char_length(trim(enunciado)) between 3 and 300),
  ajuda text,
  tipo text not null default 'unica' check (tipo in ('unica', 'multipla')),
  -- So vale para 'multipla'. Nulo quer dizer sem teto.
  max_escolhas integer check (max_escolhas is null or max_escolhas between 1 and 12),
  visivel boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists briefing_perguntas_ordem_idx
  on public.briefing_perguntas (ordem);

-- ---------------------------------------------------------------------------
-- Opcoes, com os pesos do calculo
-- ---------------------------------------------------------------------------

create table if not exists public.briefing_opcoes (
  id uuid primary key default gen_random_uuid(),
  pergunta_id uuid not null references public.briefing_perguntas(id) on delete cascade,
  ordem integer not null default 0,
  -- O valor e o que fica gravado em leads.respostas. Como a chave da pergunta:
  -- estavel, minusculo, sem acento.
  valor text not null check (valor ~ '^[a-z][a-z0-9-]*$'),
  rotulo text not null check (char_length(trim(rotulo)) between 1 and 120),

  -- Base, so na pergunta do tipo de projeto.
  base_min numeric(10, 2) check (base_min is null or base_min >= 0),
  base_max numeric(10, 2) check (base_max is null or base_max >= 0),
  dias_min integer check (dias_min is null or dias_min >= 0),
  dias_max integer check (dias_max is null or dias_max >= 0),

  -- Multiplicador, nas perguntas de volume e de urgencia.
  fator numeric(6, 3) check (fator is null or fator > 0),
  fator_dias numeric(6, 3) check (fator_dias is null or fator_dias > 0),

  -- Soma fixa, nas perguntas de funcionalidade e de identidade.
  acrescimo_min numeric(10, 2) check (acrescimo_min is null or acrescimo_min >= 0),
  acrescimo_max numeric(10, 2) check (acrescimo_max is null or acrescimo_max >= 0),
  dias_acrescimo integer check (dias_acrescimo is null or dias_acrescimo >= 0),

  /*
    Marca a opcao que significa "nao sei" ou "nada disso".

    O codigo precisa distinguir duas coisas que parecem iguais: nao ter marcado
    nada, e ter marcado "nada disso". A segunda e uma resposta, e ela tambem
    limpa as outras marcacoes da mesma pergunta.
  */
  neutra boolean not null default false,

  /*
    Desliga a faixa de preco.

    "Ainda nao sei" no tipo de projeto nao rende numero nenhum: nao ha base para
    multiplicar. Em vez de o codigo procurar pelo valor 'nao-sei' — que voce
    pode renomear —, a propria opcao carrega essa consequencia.
  */
  sem_orcamento boolean not null default false,

  criado_em timestamptz not null default now(),

  unique (pergunta_id, valor),
  -- Faixa invertida seria uma faixa vazia na tela.
  constraint base_coerente check (base_min is null or base_max is null or base_max >= base_min),
  constraint dias_coerente check (dias_min is null or dias_max is null or dias_max >= dias_min),
  constraint acrescimo_coerente
    check (acrescimo_min is null or acrescimo_max is null or acrescimo_max >= acrescimo_min)
);

create index if not exists briefing_opcoes_pergunta_idx
  on public.briefing_opcoes (pergunta_id, ordem);

-- ---------------------------------------------------------------------------
-- Direcoes visuais
-- ---------------------------------------------------------------------------
-- A amostra do bloco 3 do resultado. Cada direcao declara quais das doze
-- palavras a puxam; escolhida e a que mais casa com as tres marcadas.
--
-- Nada disso e gerado na hora: sao direcoes desenhadas antes e guardadas. O que
-- o visitante ve e uma combinacao de coisas que ja existiam.

create table if not exists public.briefing_direcoes (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique check (chave ~ '^[a-z][a-z0-9-]*$'),
  rotulo text not null,
  ordem integer not null default 0,
  -- As palavras da pergunta 7 que apontam para esta direcao.
  palavras text[] not null default '{}',
  -- Exatamente quatro: e o que o bloco de amostra desenha.
  cores text[] not null check (array_length(cores, 1) = 4),
  fonte_titulo text not null,
  fonte_texto text not null,
  nota text,
  visivel boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Leitura publica, escrita so de admin
-- ---------------------------------------------------------------------------
-- As perguntas sao o proprio formulario: quem visita precisa le-las. Os pesos
-- viajam na mesma linha, mas nunca chegam ao navegador — quem os le e o
-- servidor, no calculo. Ver lib/briefing.ts.

alter table public.briefing_perguntas enable row level security;
alter table public.briefing_opcoes enable row level security;
alter table public.briefing_direcoes enable row level security;

drop policy if exists "leitura publica das perguntas" on public.briefing_perguntas;
create policy "leitura publica das perguntas"
  on public.briefing_perguntas for select
  using (visivel or public.is_admin());

drop policy if exists "admin edita perguntas" on public.briefing_perguntas;
create policy "admin edita perguntas"
  on public.briefing_perguntas for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "leitura publica das opcoes" on public.briefing_opcoes;
create policy "leitura publica das opcoes"
  on public.briefing_opcoes for select
  using (true);

drop policy if exists "admin edita opcoes" on public.briefing_opcoes;
create policy "admin edita opcoes"
  on public.briefing_opcoes for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "leitura publica das direcoes" on public.briefing_direcoes;
create policy "leitura publica das direcoes"
  on public.briefing_direcoes for select
  using (visivel or public.is_admin());

drop policy if exists "admin edita direcoes" on public.briefing_direcoes;
create policy "admin edita direcoes"
  on public.briefing_direcoes for all
  using (public.is_admin())
  with check (public.is_admin());

create trigger tg_briefing_perguntas_touch
  before update on public.briefing_perguntas
  for each row execute function public.touch_atualizado_em();

create trigger tg_briefing_direcoes_touch
  before update on public.briefing_direcoes
  for each row execute function public.touch_atualizado_em();

-- ---------------------------------------------------------------------------
-- Ajustes em leads
-- ---------------------------------------------------------------------------

-- O vocabulario de status do 5.2 nao e o que estava aqui. `lido` e `respondido`
-- viram a mesma coisa — alguem esta conversando —, e `arquivado` vira `perdido`,
-- que diz por que foi arquivado.
alter table public.leads drop constraint if exists leads_status_check;

update public.leads
   set status = case status
         when 'lido' then 'em conversa'
         when 'respondido' then 'em conversa'
         when 'proposta' then 'proposta enviada'
         when 'arquivado' then 'perdido'
         else status
       end;

alter table public.leads
  add constraint leads_status_check
  check (status in ('novo', 'em conversa', 'proposta enviada', 'fechado', 'perdido'));

/*
  A direcao visual ganha coluna propria.

  A tentacao era reaproveitar `temperamento`, que ficou orfa quando o seletor do
  item 5.1 saiu do produto. Mas as duas coisas so parecem iguais: aquilo era uma
  escolha de paleta do site inteiro, isto e o resultado de tres palavras
  marcadas num briefing. Coluna que ja significou outra coisa e armadilha para
  quem for ler este banco daqui a um ano — ainda mais uma cujo nome nao tem
  relacao nenhuma com o novo sentido.

  Sem check apontando para lista fixa: as direcoes sao editaveis pelo painel, e
  amarrar o banco a elas faria criar uma direcao nova exigir migration.
*/
alter table public.leads add column if not exists direcao_visual text;

alter table public.leads drop constraint if exists leads_direcao_visual_check;
alter table public.leads
  add constraint leads_direcao_visual_check
  check (direcao_visual is null or direcao_visual ~ '^[a-z][a-z0-9-]*$');

comment on column public.leads.direcao_visual is
  'Chave em briefing_direcoes, escolhida pelas palavras da pergunta 7.';

comment on column public.leads.temperamento is
  'Morta. Guardava o temperamento do item 5.1, removido do produto. Nada escreve aqui.';

-- ---------------------------------------------------------------------------
-- registrar_lead aprende a direcao visual
-- ---------------------------------------------------------------------------
-- Um parametro novo com valor padrao criaria uma sobrecarga: as duas versoes
-- passariam a existir, e o PostgREST teria duas candidatas para a mesma
-- chamada. Por isso a antiga e derrubada pela assinatura exata antes.
--
-- `p_temperamento` continua na assinatura, e continua nao sendo escrito por
-- ninguem. Tira-lo agora quebraria qualquer chamada que ainda o mande; ele sai
-- quando alguem confirmar que nao ha mais nenhuma.

drop function if exists public.registrar_lead(text, text, text, text, text, text, jsonb, text, text, text, text);

create or replace function public.registrar_lead(
  p_nome text,
  p_email text default null,
  p_whatsapp text default null,
  p_origem text default 'contato',
  p_tipo_projeto text default null,
  p_mensagem text default null,
  p_respostas jsonb default '{}'::jsonb,
  p_faixa_estimada text default null,
  p_prazo_estimado text default null,
  p_temperamento text default null,
  p_chave_limite text default null,
  p_direcao_visual text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_token text;
begin
  if p_chave_limite is not null then
    if not public.checar_rate_limit('lead:' || p_chave_limite, 5, 3600) then
      raise exception 'limite_excedido'
        using hint = 'Aguarde antes de enviar outra mensagem.';
    end if;
  end if;

  if coalesce(trim(p_nome), '') = '' then
    raise exception 'nome_obrigatorio';
  end if;

  if coalesce(trim(p_email), '') = '' and coalesce(trim(p_whatsapp), '') = '' then
    raise exception 'contato_obrigatorio';
  end if;

  if jsonb_typeof(p_respostas) is distinct from 'object'
     or pg_column_size(p_respostas) > 32768 then
    raise exception 'respostas_invalidas';
  end if;

  insert into public.leads (
    nome, email, whatsapp, origem, tipo_projeto, mensagem,
    respostas, faixa_estimada, prazo_estimado, direcao_visual
  )
  values (
    trim(p_nome),
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_whatsapp, '')), ''),
    coalesce(p_origem, 'contato'),
    nullif(trim(coalesce(p_tipo_projeto, '')), ''),
    nullif(trim(coalesce(p_mensagem, '')), ''),
    coalesce(p_respostas, '{}'::jsonb),
    nullif(trim(coalesce(p_faixa_estimada, '')), ''),
    nullif(trim(coalesce(p_prazo_estimado, '')), ''),
    nullif(trim(coalesce(p_direcao_visual, '')), '')
  )
  returning id, token_retorno into v_id, v_token;

  -- So volta o que o proprio visitante precisa para achar o briefing de novo.
  return jsonb_build_object('id', v_id, 'token_retorno', v_token);
end;
$$;

revoke execute on function public.registrar_lead(text, text, text, text, text, text, jsonb, text, text, text, text, text) from public;
grant execute on function public.registrar_lead(text, text, text, text, text, text, jsonb, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Token com prazo
-- ---------------------------------------------------------------------------
-- As duas funcoes sao recriadas por dois motivos: o vocabulario de status mudou
-- acima, e o link de retorno passa a expirar em 60 dias. Sem o prazo, um link
-- vazado hoje continuaria abrindo o briefing daqui a tres anos.

create or replace function public.briefing_por_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v jsonb;
begin
  if coalesce(trim(p_token), '') = '' then
    return null;
  end if;

  select jsonb_build_object(
           'nome', l.nome,
           'email', l.email,
           'whatsapp', l.whatsapp,
           'tipo_projeto', l.tipo_projeto,
           'respostas', l.respostas,
           'faixa_estimada', l.faixa_estimada,
           'prazo_estimado', l.prazo_estimado,
           'direcao_visual', l.direcao_visual,
           'criado_em', l.criado_em
         )
    into v
    from public.leads l
   where l.token_retorno = p_token
     and l.origem = 'briefing'
     and l.status <> 'perdido'
     and l.criado_em > now() - interval '60 days';

  return v;
end;
$$;

revoke execute on function public.briefing_por_token(text) from public;
grant execute on function public.briefing_por_token(text) to anon, authenticated;

create or replace function public.atualizar_briefing(
  p_token text,
  p_respostas jsonb,
  p_faixa_estimada text default null,
  p_prazo_estimado text default null,
  p_nome text default null,
  p_email text default null,
  p_whatsapp text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_linhas integer;
begin
  if coalesce(trim(p_token), '') = '' then
    return false;
  end if;

  if not public.checar_rate_limit('briefing:' || p_token, 30, 3600) then
    raise exception 'limite_excedido';
  end if;

  if jsonb_typeof(p_respostas) is distinct from 'object'
     or pg_column_size(p_respostas) > 32768 then
    raise exception 'respostas_invalidas';
  end if;

  update public.leads l
     set respostas = p_respostas,
         faixa_estimada = coalesce(nullif(trim(coalesce(p_faixa_estimada, '')), ''), l.faixa_estimada),
         prazo_estimado = coalesce(nullif(trim(coalesce(p_prazo_estimado, '')), ''), l.prazo_estimado),
         nome = coalesce(nullif(trim(coalesce(p_nome, '')), ''), l.nome),
         email = coalesce(nullif(trim(coalesce(p_email, '')), ''), l.email),
         whatsapp = coalesce(nullif(trim(coalesce(p_whatsapp, '')), ''), l.whatsapp)
   where l.token_retorno = p_token
     and l.origem = 'briefing'
     and l.status not in ('perdido', 'fechado')
     and l.criado_em > now() - interval '60 days';

  get diagnostics v_linhas = row_count;
  return v_linhas > 0;
end;
$$;
