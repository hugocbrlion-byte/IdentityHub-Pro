import {
  supabaseClient
} from "./supabase-client.js";

const PROFILE_ID =
  "identityhub-pro";

const FALLBACK_PROFILE_URL =
  "./config/profile.json";

/*
 * Confirma que um valor contém texto válido.
 */
function validText(value) {
  return (
    typeof value === "string" &&
    value.trim() !== ""
  );
}

/*
 * Utiliza o valor recebido ou um valor alternativo.
 */
function textOrFallback(
  value,
  fallback = ""
) {
  return validText(value)
    ? value.trim()
    : fallback;
}

/*
 * Converte um valor numérico com segurança.
 */
function numberOrFallback(
  value,
  fallback
) {
  const parsedValue =
    Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
}

/*
 * Confirma valores booleanos vindos do Supabase.
 */
function booleanOrFallback(
  value,
  fallback = true
) {
  return typeof value === "boolean"
    ? value
    : fallback;
}

/*
 * Carrega os dados locais do perfil.
 * Estes dados são usados caso o Supabase fique
 * temporariamente indisponível.
 */
async function loadFallbackProfile() {
  const response =
    await fetch(
      FALLBACK_PROFILE_URL
    );

  if (!response.ok) {
    throw new Error(
      `Não foi possível carregar ${FALLBACK_PROFILE_URL}.`
    );
  }

  return response.json();
}

/*
 * Carrega as configurações atuais da base de dados.
 */
async function loadDatabaseSettings() {
  const {
    data,
    error
  } = await supabaseClient
    .from("profile_settings")
    .select("*")
    .eq(
      "id",
      PROFILE_ID
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/*
 * Junta os dados locais com os dados guardados
 * através da área de administração.
 */
function mergeProfile(
  fallback,
  settings = {}
) {
  const fallbackTagline =
    fallback.tagline ||
    "One Tap. Infinite Connections.";

  const fallbackJob =
    fallback.job ||
    "Store Manager";

  const fallbackLocation =
    fallback.location ||
    "Portugal";

  const fallbackPhoto =
    fallback.photo_url ||
    fallback.photo ||
    fallback.avatar ||
    "./assets/images/profile.jpg";

  return {
    /*
     * Mantém propriedades adicionais do profile.json,
     * como website e outros dados já existentes.
     */
    ...fallback,

    id: PROFILE_ID,

    /*
     * Informação principal
     */
    name:
      textOrFallback(
        settings.name,
        fallback.name ||
          "Hugo Rodrigues"
      ),

    tagline_pt:
      textOrFallback(
        settings.tagline_pt,
        fallbackTagline
      ),

    tagline_en:
      textOrFallback(
        settings.tagline_en,
        fallbackTagline
      ),

    job_pt:
      textOrFallback(
        settings.job_pt,
        fallbackJob
      ),

    job_en:
      textOrFallback(
        settings.job_en,
        fallbackJob
      ),

    location_pt:
      textOrFallback(
        settings.location_pt,
        fallbackLocation
      ),

    location_en:
      textOrFallback(
        settings.location_en,
        fallbackLocation
      ),

    /*
     * Contactos e redes sociais
     */
    phone:
      textOrFallback(
        settings.phone,
        fallback.phone || ""
      ),

    whatsapp:
      textOrFallback(
        settings.whatsapp,
        fallback.whatsapp ||
        fallback.phone ||
        ""
      ),

    email:
      textOrFallback(
        settings.email,
        fallback.email || ""
      ),

    instagram:
      textOrFallback(
        settings.instagram,
        fallback.instagram || ""
      ),

    steam:
      textOrFallback(
        settings.steam,
        fallback.steam || ""
      ),

    /*
     * Fotografia
     */
    photo_url:
      textOrFallback(
        settings.photo_url,
        fallbackPhoto
      ),

    /*
     * Configurações do tema
     */
    theme_name:
      textOrFallback(
        settings.theme_name,
        "nebula-carbon"
      ),

    primary_color:
      textOrFallback(
        settings.primary_color,
        "#7657ff"
      ),

    secondary_color:
      textOrFallback(
        settings.secondary_color,
        "#00cfee"
      ),

    background_color:
      textOrFallback(
        settings.background_color,
        "#05070a"
      ),

    glow_intensity:
      numberOrFallback(
        settings.glow_intensity,
        0.75
      ),

    motion_enabled:
      booleanOrFallback(
        settings.motion_enabled,
        true
      ),

    /*
     * Visibilidade individual dos contactos
     */
    phone_visible:
      booleanOrFallback(
        settings.phone_visible,
        true
      ),

    whatsapp_visible:
      booleanOrFallback(
        settings.whatsapp_visible,
        true
      ),

    email_visible:
      booleanOrFallback(
        settings.email_visible,
        true
      ),

    instagram_visible:
      booleanOrFallback(
        settings.instagram_visible,
        true
      ),

    steam_visible:
      booleanOrFallback(
        settings.steam_visible,
        true
      )
  };
}

/*
 * Escolhe os textos portugueses ou ingleses
 * conforme o idioma ativo.
 */
export function getLocalizedProfile(
  profile,
  language = "pt"
) {
  const selectedLanguage =
    language === "pt"
      ? "pt"
      : "en";

  return {
    ...profile,

    tagline:
      profile[
        `tagline_${selectedLanguage}`
      ] ||
      profile.tagline ||
      "One Tap. Infinite Connections.",

    job:
      profile[
        `job_${selectedLanguage}`
      ] ||
      profile.job ||
      "Store Manager",

    location:
      profile[
        `location_${selectedLanguage}`
      ] ||
      profile.location ||
      "Portugal"
  };
}

/*
 * Função principal utilizada pelo app.js.
 */
export async function loadProfile() {
  const fallbackProfile =
    await loadFallbackProfile();

  try {
    const settings =
      await loadDatabaseSettings();

    return mergeProfile(
      fallbackProfile,
      settings
    );
  } catch (error) {
    console.warn(
      "Foram utilizados os dados locais do perfil porque não foi possível carregar o Supabase:",
      error
    );

    return mergeProfile(
      fallbackProfile
    );
  }
}