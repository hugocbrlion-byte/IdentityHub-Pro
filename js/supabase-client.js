import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
} from "./supabase-config.js";

function validateConfiguration() {
  if (
    !SUPABASE_URL ||
    SUPABASE_URL.includes("COLOCA_AQUI")
  ) {
    throw new Error(
      "O Project URL do Supabase ainda não foi configurado."
    );
  }

  if (
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY.includes("COLOCA_AQUI")
  ) {
    throw new Error(
      "A Publishable key do Supabase ainda não foi configurada."
    );
  }

  if (!window.supabase?.createClient) {
    throw new Error(
      "A biblioteca do Supabase não foi carregada."
    );
  }
}

validateConfiguration();

export const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );