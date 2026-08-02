import {
  supabaseClient
} from "./supabase-client.js";

const STATUS_LABELS = {
  new: "Nova",
  read: "Lida",
  archived: "Arquivada",
  deleted: "No lixo"
};

const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "pt-PT",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

const SEARCH_DELAY = 300;

let messages = [];
let currentFilter = "all";
let currentSearch = "";
let searchTimer = null;
let isLoading = false;

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
          Pesquisa, organiza, exporta e recupera mensagens eliminadas.
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
          Total ativo
        </span>

        <strong id="admin-total-message-count">
          —
        </strong>

        <small>
          fora do lixo
        </small>
      </article>
    </div>

    <div class="admin-message-toolbar">

      <label class="admin-message-search">
        <span class="admin-message-search__icon">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
            ></circle>

            <path
              d="m20 20-4-4"
            ></path>
          </svg>
        </span>

        <input
          type="search"
          id="admin-message-search"
          placeholder="Pesquisar por nome, email, telefone ou mensagem"
          autocomplete="off"
        >

        <button
          type="button"
          id="clear-admin-message-search"
          aria-label="Limpar pesquisa"
          hidden
        >
          ×
        </button>
      </label>

      <button
        class="admin-button admin-button--secondary"
        id="export-admin-messages"
        type="button"
        disabled
      >
        Exportar CSV
      </button>

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

      <button
        type="button"
        data-message-filter="deleted"
        aria-pressed="false"
      >
        Lixo
      </button>
    </div>

    <div class="admin-message-results">
      <span id="admin-message-result-count">
        A carregar…
      </span>

      <span id="admin-message-current-view">
        Todas as mensagens
      </span>
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

  attachInterfaceEvents(
    section
  );
}

/* ==================================================
   EVENTOS DA INTERFACE
================================================== */

function attachInterfaceEvents(
  section
) {
  section
    .querySelector(
      "#refresh-admin-messages"
    )
    ?.addEventListener(
      "click",
      loadMessages
    );

  section
    .querySelector(
      "#export-admin-messages"
    )
    ?.addEventListener(
      "click",
      exportMessagesToCSV
    );

  const searchInput =
    section.querySelector(
      "#admin-message-search"
    );

  const clearSearch =
    section.querySelector(
      "#clear-admin-message-search"
    );

  searchInput?.addEventListener(
    "input",
    () => {
      currentSearch =
        searchInput.value.trim();

      if (clearSearch) {
        clearSearch.hidden =
          currentSearch === "";
      }

      window.clearTimeout(
        searchTimer
      );

      searchTimer =
        window.setTimeout(
          loadMessages,
          SEARCH_DELAY
        );
    }
  );

  clearSearch?.addEventListener(
    "click",
    () => {
      if (!searchInput) {
        return;
      }

      searchInput.value = "";
      currentSearch = "";
      clearSearch.hidden = true;

      searchInput.focus();

      loadMessages();
    }
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
          loadMessages();
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

      isDeleted:
        message.is_deleted === true,

      createdAt:
        message.created_at,

      updatedAt:
        message.updated_at,

      deletedAt:
        message.deleted_at
    })
  );
}

/* ==================================================
   RESUMO
================================================== */

async function loadMessageSummary() {
  try {
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_profile_admin_message_summary"
    );

    if (error) {
      throw error;
    }

    const summary =
      Array.isArray(data)
        ? data[0]
        : data;

    setText(
      "#admin-new-message-count",
      String(
        Number(
          summary?.new_count
        ) || 0
      )
    );

    setText(
      "#admin-total-message-count",
      String(
        Number(
          summary?.total_count
        ) || 0
      )
    );
  } catch (error) {
    console.error(
      "Não foi possível carregar o resumo das mensagens:",
      error
    );
  }
}

/* ==================================================
   INTERFACE
================================================== */

function setText(
  selector,
  value
) {
  const element =
    document.querySelector(
      selector
    );

  if (element) {
    element.textContent =
      value;
  }
}

function getCurrentViewLabel() {
  const labels = {
    all:
      "Todas as mensagens",

    new:
      "Mensagens novas",

    read:
      "Mensagens lidas",

    archived:
      "Mensagens arquivadas",

    deleted:
      "Mensagens no lixo"
  };

  return (
    labels[currentFilter] ||
    labels.all
  );
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

  setText(
    "#admin-message-current-view",
    getCurrentViewLabel()
  );
}

function updateResultInformation() {
  const count =
    messages.length;

  setText(
    "#admin-message-result-count",
    count === 1
      ? "1 resultado"
      : `${count} resultados`
  );

  const exportButton =
    document.querySelector(
      "#export-admin-messages"
    );

  if (exportButton) {
    exportButton.disabled =
      count === 0;
  }
}

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
   BOTÕES DAS MENSAGENS
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
   CARTÃO DE MENSAGEM
================================================== */

function createMessageCard(message) {
  const displayedStatus =
    message.isDeleted
      ? "deleted"
      : message.status;

  const article =
    document.createElement(
      "article"
    );

  article.className =
    `admin-message-card admin-message-card--${displayedStatus}`;

  article.dataset.messageId =
    message.id;

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
    `Recebida em ${formatDate(
      message.createdAt
    )}`;

  identity.append(
    name,
    date
  );

  if (
    message.isDeleted &&
    message.deletedAt
  ) {
    const deletedDate =
      document.createElement(
        "small"
      );

    deletedDate.className =
      "admin-message-card__deleted-date";

    deletedDate.textContent =
      `Movida para o lixo em ${formatDate(
        message.deletedAt
      )}`;

    identity.appendChild(
      deletedDate
    );
  }

  const status =
    document.createElement(
      "span"
    );

  status.className =
    "admin-message-card__status";

  status.textContent =
    STATUS_LABELS[
      displayedStatus
    ] || displayedStatus;

  header.append(
    identity,
    status
  );

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

    contacts.appendChild(
      phone
    );
  }

  const body =
    document.createElement("p");

  body.className =
    "admin-message-card__body";

  body.textContent =
    message.message;

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "admin-message-card__actions";

  if (message.isDeleted) {
    actions.appendChild(
      createActionButton(
        "Restaurar mensagem",
        "admin-message-card__button admin-message-card__button--restore",
        (button) => {
          restoreMessage(
            message.id,
            button
          );
        }
      )
    );
  } else {
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

    if (
      message.status ===
      "new"
    ) {
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
          "admin-message-card__button",
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
          "Retirar do arquivo",
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

    actions.appendChild(
      createActionButton(
        "Mover para o lixo",
        "admin-message-card__button admin-message-card__button--trash",
        (button) => {
          moveMessageToTrash(
            message.id,
            message.name,
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
   RENDERIZAÇÃO
================================================== */

function renderMessages() {
  const list =
    document.querySelector(
      "#admin-message-list"
    );

  if (!list) {
    return;
  }

  list.replaceChildren();

  if (
    messages.length === 0
  ) {
    const empty =
      document.createElement("p");

    empty.className =
      "admin-message-list__empty";

    if (currentSearch) {
      empty.textContent =
        "Não foram encontradas mensagens para esta pesquisa.";
    } else if (
      currentFilter ===
      "deleted"
    ) {
      empty.textContent =
        "O lixo está vazio.";
    } else {
      empty.textContent =
        "Não existem mensagens neste estado.";
    }

    list.appendChild(
      empty
    );

    updateResultInformation();

    return;
  }

  list.append(
    ...messages.map(
      createMessageCard
    )
  );

  updateResultInformation();
}

/* ==================================================
   CARREGAR MENSAGENS
================================================== */

async function loadMessages() {
  if (isLoading) {
    return;
  }

  isLoading = true;

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

  setText(
    "#admin-message-result-count",
    "A carregar…"
  );

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
      "get_profile_admin_messages_v2",
      {
        p_view:
          currentFilter,

        p_search:
          currentSearch,

        p_limit:
          500
      }
    );

    if (error) {
      throw error;
    }

    messages =
      normaliseMessages(data);

    renderMessages();

    await loadMessageSummary();
  } catch (error) {
    console.error(
      "Não foi possível carregar as mensagens:",
      error
    );

    messages = [];

    if (list) {
      list.innerHTML = `
        <p class="admin-message-list__empty">
          Não foi possível carregar as mensagens.
        </p>
      `;
    }

    setText(
      "#admin-message-result-count",
      "Indisponível"
    );
  } finally {
    isLoading = false;
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

    await loadMessages();
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
   MOVER PARA O LIXO
================================================== */

async function moveMessageToTrash(
  messageId,
  senderName,
  button
) {
  const confirmed =
    window.confirm(
      `Mover a mensagem de ${senderName} para o lixo?\n\nA mensagem poderá ser restaurada mais tarde.`
    );

  if (!confirmed) {
    return;
  }

  const originalText =
    button.textContent;

  button.disabled = true;
  button.textContent =
    "A mover…";

  try {
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "move_profile_message_to_trash",
      {
        p_message_id:
          messageId
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
  } catch (error) {
    console.error(
      "Não foi possível mover a mensagem para o lixo:",
      error
    );

    button.disabled = false;
    button.textContent =
      originalText;
  }
}

/* ==================================================
   RESTAURAR DO LIXO
================================================== */

async function restoreMessage(
  messageId,
  button
) {
  const originalText =
    button.textContent;

  button.disabled = true;
  button.textContent =
    "A restaurar…";

  try {
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "restore_profile_message_from_trash",
      {
        p_message_id:
          messageId
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
  } catch (error) {
    console.error(
      "Não foi possível restaurar a mensagem:",
      error
    );

    button.disabled = false;
    button.textContent =
      originalText;
  }
}

/* ==================================================
   EXPORTAR CSV
================================================== */

function escapeCSVValue(value) {
  const text =
    String(
      value ?? ""
    );

  if (
    text.includes(";") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return (
      `"${text.replaceAll(
        '"',
        '""'
      )}"`
    );
  }

  return text;
}

function exportMessagesToCSV() {
  if (
    messages.length === 0
  ) {
    return;
  }

  const header = [
    "Nome",
    "Email",
    "Telefone",
    "Mensagem",
    "Estado",
    "Recebida em",
    "Eliminada em"
  ];

  const rows =
    messages.map(
      (message) => [
        message.name,
        message.email,
        message.phone,
        message.message,
        message.isDeleted
          ? "No lixo"
          : STATUS_LABELS[
              message.status
            ],
        message.createdAt,
        message.deletedAt || ""
      ]
    );

  const csvContent =
    [
      header,
      ...rows
    ]
      .map(
        (row) =>
          row
            .map(
              escapeCSVValue
            )
            .join(";")
      )
      .join("\n");

  const blob =
    new Blob(
      [
        "\uFEFF",
        csvContent
      ],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );

  const objectUrl =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement("a");

  const currentDate =
    new Date()
      .toISOString()
      .slice(0, 10);

  link.href =
    objectUrl;

  link.download =
    `identityhub-mensagens-${currentFilter}-${currentDate}.csv`;

  document.body.appendChild(
    link
  );

  link.click();
  link.remove();

  window.setTimeout(
    () => {
      URL.revokeObjectURL(
        objectUrl
      );
    },
    1000
  );
}

/* ==================================================
   REALTIME
================================================== */

window.addEventListener(
  "identityhub:messageschanged",
  () => {
    window.setTimeout(
      loadMessages,
      80
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
              messages = [];
              renderMessages();
            }
          },
          0
        );
      }
    );
}

initialiseMessages();