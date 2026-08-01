import {
  supabaseClient
} from "./supabase-client.js";

const PROFILE_ID =
  "identityhub-pro";

const DEFAULT_ORDER = [
  "phone",
  "whatsapp",
  "email",
  "instagram",
  "steam"
];

const CONTACT_LABELS = {
  phone: "Telefone",
  whatsapp: "WhatsApp",
  email: "Email",
  instagram: "Instagram",
  steam: "Steam"
};

const CONTACT_SYMBOLS = {
  phone: "☎",
  whatsapp: "◉",
  email: "✉",
  instagram: "◎",
  steam: "◌"
};

let currentOrder = [
  ...DEFAULT_ORDER
];

function normaliseOrder(value) {
  const receivedOrder =
    Array.isArray(value)
      ? value
      : [];

  const validOrder = [];

  receivedOrder.forEach(
    (contact) => {
      if (
        DEFAULT_ORDER.includes(contact) &&
        !validOrder.includes(contact)
      ) {
        validOrder.push(contact);
      }
    }
  );

  DEFAULT_ORDER.forEach(
    (contact) => {
      if (
        !validOrder.includes(contact)
      ) {
        validOrder.push(contact);
      }
    }
  );

  return validOrder;
}

function createOrderPanel() {
  if (
    document.querySelector(
      "#admin-contact-order-panel"
    )
  ) {
    return;
  }

  const steamInput =
    document.querySelector(
      "#steam-input"
    );

  const contactSection =
    steamInput?.closest(
      ".admin-editor-section"
    );

  if (!contactSection) {
    console.warn(
      "A secção de contactos não foi encontrada."
    );

    return;
  }

  const panel =
    document.createElement("div");

  panel.id =
    "admin-contact-order-panel";

  panel.className =
    "admin-contact-order";

  panel.innerHTML = `
    <div class="admin-contact-order__heading">
      <div>
        <strong>
          Ordem dos ícones
        </strong>

        <p>
          Define a posição em que os contactos aparecem no cartão.
        </p>
      </div>

      <button
        class="admin-contact-order__reset"
        id="reset-contact-order-button"
        type="button"
      >
        Repor ordem
      </button>
    </div>

    <input
      type="hidden"
      id="contact-order-input"
      value=""
    >

    <ol
      class="admin-contact-order__list"
      id="contact-order-list"
    ></ol>

    <div class="admin-contact-order__actions">
      <p
        class="admin-control-message"
        id="contact-order-message"
        role="status"
        hidden
      ></p>

      <button
        class="admin-button admin-button--secondary"
        id="save-contact-order-button"
        type="button"
      >
        Guardar ordem
      </button>
    </div>
  `;

  const visibilityPanel =
    contactSection.querySelector(
      "#admin-visibility-panel"
    );

  if (visibilityPanel) {
    visibilityPanel.insertAdjacentElement(
      "afterend",
      panel
    );
  } else {
    contactSection.appendChild(
      panel
    );
  }
}

function showMessage(
  text,
  type = "success"
) {
  const element =
    document.querySelector(
      "#contact-order-message"
    );

  if (!element) {
    return;
  }

  element.textContent = text;
  element.dataset.type = type;
  element.hidden = false;
}

function hideMessage() {
  const element =
    document.querySelector(
      "#contact-order-message"
    );

  if (!element) {
    return;
  }

  element.hidden = true;
  element.textContent = "";

  delete element.dataset.type;
}

function updateHiddenInput() {
  const input =
    document.querySelector(
      "#contact-order-input"
    );

  if (!input) {
    return;
  }

  input.value =
    JSON.stringify(
      currentOrder
    );

  input.dispatchEvent(
    new Event(
      "input",
      {
        bubbles: true
      }
    )
  );

  window.dispatchEvent(
    new CustomEvent(
      "identityhub:contactorderchange",
      {
        detail: {
          order: [
            ...currentOrder
          ]
        }
      }
    )
  );
}

function moveContact(
  key,
  direction
) {
  const currentIndex =
    currentOrder.indexOf(key);

  const nextIndex =
    currentIndex + direction;

  if (
    currentIndex < 0 ||
    nextIndex < 0 ||
    nextIndex >=
      currentOrder.length
  ) {
    return;
  }

  const updatedOrder = [
    ...currentOrder
  ];

  [
    updatedOrder[currentIndex],
    updatedOrder[nextIndex]
  ] = [
    updatedOrder[nextIndex],
    updatedOrder[currentIndex]
  ];

  currentOrder =
    updatedOrder;

  renderOrder();
}

function createOrderItem(
  key,
  index
) {
  const item =
    document.createElement("li");

  item.className =
    "admin-contact-order__item";

  item.dataset.contactKey =
    key;

  const position =
    document.createElement("span");

  position.className =
    "admin-contact-order__position";

  position.textContent =
    String(index + 1);

  const symbol =
    document.createElement("span");

  symbol.className =
    `admin-contact-order__symbol admin-contact-order__symbol--${key}`;

  symbol.setAttribute(
    "aria-hidden",
    "true"
  );

  symbol.textContent =
    CONTACT_SYMBOLS[key];

  const label =
    document.createElement("strong");

  label.textContent =
    CONTACT_LABELS[key];

  const controls =
    document.createElement("div");

  controls.className =
    "admin-contact-order__controls";

  const moveUpButton =
    document.createElement("button");

  moveUpButton.type =
    "button";

  moveUpButton.textContent =
    "↑";

  moveUpButton.disabled =
    index === 0;

  moveUpButton.setAttribute(
    "aria-label",
    `Mover ${CONTACT_LABELS[key]} para cima`
  );

  moveUpButton.addEventListener(
    "click",
    () => {
      moveContact(
        key,
        -1
      );
    }
  );

  const moveDownButton =
    document.createElement("button");

  moveDownButton.type =
    "button";

  moveDownButton.textContent =
    "↓";

  moveDownButton.disabled =
    index ===
    currentOrder.length - 1;

  moveDownButton.setAttribute(
    "aria-label",
    `Mover ${CONTACT_LABELS[key]} para baixo`
  );

  moveDownButton.addEventListener(
    "click",
    () => {
      moveContact(
        key,
        1
      );
    }
  );

  controls.append(
    moveUpButton,
    moveDownButton
  );

  item.append(
    position,
    symbol,
    label,
    controls
  );

  return item;
}

function renderOrder() {
  const list =
    document.querySelector(
      "#contact-order-list"
    );

  if (!list) {
    return;
  }

  list.replaceChildren(
    ...currentOrder.map(
      createOrderItem
    )
  );

  updateHiddenInput();
}

async function loadContactOrder() {
  const {
    data,
    error
  } = await supabaseClient
    .from("profile_settings")
    .select("contact_order")
    .eq(
      "id",
      PROFILE_ID
    )
    .single();

  if (error) {
    console.error(
      "Não foi possível carregar a ordem:",
      error
    );

    showMessage(
      "Não foi possível carregar a ordem dos ícones.",
      "error"
    );

    return;
  }

  currentOrder =
    normaliseOrder(
      data.contact_order
    );

  renderOrder();
}

async function saveContactOrder() {
  const button =
    document.querySelector(
      "#save-contact-order-button"
    );

  if (!button) {
    return;
  }

  hideMessage();

  button.disabled = true;
  button.textContent =
    "A guardar…";

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

    const {
      error
    } = await supabaseClient
      .from("profile_settings")
      .update({
        contact_order:
          currentOrder
      })
      .eq(
        "id",
        PROFILE_ID
      )
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    showMessage(
      "Ordem dos ícones atualizada."
    );

    window.dispatchEvent(
      new CustomEvent(
        "identityhub:adminsaved",
        {
          detail: {
            message:
              "Ordem dos ícones atualizada."
          }
        }
      )
    );
  } catch (error) {
    console.error(
      "Não foi possível guardar a ordem:",
      error
    );

    showMessage(
      error.message ||
        "Não foi possível guardar a ordem.",
      "error"
    );
  } finally {
    button.disabled = false;
    button.textContent =
      "Guardar ordem";
  }
}

function resetContactOrder() {
  currentOrder = [
    ...DEFAULT_ORDER
  ];

  renderOrder();

  showMessage(
    "Ordem original reposta. Carrega em Guardar ordem."
  );
}

function attachEvents() {
  document
    .querySelector(
      "#save-contact-order-button"
    )
    ?.addEventListener(
      "click",
      saveContactOrder
    );

  document
    .querySelector(
      "#reset-contact-order-button"
    )
    ?.addEventListener(
      "click",
      resetContactOrder
    );
}

async function initialiseContactOrder() {
  createOrderPanel();
  attachEvents();
  renderOrder();

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
    await loadContactOrder();
  }

  supabaseClient.auth
    .onAuthStateChange(
      (_event, session) => {
        window.setTimeout(() => {
          if (session) {
            loadContactOrder();
          }
        }, 0);
      }
    );
}

initialiseContactOrder();