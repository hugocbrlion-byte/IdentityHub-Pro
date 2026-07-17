const DEFAULT_THEME = {
  primaryColor: "#7657ff",
  secondaryColor: "#00cfee",
  backgroundColor: "#05070a",
  glowIntensity: 0.75
};

function isValidHexColour(value) {
  return /^#[0-9a-f]{6}$/i.test(
    String(value || "")
  );
}

function safeColour(value, fallback) {
  return isValidHexColour(value)
    ? value
    : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}

export function applyProfileTheme(profile = {}) {
  const root =
    document.documentElement;

  const primaryColor =
    safeColour(
      profile.primary_color,
      DEFAULT_THEME.primaryColor
    );

  const secondaryColor =
    safeColour(
      profile.secondary_color,
      DEFAULT_THEME.secondaryColor
    );

  const backgroundColor =
    safeColour(
      profile.background_color,
      DEFAULT_THEME.backgroundColor
    );

  const parsedGlow =
    Number(profile.glow_intensity);

  const glowIntensity =
    Number.isFinite(parsedGlow)
      ? clamp(parsedGlow, 0, 1)
      : DEFAULT_THEME.glowIntensity;

  /*
   * Convertemos 0–1 numa opacidade adequada
   * para o brilho visual do fundo.
   */
  const glowAlpha =
    0.08 + glowIntensity * 0.25;

  root.style.setProperty(
    "--theme-primary",
    primaryColor
  );

  root.style.setProperty(
    "--theme-secondary",
    secondaryColor
  );

  root.style.setProperty(
    "--theme-background",
    backgroundColor
  );

  root.style.setProperty(
    "--theme-glow-alpha",
    String(glowAlpha)
  );

  root.dataset.theme =
    profile.theme_name ||
    "nebula-carbon";

  document.body.classList.toggle(
    "motion-disabled",
    profile.motion_enabled === false
  );
}