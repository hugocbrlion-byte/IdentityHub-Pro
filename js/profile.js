export async function loadProfile() {
  const response = await fetch("./config/profile.json");

  if (!response.ok) {
    throw new Error(`Erro ao carregar o perfil: ${response.status}`);
  }

  return response.json();
}