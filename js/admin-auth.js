import {
  supabaseClient
} from "./supabase-client.js";

const loginPanel =
  document.querySelector(
    "#login-panel"
  );

const dashboardPanel =
  document.querySelector(
    "#dashboard-panel"
  );

const loginForm =
  document.querySelector(
    "#login-form"
  );

const emailInput =
  document.querySelector(
    "#admin-email"
  );

const passwordInput =
  document.querySelector(
    "#admin-password"
  );

const loginButton =
  document.querySelector(
    "#login-button"
  );

const loginButtonText =
  document.querySelector(
    "#login-button-text"
  );

const loginSpinner =
  document.querySelector(
    "#login-spinner"
  );

const loginMessage =
  document.querySelector(
    "#login-message"
  );

const userEmail =
  document.querySelector(
    "#admin-user-email"
  );

const logoutButton =
  document.querySelector(
    "#logout-button"
  );

const togglePasswordButton =
  document.querySelector(
    "#toggle-password"
  );

function setLoading(isLoading) {
  loginButton.disabled = isLoading;

  loginButtonText.textContent =
    isLoading
      ? "A verificar..."
      : "Entrar";

  loginSpinner.hidden =
    !isLoading;
}

function showMessage(message) {
  loginMessage.textContent =
    message;

  loginMessage.hidden = false;
}

function hideMessage() {
  loginMessage.hidden = true;
  loginMessage.textContent = "";
}

function showLogin() {
  loginPanel.hidden = false;
  dashboardPanel.hidden = true;

  passwordInput.value = "";
}

function showDashboard(session) {
  loginPanel.hidden = true;
  dashboardPanel.hidden = false;

  userEmail.textContent =
    session.user.email || "";
}

async function verifyAdministrator() {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "is_profile_admin"
  );

  if (error) {
    console.error(
      "Erro ao verificar administrador:",
      error
    );

    return false;
  }

  return data === true;
}

async function applySession(session) {
  if (!session) {
    showLogin();
    return;
  }

  const isAdministrator =
    await verifyAdministrator();

  if (!isAdministrator) {
    await supabaseClient.auth.signOut();

    showLogin();

    showMessage(
      "Esta conta não tem permissão para aceder à administração."
    );

    return;
  }

  hideMessage();
  showDashboard(session);
}

async function handleLogin(event) {
  event.preventDefault();

  hideMessage();
  setLoading(true);

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  try {
    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({
          email,
          password
        });

    if (error) {
      throw error;
    }

    const isAdministrator =
      await verifyAdministrator();

    if (!isAdministrator) {
      await supabaseClient.auth.signOut();

      throw new Error(
        "Esta conta não tem permissões de administrador."
      );
    }

    showDashboard(
      data.session
    );
  } catch (error) {
    console.error(
      "Falha no login:",
      error
    );

    showMessage(
      "Email ou palavra-passe incorretos, ou conta sem permissão."
    );
  } finally {
    setLoading(false);
  }
}

async function handleLogout() {
  logoutButton.disabled = true;

  const {
    error
  } =
    await supabaseClient.auth.signOut();

  logoutButton.disabled = false;

  if (error) {
    console.error(
      "Não foi possível terminar a sessão:",
      error
    );

    return;
  }

  showLogin();
}

function togglePasswordVisibility() {
  const isPasswordVisible =
    passwordInput.type === "text";

  passwordInput.type =
    isPasswordVisible
      ? "password"
      : "text";

  togglePasswordButton.textContent =
    isPasswordVisible
      ? "Mostrar"
      : "Ocultar";

  togglePasswordButton.setAttribute(
    "aria-label",
    isPasswordVisible
      ? "Mostrar palavra-passe"
      : "Ocultar palavra-passe"
  );
}

async function initialiseAdmin() {
  try {
    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();

    if (error) {
      throw error;
    }

    await applySession(
      data.session
    );
  } catch (error) {
    console.error(
      "Falha ao carregar a sessão:",
      error
    );

    showLogin();

    showMessage(
      "Não foi possível verificar a sessão."
    );
  }
}

loginForm.addEventListener(
  "submit",
  handleLogin
);

logoutButton.addEventListener(
  "click",
  handleLogout
);

togglePasswordButton.addEventListener(
  "click",
  togglePasswordVisibility
);

supabaseClient.auth.onAuthStateChange(
  (_event, session) => {
    window.setTimeout(() => {
      applySession(session);
    }, 0);
  }
);

initialiseAdmin();