/**
 * Tipos do banco, escritos a mao para acompanhar supabase/migrations.
 *
 * Depois que o projeto Supabase existir da para regerar com:
 *   npx supabase gen types typescript --project-id <id> > lib/types/database.ts
 * Ate la, este arquivo e a fonte da verdade no TypeScript. Se mexer numa
 * migration, mexa aqui junto.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Herança. Os três temperamentos saíram do site, mas a coluna `temperamento`
 * de `leads` continua no banco com o CHECK que a criou, e continua guardando o
 * que os visitantes antigos escolheram. Ninguém escreve nela hoje; apagá-la
 * significaria jogar fora dado já coletado para limpar um tipo.
 */
export type Temperamento = "calmo" | "direto" | "autoral";

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: { user_id: string; nome: string | null; criado_em: string };
        Insert: { user_id: string; nome?: string | null; criado_em?: string };
        Update: { user_id?: string; nome?: string | null; criado_em?: string };
        Relationships: [];
      };
      site_settings: {
        Row: { chave: string; valor: Json; publico: boolean; atualizado_em: string };
        Insert: { chave: string; valor?: Json; publico?: boolean; atualizado_em?: string };
        Update: { chave?: string; valor?: Json; publico?: boolean; atualizado_em?: string };
        Relationships: [];
      };
      nav_items: {
        Row: {
          id: string;
          rotulo: string;
          href: string;
          ordem: number;
          visivel: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          rotulo: string;
          href: string;
          ordem?: number;
          visivel?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          rotulo?: string;
          href?: string;
          ordem?: number;
          visivel?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      pages: {
        Row: {
          id: string;
          slug: string;
          titulo: string;
          seo: Json;
          publicado: boolean;
          ordem: number;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titulo: string;
          seo?: Json;
          publicado?: boolean;
          ordem?: number;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          titulo?: string;
          seo?: Json;
          publicado?: boolean;
          ordem?: number;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      sections: {
        Row: {
          id: string;
          page_id: string | null;
          project_id: string | null;
          service_id: string | null;
          tipo: string;
          ordem: number;
          dados: Json;
          visivel: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          page_id?: string | null;
          project_id?: string | null;
          service_id?: string | null;
          tipo: string;
          ordem?: number;
          dados?: Json;
          visivel?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          page_id?: string | null;
          project_id?: string | null;
          service_id?: string | null;
          tipo?: string;
          ordem?: number;
          dados?: Json;
          visivel?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          slug: string;
          titulo: string;
          resumo: string;
          descricao: string;
          inclui: string[];
          nao_inclui: string[];
          para_quem: string;
          preco_min: number | null;
          preco_max: number | null;
          preco_texto: string | null;
          prazo_texto: string | null;
          ordem: number;
          visivel: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titulo: string;
          resumo?: string;
          descricao?: string;
          inclui?: string[];
          nao_inclui?: string[];
          para_quem?: string;
          preco_min?: number | null;
          preco_max?: number | null;
          preco_texto?: string | null;
          prazo_texto?: string | null;
          ordem?: number;
          visivel?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          slug: string;
          titulo: string;
          cliente: string;
          papel: string;
          ano: number | null;
          resumo: string;
          pedido: string;
          problema: string;
          decisao: string;
          mudou: string;
          resultado: string;
          citacao: string | null;
          citacao_autor: string | null;
          citacao_cargo: string | null;
          url_externa: string | null;
          capa_path: string | null;
          capa_alt: string | null;
          antes_path: string | null;
          antes_alt: string | null;
          depois_path: string | null;
          depois_alt: string | null;
          tags: string[];
          ordem: number;
          visivel: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titulo: string;
          cliente?: string;
          papel?: string;
          ano?: number | null;
          resumo?: string;
          pedido?: string;
          problema?: string;
          decisao?: string;
          mudou?: string;
          resultado?: string;
          citacao?: string | null;
          citacao_autor?: string | null;
          citacao_cargo?: string | null;
          url_externa?: string | null;
          capa_path?: string | null;
          capa_alt?: string | null;
          antes_path?: string | null;
          antes_alt?: string | null;
          depois_path?: string | null;
          depois_alt?: string | null;
          tags?: string[];
          ordem?: number;
          visivel?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          autor: string;
          cargo: string;
          texto: string;
          project_id: string | null;
          ordem: number;
          visivel: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          autor: string;
          cargo?: string;
          texto: string;
          project_id?: string | null;
          ordem?: number;
          visivel?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["testimonials"]["Insert"]>;
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          path: string;
          alt: string;
          largura: number | null;
          altura: number | null;
          tipo: string | null;
          bytes: number | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          path: string;
          alt: string;
          largura?: number | null;
          altura?: number | null;
          tipo?: string | null;
          bytes?: number | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media"]["Insert"]>;
        Relationships: [];
      };
      rascunhos: {
        Row: {
          id: string;
          tabela: string;
          registro_id: string;
          dados: Json;
          atualizado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          tabela: string;
          registro_id: string;
          dados?: Json;
          atualizado_por?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rascunhos"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          nome: string;
          email: string | null;
          whatsapp: string | null;
          origem: string;
          tipo_projeto: string | null;
          mensagem: string | null;
          respostas: Json;
          faixa_estimada: string | null;
          prazo_estimado: string | null;
          temperamento: Temperamento | null;
          /* A direcao visual escolhida pela pergunta 7 do briefing. Coluna
             propria, e nao o `temperamento` acima: aquilo era paleta do site
             inteiro, isto e resultado de tres palavras marcadas. Ver a 0014. */
          direcao_visual: string | null;
          /* Hash do ip de quem respondeu, nao o ip. Existe para devolver a
             tentativa quando o lead e apagado. */
          chave_limite: string | null;
          status: string;
          token_retorno: string;
          ip: string | null;
          user_agent: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email?: string | null;
          whatsapp?: string | null;
          origem?: string;
          tipo_projeto?: string | null;
          mensagem?: string | null;
          respostas?: Json;
          faixa_estimada?: string | null;
          prazo_estimado?: string | null;
          temperamento?: Temperamento | null;
          status?: string;
          token_retorno?: string;
          ip?: string | null;
          user_agent?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      proposals: {
        Row: {
          id: string;
          slug: string;
          token: string;
          lead_id: string | null;
          titulo: string;
          cliente: string;
          resumo: string;
          escopo: Json;
          etapas: Json;
          condicoes: string;
          preco: number | null;
          preco_texto: string | null;
          prazo_texto: string | null;
          status: string;
          expira_em: string | null;
          enviada_em: string | null;
          vista_em: string | null;
          aceito_em: string | null;
          aceite_ip: string | null;
          aceite_user_agent: string | null;
          aceite_nome: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          slug: string;
          token?: string;
          lead_id?: string | null;
          titulo: string;
          cliente?: string;
          resumo?: string;
          escopo?: Json;
          etapas?: Json;
          condicoes?: string;
          preco?: number | null;
          preco_texto?: string | null;
          prazo_texto?: string | null;
          status?: string;
          expira_em?: string | null;
          enviada_em?: string | null;
          vista_em?: string | null;
          aceito_em?: string | null;
          aceite_ip?: string | null;
          aceite_user_agent?: string | null;
          aceite_nome?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["proposals"]["Insert"]>;
        Relationships: [];
      };
      rate_limit: {
        Row: { chave: string; contagem: number; janela_inicio: string };
        Insert: { chave: string; contagem?: number; janela_inicio?: string };
        Update: Partial<{ chave: string; contagem: number; janela_inicio: string }>;
        Relationships: [];
      };
      briefing_perguntas: {
        Row: {
          id: string;
          chave: string;
          ordem: number;
          enunciado: string;
          ajuda: string | null;
          tipo: string;
          max_escolhas: number | null;
          visivel: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          chave: string;
          ordem?: number;
          enunciado: string;
          ajuda?: string | null;
          tipo?: string;
          max_escolhas?: number | null;
          visivel?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["briefing_perguntas"]["Insert"]>;
        Relationships: [];
      };
      /*
        Os pesos do calculo moram aqui, na mesma linha do rotulo. Quem le esta
        tabela e sempre o servidor — ver o `import "server-only"` no topo de
        lib/briefing.ts, que existe para tornar o engano um erro de build.
      */
      briefing_opcoes: {
        Row: {
          id: string;
          pergunta_id: string;
          ordem: number;
          valor: string;
          rotulo: string;
          base_min: number | null;
          base_max: number | null;
          dias_min: number | null;
          dias_max: number | null;
          fator: number | null;
          fator_dias: number | null;
          acrescimo_min: number | null;
          acrescimo_max: number | null;
          dias_acrescimo: number | null;
          neutra: boolean;
          sem_orcamento: boolean;
          frase: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          pergunta_id: string;
          ordem?: number;
          valor: string;
          rotulo: string;
          base_min?: number | null;
          base_max?: number | null;
          dias_min?: number | null;
          dias_max?: number | null;
          fator?: number | null;
          fator_dias?: number | null;
          acrescimo_min?: number | null;
          acrescimo_max?: number | null;
          dias_acrescimo?: number | null;
          neutra?: boolean;
          sem_orcamento?: boolean;
          frase?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["briefing_opcoes"]["Insert"]>;
        Relationships: [];
      };
      briefing_direcoes: {
        Row: {
          id: string;
          chave: string;
          rotulo: string;
          ordem: number;
          palavras: string[];
          cores: string[];
          fonte_titulo: string;
          fonte_texto: string;
          nota: string | null;
          visivel: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          chave: string;
          rotulo: string;
          ordem?: number;
          palavras?: string[];
          cores: string[];
          fonte_titulo: string;
          fonte_texto: string;
          nota?: string | null;
          visivel?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["briefing_direcoes"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      checar_rate_limit: {
        Args: { p_chave: string; p_limite: number; p_janela_segundos: number };
        Returns: boolean;
      };
      registrar_lead: {
        Args: {
          p_nome: string;
          p_email?: string | null;
          p_whatsapp?: string | null;
          p_origem?: string;
          p_tipo_projeto?: string | null;
          p_mensagem?: string | null;
          p_respostas?: Json;
          p_faixa_estimada?: string | null;
          p_prazo_estimado?: string | null;
          /* Morto desde a 0014: a coluna que ele alimentava guardava o
             temperamento do 5.1, removido do produto. Continua na assinatura
             para nao quebrar chamada antiga. */
          p_temperamento?: string | null;
          p_chave_limite?: string | null;
          p_direcao_visual?: string | null;
          /* Qual balde de rate_limit lembrar, sem checar. O briefing tem balde
             proprio (0017) e manda `p_chave_limite` nulo, mas ainda precisa
             registrar de onde veio para `apagar_lead` saber onde devolver. */
          p_balde?: string | null;
        };
        Returns: Json;
      };
      /* Apaga o lead e devolve uma tentativa ao balde de quem respondeu.
         `security definer` porque rate_limit e inacessivel por fora. Ver 0018. */
      apagar_lead: { Args: { p_id: string }; Returns: Json };
      /* Balde de tentativas do briefing, separado do /contato. Ver a 0017.
         Devolve { permitido, restam_segundos } para a tela poder dizer quanto
         falta em vez de so dizer nao. */
      checar_limite_briefing: {
        Args: { p_chave: string; p_limite?: number; p_janela_segundos?: number };
        Returns: Json;
      };
      briefing_por_token: { Args: { p_token: string }; Returns: Json };
      atualizar_briefing: {
        Args: {
          p_token: string;
          p_respostas: Json;
          p_faixa_estimada?: string | null;
          p_prazo_estimado?: string | null;
          p_nome?: string | null;
          p_email?: string | null;
          p_whatsapp?: string | null;
        };
        Returns: boolean;
      };
      proposta_por_token: { Args: { p_slug: string; p_token: string }; Returns: Json };
      aceitar_proposta: {
        Args: {
          p_slug: string;
          p_token: string;
          p_nome?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
