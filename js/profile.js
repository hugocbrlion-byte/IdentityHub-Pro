import {
  supabaseClient
} from "./supabase-client.js";

const PROFILE_ID =
  "identityhub-pro";

const FALLBACK_PROFILE_URL =
  "./config/profile.json";

function validText(value) {
  return (
    typeof value === "string" &&
    value.trim() !== ""
  );
}

function textOrFallback(
  value,
  fallback = ""
) {
  return validText(value)
    ? value.trim()
    : fallback;
}

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

async function loadFallbackProfile() {
  const response =
    await fetch(FALLBACK_PROFILE_URL);

  if (!response.ok) {
    throw new Error(
      `Não foi possível carregar ${FALLBACK_PROFILE_URL}.`
    );
  }

  return response.json();
}

async function loadDatabaseSettings() {
  const {
    data,
    error
  } = await supabaseClient
    .from("profile_settings")
    .select("*")
    .eq("id", PROFILE_ID)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

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

  return {
    ...fallback,

    id: PROFILE_ID,

    name:
      textOrFallback(
        settings.name,
        fallback.name
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

    phone:
      textOrFallback(
        settings.phone,
        fallback.phone
      ),

    whatsapp:
      textOrFallback(
        settings.whatsapp,
        fallback.whatsapp
      ),

    email:
      textOrFallback(
        settings.email,
        fallback.email
      ),

    instagram:
      textOrFallback(
        settings.instagram,
        fallback.instagram
      ),

    steam:
      textOrFallback(
        settings.steam,
        fallback.steam
      ),

    photo_url:
      textOrFallback(
        settings.photo_url,
        fallback.photo_url ||
          fallback.photo ||
          fallback.avatar ||
          "./assets/images/profile.jpg"
      ),

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
      typeof settings.motion_enabled ===
      "boolean"
        ? settings.motion_enabled
        : true
  };
}

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
      ] || profile.tagline,

    job:
      profile[
        `job_${selectedLanguage}`
      ] || profile.job,

    location:
      profile[
        `location_${selectedLanguage}`
      ] || profile.location
  };
}

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
      "Foram utilizados os dados locais do perfil:",
      error
    );

    return mergeProfile(
      fallbackProfile
    );
  }
}