import {
  supabaseClient
} from "./supabase-client.js";

const STATUS_LABELS = {
  new: "Nova",
  read: "Lida",
  archived: "Arquivada"
};

const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "pt-PT",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

let allMessages = [];
let currentFilter = "all";

/* ==================================================
   CRIAR SECÇÃO
================================================== */

function createMessagesSection() {
  if (
    document.querySelector(
      "#admin-messages-section"
    )
  ) {
    return;
  }

  const anchor =
    document.querySelector(
      "#admin-funnel-section"
    ) ||
    document.querySelector(
      "#admin-action-statistics"
    ) ||
    document.querySelector(
      ".admin-insights"
    ) ||
    document.querySelector(
      ".admin-summary"
    );

  if (!anchor) {
    console.warn(
      "Não foi possível encontrar a zona onde inserir a caixa de mensagens."
    );

    return;
  }

  const section =
    document.createElement(
      "section"
    );

  section.id =
    "admin-messages-section";

  section.className =
    "admin-messages";

  section.innerHTML = `
    <div class="admin-messages__heading">
      <div>
        <span class="admin-brand__eyebrow">
          Contactos recebidos
        </span>

        <h2>
          Caixa de mensagens
        </h2>

        <p>
          Consulta e organiza as mensagens enviadas através do cartão.
        </p>
      </div>

      <button
        class="admin-button admin-button--secondary"
        id="refresh-admin-messages"
        type="button"
      >
        Atualizar
      </button>
    </div>

    <div class="admin-messages__overview">
      <article>
        <span>
          Mensagens novas
        </span>

        <strong id="admin-new-message-count">
          —
        </strong>

        <small>
          por consultar
        </small>
      </article>

      <article>
        <span>
          Total recebido
        </span>

        <strong id="admin-total-message-count">
          —
        </strong>

        <small>
          mensagens guardadas
        </small>
      </article>
    </div>

    <div
      class="admin-message-filters"
      aria-label="Filtrar mensagens"
    >
      <button
        type="button"
        data-message-filter="all"
        aria-pressed="true"
      >
        Todas
      </button>

      <button
        type="button"
        data-message-filter="new"
        aria-pressed="false"
      >
        Novas
      </button>

      <button
        type="button"
        data-message-filter="read"
        aria-pressed="false"
      >
        Lidas
      </button>

      <button
        type="button"
        data-message-filter="archived"
        aria-pressed="false"
      >
        Arquivadas
      </button>
    </div>

    <div
      class="admin-message-list"
      id="admin-message-list"
    >
      <p class="admin-message-list__empty">
        A carregar…
      </p>
    </div>
  `;

  anchor.insertAdjacentElement(
    "afterend",
    section
  );

  section
    .querySelector(
      "#refresh-admin-messages"
    )
    ?.addEventListener(
      "click",
      loadMessages
    );

  section
    .querySelectorAll(
      "[data-message-filter]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          currentFilter =
            button.dataset
              .messageFilter || "all";

          updateFilterButtons();
          renderMessages();
        }
      );
    });
}

/* ==================================================
   NORMALIZAR DADOS
================================================== */

function normaliseMessages(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(
    (message) => ({
      id:
        message.message_id,

      name:
        message.sender_name || "",

      email:
        message.sender_email || "",

      phone:
        message.sender_phone || "",

      message:
        message.message_body || "",

      status:
        message.message_status ||
        "new",

      createdAt:
        message.created_at,

      updatedAt:
        message.updated_at
    })
  );
}

/* ==================================================
   RESUMO E FILTROS
================================================== */

function updateOverview() {
  const newCount =
    allMessages.filter(
      (message) =>
        message.status === "new"
    ).length;

  const newElement =
    document.querySelector(
      "#admin-new-message-count"
    );

  const totalElement =
    document.querySelector(
      "#admin-total-message-count"
    );

  if (newElement) {
    newElement.textContent =
      String(newCount);
  }

  if (totalElement) {
    totalElement.textContent =
      String(allMessages.length);
  }
}

function updateFilterButtons() {
  document
    .querySelectorAll(
      "[data-message-filter]"
    )
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        button.dataset
          .messageFilter ===
          currentFilter
          ? "true"
          : "false"
      );
    });
}

/* ==================================================
   FORMATAÇÃO
================================================== */

function formatDate(value) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Data desconhecida";
  }

  return DATE_FORMATTER.format(
    date
  );
}

/* ==================================================
   CRIAR BOTÕES
================================================== */

function createActionButton(
  text,
  className,
  handler
) {
  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.className =
    className;

  button.textContent =
    text;

  button.addEventListener(
    "click",
    () => handler(button)
  );

  return button;
}

/* ==================================================
   CRIAR CARTÃO DE MENSAGEM
================================================== */

function createMessageCard(message) {
  const article =
    document.createElement(
      "article"
    );

  article.className =
    `admin-message-card admin-message-card--${message.status}`;

  article.dataset.messageId =
    message.id;

  /* ------------------------------
     CABEÇALHO
  ------------------------------ */

  const header =
    document.createElement(
      "header"
    );

  const identity =
    document.createElement(
      "div"
    );

  const name =
    document.createElement(
      "strong"
    );

  name.textContent =
    message.name;

  const date =
    document.createElement(
      "time"
    );

  date.dateTime =
    message.createdAt || "";

  date.textContent =
    formatDate(
      message.createdAt
    );

  identity.append(
    name,
    date
  );

  const status =
    document.createElement(
      "span"
    );

  status.className =
    "admin-message-card__status";

  status.textContent =
    STATUS_LABELS[
      message.status
    ] || message.status;

  header.append(
    identity,
    status
  );

  /* ------------------------------
     CONTACTOS
  ------------------------------ */

  const contacts =
    document.createElement(
      "div"
    );

  contacts.className =
    "admin-message-card__contacts";

  if (message.email) {
    const email =
      document.createElement("a");

    email.href =
      `mailto:${message.email}`;

    email.textContent =
      message.email;

    email.setAttribute(
      "aria-label",
      `Enviar email para ${message.email}`
    );

    contacts.appendChild(
      email
    );
  }

  if (message.phone) {
    const phone =
      document.createElement("a");

    phone.href =
      `tel:${message.phone}`;

    phone.textContent =
      message.phone;

    phone.setAttribute(
      "aria-label",
      `Telefonar para ${message.phone}`
    );

    contacts.appendChild(
      phone
    );
  }

  /* ------------------------------
     CORPO DA MENSAGEM
  ------------------------------ */

  const body =
    document.createElement("p");

  body.className =
    "admin-message-card__body";

  body.textContent =
    message.message;

  /* ------------------------------
     AÇÕES
  ------------------------------ */

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "admin-message-card__actions";

  if (message.email) {
    const reply =
      document.createElement("a");

    reply.className =
      "admin-message-card__reply";

    reply.href =
      `mailto:${message.email}?subject=${encodeURIComponent(
        "Resposta à tua mensagem"
      )}`;

    reply.textContent =
      "Responder por email";

    actions.appendChild(
      reply
    );
  }

  if (message.status === "new") {
    actions.appendChild(
      createActionButton(
        "Marcar como lida",
        "admin-message-card__button",
        (button) => {
          updateMessageStatus(
            message.id,
            "read",
            button
          );
        }
      )
    );
  }

  if (
    message.status !==
    "archived"
  ) {
    actions.appendChild(
      createActionButton(
        "Arquivar",
        "admin-message-card__button admin-message-card__button--archive",
        (button) => {
          updateMessageStatus(
            message.id,
            "archived",
            button
          );
        }
      )
    );
  } else {
    actions.appendChild(
      createActionButton(
        "Restaurar",
        "admin-message-card__button",
        (button) => {
          updateMessageStatus(
            message.id,
            "read",
            button
          );
        }
      )
    );
  }

  article.append(
    header,
    contacts,
    body,
    actions
  );

  return article;
}

/* ==================================================
   RENDERIZAR MENSAGENS
================================================== */

function renderMessages() {
  const list =
    document.querySelector(
      "#admin-message-list"
    );

  if (!list) {
    return;
  }

  const filteredMessages =
    currentFilter === "all"
      ? allMessages
      : allMessages.filter(
          (message) =>
            message.status ===
            currentFilter
        );

  list.replaceChildren();

  if (
    filteredMessages.length === 0
  ) {
    const empty =
      document.createElement("p");

    empty.className =
      "admin-message-list__empty";

    empty.textContent =
      currentFilter === "all"
        ? "Ainda não existem mensagens."
        : "Não existem mensagens neste estado.";

    list.appendChild(
      empty
    );

    return;
  }

  list.append(
    ...filteredMessages.map(
      createMessageCard
    )
  );
}

/* ==================================================
   CARREGAR MENSAGENS DO SUPABASE
================================================== */

async function loadMessages() {
  const list =
    document.querySelector(
      "#admin-message-list"
    );

  if (list) {
    list.innerHTML = `
      <p class="admin-message-list__empty">
        A carregar…
      </p>
    `;
  }

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
      if (list) {
        list.innerHTML = `
          <p class="admin-message-list__empty">
            Inicia sessão para consultar as mensagens.
          </p>
        `;
      }

      return;
    }

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_profile_admin_messages",
      {
        p_status: null,
        p_limit: 100
      }
    );

    if (error) {
      throw error;
    }

    allMessages =
      normaliseMessages(data);

    updateOverview();
    renderMessages();
  } catch (error) {
    console.error(
      "Não foi possível carregar as mensagens:",
      error
    );

    if (list) {
      list.innerHTML = `
        <p class="admin-message-list__empty">
          Não foi possível carregar as mensagens.
        </p>
      `;
    }
  }
}

/* ==================================================
   ATUALIZAR ESTADO
================================================== */

async function updateMessageStatus(
  messageId,
  nextStatus,
  button
) {
  const originalText =
    button.textContent;

  button.disabled = true;
  button.textContent =
    "A atualizar…";

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
      data,
      error
    } = await supabaseClient.rpc(
      "update_profile_message_status",
      {
        p_message_id:
          messageId,

        p_status:
          nextStatus
      }
    );

    if (error) {
      throw error;
    }

    if (data !== true) {
      throw new Error(
        "A mensagem não foi encontrada."
      );
    }

    await loadMessages();

    window.dispatchEvent(
      new CustomEvent(
        "identityhub:messagestatuschanged",
        {
          detail: {
            messageId,
            status:
              nextStatus
          }
        }
      )
    );
  } catch (error) {
    console.error(
      "Não foi possível atualizar a mensagem:",
      error
    );

    button.disabled = false;
    button.textContent =
      originalText;
  }
}

/* ==================================================
   ATUALIZAÇÃO EM TEMPO REAL
================================================== */

window.addEventListener(
  "identityhub:messageschanged",
  () => {
    loadMessages();
  }
);

/*
 * Quando uma mensagem muda de estado,
 * o módulo de tempo real pode atualizar
 * novamente o contador.
 */
window.addEventListener(
  "identityhub:messagestatuschanged",
  () => {
    window.setTimeout(
      loadMessages,
      100
    );
  }
);

/* ==================================================
   INICIALIZAÇÃO
================================================== */

async function initialiseMessages() {
  createMessagesSection();
  updateFilterButtons();

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
    await loadMessages();
  }

  supabaseClient.auth
    .onAuthStateChange(
      (_event, session) => {
        window.setTimeout(
          () => {
            if (session) {
              loadMessages();
            } else {
              allMessages = [];

              updateOverview();
              renderMessages();
            }
          },
          0
        );
      }
    );
}

initialiseMessages();