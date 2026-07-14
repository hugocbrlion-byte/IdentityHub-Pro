export function getProfileUrl(profile) {
  const configuredUrl = profile?.website?.trim();

  if (!configuredUrl) {
    throw new Error(
      "O endereço do site não está definido em profile.website."
    );
  }

  try {
    return new URL(configuredUrl).href;
  } catch {
    throw new Error(
      `O endereço definido em profile.website não é válido: ${configuredUrl}`
    );
  }
}