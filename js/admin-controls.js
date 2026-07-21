import {
  supabaseClient
} from "./supabase-client.js";

const PROFILE_ID =
  "identityhub-pro";

const DEFAULT_THEME = {
  theme_name: "nebula-carbon",
  primary_color: "#7657ff",
  secondary_color: "#00cfee",
  background_color: "#05070a",
  glow_intensity: 0.75,
  motion_enabled: true
};

const FIELD_LABELS = {
  name: "Nome",
  tagline_pt: "Slogan em português",
  tagline_en: "Slogan em inglês",
  job_pt: "Profissão em português",
  job_en: "Profissão em inglês",
  location_pt: "Localização em português",
  location_en: "Localização em inglês",
  phone: "Telefone",
  whatsapp: "WhatsApp",
  email: "Email",
  instagram: "Instagram",
  steam: "Steam",
  photo_url: "Fotografia",
  theme_name: "Tema",
  primary_color: "Cor principal",
  secondary_color: "Cor secundária",
  background_color: "Cor de fundo",
  glow_intensity: "Intensidade do brilho",
  motion_enabled: "Movimento 3D",
  phone_visible: "Visibilidade do telefone",
  whatsapp_visible: "Visibilidade do WhatsApp",
  email_visible: "Visibilidade do email",
  instagram_visible: "Visibilidade do Instagram",
  steam_visible: "Visibilidade da Steam"
};

let controlsCreated = false;

/* ==================================================
   CRIAÇÃO DOS CONTROLOS
================================================== */

function createVisibilityPanel() {
  const steamInput =
    document.querySelector(
      "#steam-input"
    );

  const contactSection =
    steamInput?.closest(
      ".admin-editor-section"
    );

  if (
    !contactSection ||
    document.querySelector(
      "#admin-visibility-panel"
    )
  ) {
    return;
  }

  contactSection.insertAdjacentHTML(
    "beforeend",
    `
      <div
        class="admin-visibility-panel"
        id="admin-visibility-panel"
      >
        <div class="admin-visibility-heading">
          <strong>
            Visibilidade no cartão
          </strong>

          <p>
            Escolhe individualmente os contactos apresentados aos visitantes.
          </p>
        </div>

        <div class="admin-visibility-grid">

          <label class="admin-switch admin-visibility-item">
            <input
              type="checkbox"
              id="phone-visible-input"
              checked
            >

            <span
              class="admin-switch__control"
              aria-hidden="true"
            ></span>

            <span>Telefone</span>
          </label>

          <label class="admin-switch admin-visibility-item">
            <input
              type="checkbox"
              id="whatsapp-visible-input"
              checked
            >

            <span
              class="admin-switch__control"
              aria-hidden="true"
            ></span>

            <span>WhatsApp</span>
          </label>

          <label class="admin-switch admin-visibility-item">
            <input
              type="checkbox"
              id="email-visible-input"
              checked
            >

            <span
              class="admin-switch__control"
              aria-hidden="true"
            ></span>

            <span>Email</span>
          </label>

          <label class="admin-switch admin-visibility-item">
            <input
              type="checkbox"
              id="instagram-visible-input"
              checked
            >

            <span
              class="admin-switch__control"
              aria-hidden="true"
            ></span>

            <span>Instagram</span>
          </label>

          <label class="admin-switch admin-visibility-item">
            <input
              type="checkbox"
              id="steam-visible-input"
              checked
            >

            <span
              class="admin-switch__control"
              aria-hidden="true"
            ></span>

            <span>Steam</span>
          </label>

        </div>

        <div class="admin-visibility-actions">
          <p
            class="admin-control-message"
            id="visibility-message"
            role="status"
            hidden
          ></p>

          <button
            class="admin-button admin-button--secondary"
            id="save-visibility-button"
            type="button"
          >
            Guardar visibilidade
          </button>
        </div>
      </div>
    `
  );
}

function createThemeResetButton() {
  const themeInput =
    document.querySelector(
      "#theme-name-input"
    );

  const themeSection =
    themeInput?.closest(
      ".admin-editor-section"
    );

  if (
    !themeSection ||
    document.querySelector(
      "#reset-theme-button"
    )
  ) {
    return;
  }

  const heading =
    themeSection.querySelector(
      ".admin-editor-heading"
    );

  heading?.insertAdjacentHTML(
    "afterend",
    `
      <div class="admin-theme-reset">
        <div>
          <strong>
            Tema original
          </strong>

          <p>
            Repõe as cores, o brilho e o movimento do Nebula Carbon.
          </p>
        </div>

        <button
          class="admin-button admin-button--secondary"
          id="reset-theme-button"
          type="button"
        >
          Restaurar tema original
        </button>
      </div>
    `
  );
}

function createHistorySection() {
  const editor =
    document.querySelector(
      "#profile-editor-form"
    );

  if (
    !editor ||
    document.querySelector(
      "#admin-history-section"
    )
  ) {
    return;
  }

  editor.insertAdjacentHTML(
    "afterend",
    `
      <section
        class="admin-history"
        id="admin-history-section"
      >
        <div class="admin-history__heading">
          <div>
            <span class="admin-brand__eyebrow">
              Histórico
            </span>

            <h2>
              Alterações recentes
            </h2>

            <p>
              Registo das últimas alterações feitas ao perfil.
            </p>
          </div>

          <button
            class="admin-button admin-button--secondary"
            id="refresh-history-button"
            type="button"
          >
            Atualizar histórico
          </button>
        </div>

        <div
          class="admin-history__list"
          id="admin-history-list"
        >
          <p class="admin-history__empty">
            A carregar…
          </p>
        </div>
      </section>
    `
  );
}

function createControls() {
  if (controlsCreated) {
    return;
  }

  createVisibilityPanel();
  createThemeResetButton();
  createHistorySection();

  controlsCreated = true;
}

/* ==================================================
   VISIBILIDADE DOS CONTACTOS
================================================== */

function getVisibilityFields() {
  return {
    phone:
      document.querySelector(
        "#phone-visible-input"
      ),

    whatsapp:
      document.querySelector(
        "#whatsapp-visible-input"
      ),

    email:
      document.querySelector(
        "#email-visible-input"
      ),

    instagram:
      document.querySelector(
        "#instagram-visible-input"
      ),

    steam:
      document.querySelector(
        "#steam-visible-input"
      )
  };
}

function visibilityFieldsExist(fields) {
  return Object.values(fields).every(
    (field) => Boolean(field)
  );
}

function showControlMessage(
  text,
  type = "success"
) {
  const element =
    document.querySelector(
      "#visibility-message"
    );

  if (!element) {
    return;
  }

  element.textContent = text;
  element.dataset.type = type;
  element.hidden = false;
}

function hideControlMessage() {
  const element =
    document.querySelector(
      "#visibility-message"
    );

  if (!element) {
    return;
  }

  element.hidden = true;
  element.textContent = "";

  delete element.dataset.type;
}

function dispatchSaved(message) {
  window.dispatchEvent(
    new CustomEvent(
      "identityhub:adminsaved",
      {
        detail: {
          message
        }
      }
    )
  );
}

async function loadVisibility() {
  const fields =
    getVisibilityFields();

  if (!visibilityFieldsExist(fields)) {
    console.warn(
      "Os controlos de visibilidade não foram encontrados."
    );

    return;
  }

  const {
    data,
    error
  } = await supabaseClient
    .from("profile_settings")
    .select(`
      phone_visible,
      whatsapp_visible,
      email_visible,
      instagram_visible,
      steam_visible
    `)
    .eq(
      "id",
      PROFILE_ID
    )
    .single();

  if (error) {
    console.error(
      "Não foi possível carregar a visibilidade:",
      error
    );

    showControlMessage(
      "Não foi possível carregar a visibilidade.",
      "error"
    );

    return;
  }

  fields.phone.checked =
    data.phone_visible !== false;

  fields.whatsapp.checked =
    data.whatsapp_visible !== false;

  fields.email.checked =
    data.email_visible !== false;

  fields.instagram.checked =
    data.instagram_visible !== false;

  fields.steam.checked =
    data.steam_visible !== false;
}

async function saveVisibility() {
  const button =
    document.querySelector(
      "#save-visibility-button"
    );

  const fields =
    getVisibilityFields();

  if (
    !button ||
    !visibilityFieldsExist(fields)
  ) {
    return;
  }

  hideControlMessage();

  button.disabled = true;
  button.textContent = "A guardar…";

  try {
    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth
        .getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData.session) {
      throw new Error(
        "A sessão terminou. Inicia sessão novamente."
      );
    }

    const values = {
      phone_visible:
        fields.phone.checked,

      whatsapp_visible:
        fields.whatsapp.checked,

      email_visible:
        fields.email.checked,

      instagram_visible:
        fields.instagram.checked,

      steam_visible:
        fields.steam.checked
    };

    const {
      error
    } = await supabaseClient
      .from("profile_settings")
      .update(values)
      .eq(
        "id",
        PROFILE_ID
      )
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    showControlMessage(
      "Visibilidade atualizada."
    );

    dispatchSaved(
      "Visibilidade dos contactos atualizada."
    );

    await loadHistory();
  } catch (error) {
    console.error(
      "Não foi possível guardar a visibilidade:",
      error
    );

    showControlMessage(
      error.message ||
        "Não foi possível guardar a visibilidade.",
      "error"
    );
  } finally {
    button.disabled = false;
    button.textContent =
      "Guardar visibilidade";
  }
}

/* ==================================================
   RESTAURO DO TEMA
================================================== */

function updateThemeForm() {
  const themeName =
    document.querySelector(
      "#theme-name-input"
    );

  const primary =
    document.querySelector(
      "#primary-color-input"
    );

  const secondary =
    document.querySelector(
      "#secondary-color-input"
    );

  const background =
    document.querySelector(
      "#background-color-input"
    );

  const glow =
    document.querySelector(
      "#glow-intensity-input"
    );

  const motion =
    document.querySelector(
      "#motion-enabled-input"
    );

  if (themeName) {
    themeName.value =
      DEFAULT_THEME.theme_name;

    themeName.dispatchEvent(
      new Event(
        "change",
        {
          bubbles: true
        }
      )
    );
  }

  if (primary) {
    primary.value =
      DEFAULT_THEME.primary_color;
  }

  if (secondary) {
    secondary.value =
      DEFAULT_THEME.secondary_color;
  }

  if (background) {
    background.value =
      DEFAULT_THEME.background_color;
  }

  if (glow) {
    glow.value =
      String(
        DEFAULT_THEME.glow_intensity
      );

    glow.dispatchEvent(
      new Event(
        "input",
        {
          bubbles: true
        }
      )
    );
  }

  if (motion) {
    motion.checked =
      DEFAULT_THEME.motion_enabled;
  }
}

async function resetTheme() {
  const button =
    document.querySelector(
      "#reset-theme-button"
    );

  if (!button) {
    return;
  }

  const accepted =
    window.confirm(
      "Restaurar o tema Nebula Carbon original?"
    );

  if (!accepted) {
    return;
  }

  button.disabled = true;
  button.textContent = "A restaurar…";

  try {
    const {
      error
    } = await supabaseClient
      .from("profile_settings")
      .update(DEFAULT_THEME)
      .eq(
        "id",
        PROFILE_ID
      )
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    updateThemeForm();

    dispatchSaved(
      "Tema original restaurado."
    );

    await loadHistory();
  } catch (error) {
    console.error(
      "Não foi possível restaurar o tema:",
      error
    );

    window.alert(
      error.message ||
        "Não foi possível restaurar o tema."
    );
  } finally {
    button.disabled = false;
    button.textContent =
      "Restaurar tema original";
  }
}

/* ==================================================
   HISTÓRICO DE ALTERAÇÕES
================================================== */

function translateField(field) {
  return (
    FIELD_LABELS[field] ||
    String(field).replaceAll(
      "_",
      " "
    )
  );
}

function formatHistoryDate(value) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Data desconhecida";
  }

  return new Intl.DateTimeFormat(
    "pt-PT",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}

function createHistoryItem(item) {
  const article =
    document.createElement(
      "article"
    );

  article.className =
    "admin-history-item";

  const date =
    document.createElement(
      "time"
    );

  date.dateTime =
    item.changed_at || "";

  date.textContent =
    formatHistoryDate(
      item.changed_at
    );

  const fields =
    Array.isArray(
      item.changed_fields
    )
      ? item.changed_fields
      : [];

  const title =
    document.createElement(
      "strong"
    );

  title.textContent =
    fields.length === 1
      ? "1 campo alterado"
      : `${fields.length} campos alterados`;

  const description =
    document.createElement(
      "p"
    );

  description.textContent =
    fields.length > 0
      ? fields
          .map(translateField)
          .join(" · ")
      : "Alteração do perfil";

  const author =
    document.createElement(
      "small"
    );

  author.textContent =
    `Por ${
      item.changed_by_email ||
      "Sistema"
    }`;

  article.append(
    date,
    title,
    description,
    author
  );

  return article;
}

async function loadHistory() {
  const list =
    document.querySelector(
      "#admin-history-list"
    );

  if (!list) {
    return;
  }

  list.innerHTML = `
    <p class="admin-history__empty">
      A carregar…
    </p>
  `;

  try {
    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth
        .getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData.session) {
      return;
    }

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_profile_change_history",
      {
        p_limit: 20
      }
    );

    if (error) {
      throw error;
    }

    list.replaceChildren();

    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      list.innerHTML = `
        <p class="admin-history__empty">
          Ainda não existem alterações registadas.
        </p>
      `;

      return;
    }

    list.append(
      ...data.map(
        createHistoryItem
      )
    );
  } catch (error) {
    console.error(
      "Não foi possível carregar o histórico:",
      error
    );

    list.innerHTML = `
      <p class="admin-history__empty">
        Não foi possível carregar o histórico.
      </p>
    `;
  }
}

/* ==================================================
   EVENTOS E INICIALIZAÇÃO
================================================== */

function attachEvents() {
  document
    .querySelector(
      "#save-visibility-button"
    )
    ?.addEventListener(
      "click",
      saveVisibility
    );

  document
    .querySelector(
      "#reset-theme-button"
    )
    ?.addEventListener(
      "click",
      resetTheme
    );

  document
    .querySelector(
      "#refresh-history-button"
    )
    ?.addEventListener(
      "click",
      loadHistory
    );
}

async function loadAdminControls() {
  await Promise.all([
    loadVisibility(),
    loadHistory()
  ]);
}

async function initialiseControls() {
  createControls();
  attachEvents();

  const {
    data,
    error
  } =
    await supabaseClient.auth
      .getSession();

  if (error) {
    console.error(
      "Não foi possível verificar a sessão:",
      error
    );

    return;
  }

  if (data.session) {
    await loadAdminControls();
  }

  supabaseClient.auth
    .onAuthStateChange(
      (_event, session) => {
        window.setTimeout(() => {
          if (session) {
            loadAdminControls();
          }
        }, 0);
      }
    );

  window.addEventListener(
    "identityhub:adminsaved",
    () => {
      loadHistory();
    }
  );
}

initialiseControls();