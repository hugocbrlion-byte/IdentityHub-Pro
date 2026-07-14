export async function loadProfile() {
  const response = await fetch(
    `./config/profile.json?v=${Date.now()}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao carregar o perfil: ${response.status}`
    );
  }

  return response.json();
}