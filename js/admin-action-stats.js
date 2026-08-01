import {
  supabaseClient
} from "./supabase-client.js";

const CONTACTS = [
  {
    key: "phone",
    label: "Telefone",
    symbol: "☎"
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    symbol: "◉"
  },
  {
    key: "email",
    label: "Email",
    symbol: "✉"
  },
  {
    key: "instagram",
    label: "Instagram",
    symbol: "◎"
  },
  {
    key: "steam",
    label: "Steam",
    symbol: "◌"
  }
];

const NUMBER_FORMATTER =
  new Intl.NumberFormat(
    "pt-PT"
  );

let section = null;

function formatNumber(value) {
  return NUMBER_FORMATTER.format(
    Number(value) || 0
  );
}

function createStatisticsSection() {
  if (
    document.querySelector(
      "#admin-action-statistics"
    )
  ) {
    return;
  }

  const anchor =
    document.querySelector(
      ".admin-insights"
    ) ||
    document.querySelector(
      ".admin-summary"
    );

  if (!anchor) {
    console.warn(
      "Não foi possível encontrar a zona das estatísticas."
    );

    return;
  }

  section =
    document.createElement(
      "section"
    );

  section.id =
    "admin-action-statistics";

  section.className =
    "admin-action-statistics";

  section.innerHTML = `
    <div class="admin-action-statistics__heading">
      <div>
        <span class="admin-brand__eyebrow">
          Interações
        </span>

        <h2>
          Cliques nos contactos
        </h2>

        <p>
          Descobre quais são os contactos mais utilizados pelos visitantes.
        </p>
      </div>

      <button
        class="admin-button admin-button--secondary"
        id="refresh-action-statistics"
        type="button"
      >
        Atualizar
      </button>
    </div>

    <div class="admin-action-overview">
      <article>
        <span>
          Total de interações
        </span>

        <strong id="admin-action-total">
          —
        </strong>

        <small>
          desde o início da contagem
        </small>
      </article>

      <article>
        <span>
          Últimos 7 dias
        </span>

        <strong id="admin-action-seven-days">
          —
        </strong>

        <small>
          interações na última semana
        </small>
      </article>

      <article>
        <span>
          Últimos 30 dias
        </span>

        <strong id="admin-action-thirty-days">
          —
        </strong>

        <small>
          interações no último mês
        </small>
      </article>

      <article>
        <span>
          Contacto mais utilizado
        </span>

        <strong
          class="admin-action-overview__top"
          id="admin-action-top"
        >
          —
        </strong>

        <small>
          baseado nos últimos 30 dias
        </small>
      </article>
    </div>

    <div class="admin-action-ranking">
      <div class="admin-action-ranking__header">
        <strong>
          Desempenho por contacto
        </strong>

        <span id="admin-action-status">
          A carregar…
        </span>
      </div>

      <div
        class="admin-action-ranking__list"
        id="admin-action-ranking-list"
      ></div>
    </div>
  `;

  anchor.insertAdjacentElement(
    "afterend",
    section
  );

  section
    .querySelector(
      "#refresh-action-statistics"
    )
    ?.addEventListener(
      "click",
      loadActionStatistics
    );
}

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

function normaliseRows(data) {
  const receivedRows =
    Array.isArray(data)
      ? data
      : [];

  const rowsByKey =
    new Map(
      receivedRows.map(
        (row) => [
          row.action_key,
          row
        ]
      )
    );

  return CONTACTS.map(
    (contact) => {
      const row =
        rowsByKey.get(
          contact.key
        ) || {};

      return {
        ...contact,

        total_clicks:
          Number(
            row.total_clicks
          ) || 0,

        last_7_days:
          Number(
            row.last_7_days
          ) || 0,

        last_30_days:
          Number(
            row.last_30_days
          ) || 0
      };
    }
  );
}

function createRankingItem(
  item,
  maximum
) {
  const article =
    document.createElement(
      "article"
    );

  article.className =
    `admin-action-ranking__item admin-action-ranking__item--${item.key}`;

  const percentage =
    maximum > 0
      ? (
          item.last_30_days /
          maximum
        ) * 100
      : 0;

  article.innerHTML = `
    <span
      class="admin-action-ranking__symbol"
      aria-hidden="true"
    >
      ${item.symbol}
    </span>

    <div class="admin-action-ranking__content">
      <div class="admin-action-ranking__labels">
        <strong>
          ${item.label}
        </strong>

        <span>
          ${formatNumber(item.last_30_days)}
          nos últimos 30 dias
        </span>
      </div>

      <div class="admin-action-ranking__track">
        <span
          style="width: ${percentage}%"
        ></span>
      </div>
    </div>

    <strong class="admin-action-ranking__total">
      ${formatNumber(item.total_clicks)}
    </strong>
  `;

  return article;
}

function renderStatistics(rows) {
  const totalClicks =
    rows.reduce(
      (total, row) =>
        total +
        row.total_clicks,
      0
    );

  const sevenDays =
    rows.reduce(
      (total, row) =>
        total +
        row.last_7_days,
      0
    );

  const thirtyDays =
    rows.reduce(
      (total, row) =>
        total +
        row.last_30_days,
      0
    );

  const orderedRows = [
    ...rows
  ].sort(
    (first, second) =>
      second.last_30_days -
      first.last_30_days
  );

  const topContact =
    orderedRows[0];

  const hasRecentClicks =
    topContact &&
    topContact.last_30_days > 0;

  setText(
    "#admin-action-total",
    formatNumber(totalClicks)
  );

  setText(
    "#admin-action-seven-days",
    formatNumber(sevenDays)
  );

  setText(
    "#admin-action-thirty-days",
    formatNumber(thirtyDays)
  );

  setText(
    "#admin-action-top",
    hasRecentClicks
      ? topContact.label
      : "Sem dados"
  );

  const rankingList =
    document.querySelector(
      "#admin-action-ranking-list"
    );

  if (!rankingList) {
    return;
  }

  const maximum =
    Math.max(
      1,
      ...rows.map(
        (row) =>
          row.last_30_days
      )
    );

  rankingList.replaceChildren(
    ...orderedRows.map(
      (item) =>
        createRankingItem(
          item,
          maximum
        )
    )
  );
}

async function loadActionStatistics() {
  const status =
    document.querySelector(
      "#admin-action-status"
    );

  if (status) {
    status.textContent =
      "A atualizar…";
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
      return;
    }

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_profile_admin_action_stats"
    );

    if (error) {
      throw error;
    }

    renderStatistics(
      normaliseRows(data)
    );

    if (status) {
      status.textContent =
        "Atualizado";
    }
  } catch (error) {
    console.error(
      "Não foi possível carregar as interações:",
      error
    );

    if (status) {
      status.textContent =
        "Indisponível";
    }
  }
}

async function initialiseActionStatistics() {
  createStatisticsSection();

  const {
    data
  } =
    await supabaseClient.auth
      .getSession();

  if (data.session) {
    await loadActionStatistics();
  }

  supabaseClient.auth
    .onAuthStateChange(
      (_event, session) => {
        window.setTimeout(() => {
          if (session) {
            loadActionStatistics();
          }
        }, 0);
      }
    );
}

initialiseActionStatistics();