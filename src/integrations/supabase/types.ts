export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      letter_picks: {
        Row: {
          created_at: string;
          letter: string;
          player_slot: string;
          round: number;
          session_id: string;
        };
        Insert: {
          created_at?: string;
          letter: string;
          player_slot: string;
          round: number;
          session_id: string;
        };
        Update: {
          created_at?: string;
          letter?: string;
          player_slot?: string;
          round?: number;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "letter_picks_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          code: string;
          created_at: string;
          current_round: number;
          current_turn: string | null;
          end_letter: string | null;
          guest_id: string | null;
          guest_name: string | null;
          guest_score: number;
          host_id: string;
          host_name: string;
          host_score: number;
          id: string;
          last_result: Json | null;
          phase: string;
          rematch_code: string | null;
          round_history: Json;
          rounds_total: number;
          start_letter: string | null;
          starter_slot: string | null;
          turn_ends_at: string | null;
          turn_seconds: number;
          updated_at: string;
          used_words: string[];
        };
        Insert: {
          code: string;
          created_at?: string;
          current_round?: number;
          current_turn?: string | null;
          end_letter?: string | null;
          guest_id?: string | null;
          guest_name?: string | null;
          guest_score?: number;
          host_id: string;
          host_name?: string;
          host_score?: number;
          id?: string;
          last_result?: Json | null;
          phase?: string;
          rematch_code?: string | null;
          round_history?: Json;
          rounds_total?: number;
          start_letter?: string | null;
          starter_slot?: string | null;
          turn_ends_at?: string | null;
          turn_seconds?: number;
          updated_at?: string;
          used_words?: string[];
        };
        Update: {
          code?: string;
          created_at?: string;
          current_round?: number;
          current_turn?: string | null;
          end_letter?: string | null;
          guest_id?: string | null;
          guest_name?: string | null;
          guest_score?: number;
          host_id?: string;
          host_name?: string;
          host_score?: number;
          id?: string;
          last_result?: Json | null;
          phase?: string;
          rematch_code?: string | null;
          round_history?: Json;
          rounds_total?: number;
          start_letter?: string | null;
          starter_slot?: string | null;
          turn_ends_at?: string | null;
          turn_seconds?: number;
          updated_at?: string;
          used_words?: string[];
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          created_at: string;
          id: string;
          player_slot: string;
          reason: string | null;
          round: number;
          session_id: string;
          valid: boolean;
          word: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          player_slot: string;
          reason?: string | null;
          round: number;
          session_id: string;
          valid: boolean;
          word: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          player_slot?: string;
          reason?: string | null;
          round?: number;
          session_id?: string;
          valid?: boolean;
          word?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      wl_games: {
        Row: {
          created_at: string;
          current_turn_player_id: string | null;
          end_reason: string | null;
          grid: string;
          id: string;
          last_move_at: string;
          player1_id: string;
          player2_id: string | null;
          room_code: string;
          status: Database["public"]["Enums"]["wl_game_status"];
          winner_id: string | null;
        };
        Insert: {
          created_at?: string;
          current_turn_player_id?: string | null;
          end_reason?: string | null;
          grid: string;
          id?: string;
          last_move_at?: string;
          player1_id: string;
          player2_id?: string | null;
          room_code: string;
          status?: Database["public"]["Enums"]["wl_game_status"];
          winner_id?: string | null;
        };
        Update: {
          created_at?: string;
          current_turn_player_id?: string | null;
          end_reason?: string | null;
          grid?: string;
          id?: string;
          last_move_at?: string;
          player1_id?: string;
          player2_id?: string | null;
          room_code?: string;
          status?: Database["public"]["Enums"]["wl_game_status"];
          winner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wl_games_current_turn_player_id_fkey";
            columns: ["current_turn_player_id"];
            isOneToOne: false;
            referencedRelation: "wl_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wl_games_player1_id_fkey";
            columns: ["player1_id"];
            isOneToOne: false;
            referencedRelation: "wl_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wl_games_player2_id_fkey";
            columns: ["player2_id"];
            isOneToOne: false;
            referencedRelation: "wl_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wl_games_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "wl_players";
            referencedColumns: ["id"];
          },
        ];
      };
      wl_moves: {
        Row: {
          created_at: string;
          game_id: string;
          id: string;
          passed: boolean;
          player_id: string;
          tile_indices: number[];
          word: string;
        };
        Insert: {
          created_at?: string;
          game_id: string;
          id?: string;
          passed?: boolean;
          player_id: string;
          tile_indices?: number[];
          word?: string;
        };
        Update: {
          created_at?: string;
          game_id?: string;
          id?: string;
          passed?: boolean;
          player_id?: string;
          tile_indices?: number[];
          word?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wl_moves_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "wl_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wl_moves_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "wl_players";
            referencedColumns: ["id"];
          },
        ];
      };
      wl_players: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          session_id: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          id?: string;
          session_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          session_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      wl_game_status: "waiting" | "active" | "completed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      wl_game_status: ["waiting", "active", "completed"],
    },
  },
} as const;
