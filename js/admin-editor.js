import {
  supabaseClient
} from "./supabase-client.js";

const PROFILE_ID =
  "identityhub-pro";

const THEME_PRESETS = {
  "nebula-carbon": {
    primary_color: "#7657ff",
    secondary_color: "#00cfee",
    background_color: "#05070a",
    glow_intensity: 0.75
  },

  "ocean-pulse": {
    primary_color: "#008cff",
    secondary_color: "#00f5d4",
    background_color: "#031219",
    glow_intensity: 0.8
  },

  "cyber-purple": {
    primary_color: "#b026ff",
    secondary_color: "#ff3cac",
    background_color: "#08030f",
    glow_intensity: 0.85
  },

  "emerald-night": {
    primary_color: "#00d084",
    secondary_color: "#7dffb3",
    background_color: "#03110c",
    glow_intensity: 0.65
  },

  "sunset-gold": {
    primary_color: "#ff8a00",
    secondary_color: "#ffd166",
    background_color: "#160c03",
    glow_intensity: 0.7
  }
};

const form =
  document.querySelector(
    "#profile-editor-form"
  );

const fields = {
  name:
    document.querySelector(
      "#profile-name-input"
    ),

  taglinePt:
    document.querySelector(
      "#tagline-pt-input"
    ),

  taglineEn:
    document.querySelector(
      "#tagline-en-input"
    ),

  jobPt:
    document.querySelector(
      "#job-pt-input"
    ),

  jobEn:
    document.querySelector(
      "#job-en-input"
    ),

  locationPt:
    document.querySelector(
      "#location-pt-input"
    ),

  locationEn:
    document.querySelector(
      "#location-en-input"
    ),

  phone:
    document.querySelector(
      "#phone-input"
    ),

  whatsapp:
    document.querySelector(
      "#whatsapp-input"
    ),

  email:
    document.querySelector(
      "#profile-email-input"
    ),

  instagram:
    document.querySelector(
      "#instagram-input"
    ),

  steam:
    document.querySelector(
      "#steam-input"
    ),

  themeName:
    document.querySelector(
      "#theme-name-input"
    ),

  primaryColor:
    document.querySelector(
      "#primary-color-input"
    ),

  secondaryColor:
    document.querySelector(
      "#secondary-color-input"
    ),

  backgroundColor:
    document.querySelector(
      "#background-color-input"
    ),

  glowIntensity:
    document.querySelector(
      "#glow-intensity-input"
    ),

  motionEnabled:
    document.querySelector(
      "#motion-enabled-input"
    )
};

const preview =
  document.querySelector(
    "#theme-preview"
  );

const previewName =
  document.querySelector(
    "#preview-name"
  );

const previewTagline =
  document.querySelector(
    "#preview-tagline"
  );

const photoPreview =
  document.querySelector(
    "#admin-photo-preview"
  );

const glowOutput =
  document.querySelector(
    "#glow-value-output"
  );

const totalVisits =
  document.querySelector(
    "#admin-total-visits"
  );

const message =
  document.querySelector(
    "#profile-editor-message"
  );

const saveButton =
  document.querySelector(
    "#profile-save-button"
  );

const saveText =
  document.querySelector(
    "#profile-save-text"
  );

const saveSpinner =
  document.querySelector(
    "#profile-save-spinner"
  );

let currentSettings = null;

function textValue(value, fallback = "") {
  return (
    typeof value === "string" &&
    value.trim() !== ""
  )
    ? value.trim()
    : fallback;
}

async function loadFallbackProfile() {
  const response =
    await fetch(
      "./config/profile.json"
    );

  if (!response.ok) {
    return {};
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

function mergeWithFallback(
  settings,
  fallback
) {
  return {
    ...settings,

    name:
      textValue(
        settings.name,
        fallback.name
      ),

    tagline_pt:
      textValue(
        settings.tagline_pt,
        fallback.tagline
      ),

    tagline_en:
      textValue(
        settings.tagline_en,
        fallback.tagline
      ),

    job_pt:
      textValue(
        settings.job_pt,
        fallback.job
      ),

    job_en:
      textValue(
        settings.job_en,
        fallback.job
      ),

    location_pt:
      textValue(
        settings.location_pt,
        fallback.location
      ),

    location_en:
      textValue(
        settings.location_en,
        fallback.location
      ),

    phone:
      textValue(
        settings.phone,
        fallback.phone
      ),

    whatsapp:
      textValue(
        settings.whatsapp,
        fallback.whatsapp
      ),

    email:
      textValue(
        settings.email,
        fallback.email
      ),

    instagram:
      textValue(
        settings.instagram,
        fallback.instagram
      ),

    steam:
      textValue(
        settings.steam,
        fallback.steam
      ),

    photo_url:
      textValue(
        settings.photo_url,
        "./assets/images/profile.jpg"
      )
  };
}

function fillForm(settings) {
  fields.name.value =
    settings.name || "";

  fields.taglinePt.value =
    settings.tagline_pt || "";

  fields.taglineEn.value =
    settings.tagline_en || "";

  fields.jobPt.value =
    settings.job_pt || "";

  fields.jobEn.value =
    settings.job_en || "";

  fields.locationPt.value =
    settings.location_pt || "";

  fields.locationEn.value =
    settings.location_en || "";

  fields.phone.value =
    settings.phone || "";

  fields.whatsapp.value =
    settings.whatsapp || "";

  fields.email.value =
    settings.email || "";

  fields.instagram.value =
    settings.instagram || "";

  fields.steam.value =
    settings.steam || "";

  fields.themeName.value =
    settings.theme_name ||
    "nebula-carbon";

  fields.primaryColor.value =
    settings.primary_color ||
    "#7657ff";

  fields.secondaryColor.value =
    settings.secondary_color ||
    "#00cfee";

  fields.backgroundColor.value =
    settings.background_color ||
    "#05070a";

  fields.glowIntensity.value =
    Number(
      settings.glow_intensity ??
      0.75
    );

  fields.motionEnabled.checked =
    settings.motion_enabled !== false;

  photoPreview.src =
    settings.photo_url ||
    "./assets/images/profile.jpg";

  updatePreview();
}

function updatePreview() {
  const glow =
    Number(
      fields.glowIntensity.value
    );

  preview.style.setProperty(
    "--preview-primary",
    fields.primaryColor.value
  );

  preview.style.setProperty(
    "--preview-secondary",
    fields.secondaryColor.value
  );

  preview.style.setProperty(
    "--preview-background",
    fields.backgroundColor.value
  );

  preview.style.opacity =
    String(
      0.75 + glow * 0.25
    );

  previewName.textContent =
    fields.name.value ||
    "Hugo Rodrigues";

  previewTagline.textContent =
    fields.taglinePt.value ||
    "One Tap. Infinite Connections.";

  glowOutput.textContent =
    `${Math.round(glow * 100)}%`;
}

function applySelectedPreset() {
  const selectedTheme =
    fields.themeName.value;

  const preset =
    THEME_PRESETS[selectedTheme];

  if (!preset) {
    updatePreview();
    return;
  }

  fields.primaryColor.value =
    preset.primary_color;

  fields.secondaryColor.value =
    preset.secondary_color;

  fields.backgroundColor.value =
    preset.background_color;

  fields.glowIntensity.value =
    preset.glow_intensity;

  updatePreview();
}

function markThemeAsCustom() {
  fields.themeName.value =
    "custom";

  updatePreview();
}

function readFormValues() {
  return {
    name:
      fields.name.value.trim(),

    tagline_pt:
      fields.taglinePt.value.trim(),

    tagline_en:
      fields.taglineEn.value.trim(),

    job_pt:
      fields.jobPt.value.trim(),

    job_en:
      fields.jobEn.value.trim(),

    location_pt:
      fields.locationPt.value.trim(),

    location_en:
      fields.locationEn.value.trim(),

    phone:
      fields.phone.value.trim(),

    whatsapp:
      fields.whatsapp.value.trim(),

    email:
      fields.email.value.trim(),

    instagram:
      fields.instagram.value.trim(),

    steam:
      fields.steam.value.trim(),

    theme_name:
      fields.themeName.value,

    primary_color:
      fields.primaryColor.value,

    secondary_color:
      fields.secondaryColor.value,

    background_color:
      fields.backgroundColor.value,

    glow_intensity:
      Number(
        fields.glowIntensity.value
      ),

    motion_enabled:
      fields.motionEnabled.checked
  };
}

function setSaving(isSaving) {
  saveButton.disabled =
    isSaving;

  saveText.textContent =
    isSaving
      ? "A guardar..."
      : "Guardar alterações";

  saveSpinner.hidden =
    !isSaving;
}

function showMessage(
  text,
  type = "success"
) {
  message.textContent = text;
  message.dataset.type = type;
  message.hidden = false;
}

async function loadVisitTotal() {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_profile_views"
  );

  if (error) {
    console.warn(
      "Não foi possível carregar o total de visitas:",
      error
    );

    return;
  }

  totalVisits.textContent =
    new Intl.NumberFormat(
      "pt-PT"
    ).format(
      Number(data) || 0
    );
}

async function handleSave(event) {
  event.preventDefault();

  message.hidden = true;
  setSaving(true);

  try {
    const {
      data: sessionData
    } =
      await supabaseClient.auth
        .getSession();

    if (!sessionData.session) {
      throw new Error(
        "A sessão terminou. Inicia sessão novamente."
      );
    }

    const values =
      readFormValues();

    const {
      data,
      error
    } = await supabaseClient
      .from("profile_settings")
      .update(values)
      .eq("id", PROFILE_ID)
      .select()
      .single();

    if (error) {
      throw error;
    }

    currentSettings = data;

    showMessage(
  "Alterações guardadas com sucesso."
);

window.dispatchEvent(
  new CustomEvent(
    "identityhub:adminsaved",
    {
      detail: {
        message:
          "Perfil e tema atualizados com sucesso."
      }
    }
  )
);
  } catch (error) {
    console.error(
      "Não foi possível guardar o perfil:",
      error
    );

    showMessage(
      error.message ||
      "Não foi possível guardar as alterações.",
      "error"
    );
  } finally {
    setSaving(false);
  }
}

async function initialiseEditor() {
  try {
    const [
      fallback,
      settings
    ] = await Promise.all([
      loadFallbackProfile(),
      loadDatabaseSettings()
    ]);

    currentSettings =
      mergeWithFallback(
        settings,
        fallback
      );

    fillForm(
      currentSettings
    );

    await loadVisitTotal();
  } catch (error) {
    console.error(
      "Não foi possível carregar o editor:",
      error
    );

    showMessage(
      "Não foi possível carregar os dados do perfil.",
      "error"
    );
  }
}

fields.themeName.addEventListener(
  "change",
  applySelectedPreset
);

fields.primaryColor.addEventListener(
  "input",
  markThemeAsCustom
);

fields.secondaryColor.addEventListener(
  "input",
  markThemeAsCustom
);

fields.backgroundColor.addEventListener(
  "input",
  markThemeAsCustom
);

fields.glowIntensity.addEventListener(
  "input",
  updatePreview
);

fields.name.addEventListener(
  "input",
  updatePreview
);

fields.taglinePt.addEventListener(
  "input",
  updatePreview
);

form.addEventListener(
  "submit",
  handleSave
);

initialiseEditor();