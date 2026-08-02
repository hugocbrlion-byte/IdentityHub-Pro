import {
  supabaseClient
} from "./supabase-client.js";

const NUMBER_FORMATTER =
  new Intl.NumberFormat(
    "pt-PT"
  );

const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "pt-PT",
    {
      day: "2-digit",
      month: "short"
    }
  );

const FULL_DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "pt-PT",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );

const AVAILABLE_PERIODS = [
  7,
  14,
  30
];

let selectedPeriod = 30;
let currentRows = [];
let chartCanvas = null;
let resizeTimer = null;

/* ==================================================
   FORMATAÇÃO
================================================== */

function formatNumber(value) {
  return NUMBER_FORMATTER.format(
    Number(value) || 0
  );
}

function formatPercentage(value) {
  const numericValue =
    Number(value) || 0;

  return (
    numericValue.toLocaleString(
      "pt-PT",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }
    ) + "%"
  );
}

function parseReportDate(value) {
  const date =
    new Date(
      `${value}T00:00:00`
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
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

/* ==================================================
   CRIAR SECÇÃO
================================================== */

function createFunnelSection() {
  if (
    document.querySelector(
      "#admin-funnel-section"
    )
  ) {
    return;
  }

  const anchor =
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
      "Não foi possível encontrar a zona das estatísticas."
    );

    return;
  }

  const section =
    document.createElement(
      "section"
    );

  section.id =
    "admin-funnel-section";

  section.className =
    "admin-funnel";

  section.innerHTML = `
    <div class="admin-funnel__heading">
      <div>
        <span class="admin-brand__eyebrow">
          Desempenho
        </span>

        <h2>
          Visitas e interações
        </h2>

        <p>
          Compara as visitas ao cartão com os cliques nos contactos.
        </p>
      </div>

      <div class="admin-funnel__actions">
        <button
          class="admin-button admin-button--secondary"
          id="export-funnel-csv"
          type="button"
          disabled
        >
          Exportar CSV
        </button>

        <button
          class="admin-button admin-button--secondary"
          id="refresh-funnel-report"
          type="button"
        >
          Atualizar
        </button>
      </div>
    </div>

    <div
      class="admin-funnel__periods"
      aria-label="Período do relatório"
    >
      ${AVAILABLE_PERIODS.map(
        (days) => `
          <button
            type="button"
            data-funnel-period="${days}"
            aria-pressed="${
              days === selectedPeriod
                ? "true"
                : "false"
            }"
          >
            ${days} dias
          </button>
        `
      ).join("")}
    </div>

    <div class="admin-funnel__overview">
      <article>
        <span>
          Visitas no período
        </span>

        <strong id="funnel-total-visits">
          —
        </strong>

        <small>
          acessos registados
        </small>
      </article>

      <article>
        <span>
          Interações no período
        </span>

        <strong id="funnel-total-interactions">
          —
        </strong>

        <small>
          cliques nos contactos
        </small>
      </article>

      <article>
        <span>
          Interações por 100 visitas
        </span>

        <strong id="funnel-interaction-index">
          —
        </strong>

        <small>
          índice geral do período
        </small>
      </article>

      <article>
        <span>
          Dia com mais interações
        </span>

        <strong
          class="admin-funnel__best-day"
          id="funnel-best-day"
        >
          —
        </strong>

        <small id="funnel-best-day-detail">
          sem dados
        </small>
      </article>
    </div>

    <div class="admin-funnel__chart">
      <div class="admin-funnel__chart-header">
        <div>
          <strong>
            Evolução diária
          </strong>

          <span>
            Visitas e interações registadas por dia.
          </span>
        </div>

        <span
          class="admin-funnel__status"
          id="funnel-report-status"
        >
          A carregar…
        </span>
      </div>

      <div class="admin-funnel__legend">
        <span>
          <i class="admin-funnel__legend-visits"></i>
          Visitas
        </span>

        <span>
          <i class="admin-funnel__legend-interactions"></i>
          Interações
        </span>
      </div>

      <div class="admin-funnel__canvas">
        <canvas
          id="admin-funnel-chart"
          role="img"
          aria-label="Gráfico de visitas e interações"
        ></canvas>
      </div>
    </div>
  `;

  anchor.insertAdjacentElement(
    "afterend",
    section
  );

  chartCanvas =
    section.querySelector(
      "#admin-funnel-chart"
    );

  section
    .querySelector(
      "#refresh-funnel-report"
    )
    ?.addEventListener(
      "click",
      loadFunnelReport
    );

  section
    .querySelector(
      "#export-funnel-csv"
    )
    ?.addEventListener(
      "click",
      exportReportToCSV
    );

  section
    .querySelectorAll(
      "[data-funnel-period]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const period =
            Number(
              button.dataset
                .funnelPeriod
            );

          if (
            !AVAILABLE_PERIODS.includes(
              period
            )
          ) {
            return;
          }

          selectedPeriod =
            period;

          updatePeriodButtons();

          loadFunnelReport();
        }
      );
    });
}

/* ==================================================
   PERÍODOS
================================================== */

function updatePeriodButtons() {
  document
    .querySelectorAll(
      "[data-funnel-period]"
    )
    .forEach((button) => {
      const buttonPeriod =
        Number(
          button.dataset
            .funnelPeriod
        );

      button.setAttribute(
        "aria-pressed",
        buttonPeriod ===
          selectedPeriod
          ? "true"
          : "false"
      );
    });
}

/* ==================================================
   DADOS
================================================== */

function normaliseRows(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(
    (row) => ({
      report_date:
        row.report_date,

      visits:
        Number(
          row.visits
        ) || 0,

      interactions:
        Number(
          row.interactions
        ) || 0,

      interactions_per_100_visits:
        Number(
          row.interactions_per_100_visits
        ) || 0
    })
  );
}

function renderSummary(rows) {
  const totalVisits =
    rows.reduce(
      (total, row) =>
        total + row.visits,
      0
    );

  const totalInteractions =
    rows.reduce(
      (total, row) =>
        total +
        row.interactions,
      0
    );

  const interactionIndex =
    totalVisits > 0
      ? (
          totalInteractions /
          totalVisits
        ) * 100
      : 0;

  const bestDay =
    [...rows].sort(
      (first, second) =>
        second.interactions -
        first.interactions
    )[0];

  setText(
    "#funnel-total-visits",
    formatNumber(
      totalVisits
    )
  );

  setText(
    "#funnel-total-interactions",
    formatNumber(
      totalInteractions
    )
  );

  setText(
    "#funnel-interaction-index",
    formatPercentage(
      interactionIndex
    )
  );

  if (
    bestDay &&
    bestDay.interactions > 0
  ) {
    const date =
      parseReportDate(
        bestDay.report_date
      );

    setText(
      "#funnel-best-day",
      date
        ? FULL_DATE_FORMATTER.format(
            date
          )
        : bestDay.report_date
    );

    setText(
      "#funnel-best-day-detail",
      `${formatNumber(
        bestDay.interactions
      )} interações`
    );
  } else {
    setText(
      "#funnel-best-day",
      "Sem dados"
    );

    setText(
      "#funnel-best-day-detail",
      "ainda sem interações"
    );
  }
}

/* ==================================================
   GRÁFICO
================================================== */

function getCSSVariable(
  variableName,
  fallback
) {
  const value =
    getComputedStyle(
      document.documentElement
    )
      .getPropertyValue(
        variableName
      )
      .trim();

  return value || fallback;
}

function roundedRectangle(
  context,
  x,
  y,
  width,
  height,
  radius
) {
  const safeRadius =
    Math.min(
      radius,
      width / 2,
      height / 2
    );

  context.beginPath();

  context.moveTo(
    x + safeRadius,
    y
  );

  context.lineTo(
    x + width - safeRadius,
    y
  );

  context.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + safeRadius
  );

  context.lineTo(
    x + width,
    y + height
  );

  context.lineTo(
    x,
    y + height
  );

  context.lineTo(
    x,
    y + safeRadius
  );

  context.quadraticCurveTo(
    x,
    y,
    x + safeRadius,
    y
  );

  context.closePath();
}

function drawFunnelChart() {
  if (!chartCanvas) {
    return;
  }

  const container =
    chartCanvas.parentElement;

  const width =
    Math.max(
      container.clientWidth,
      290
    );

  const height = 265;

  const pixelRatio =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  chartCanvas.width =
    Math.floor(
      width * pixelRatio
    );

  chartCanvas.height =
    Math.floor(
      height * pixelRatio
    );

  chartCanvas.style.width =
    `${width}px`;

  chartCanvas.style.height =
    `${height}px`;

  const context =
    chartCanvas.getContext("2d");

  if (!context) {
    return;
  }

  context.setTransform(
    pixelRatio,
    0,
    0,
    pixelRatio,
    0,
    0
  );

  context.clearRect(
    0,
    0,
    width,
    height
  );

  const primary =
    getCSSVariable(
      "--admin-primary",
      "#7657ff"
    );

  const secondary =
    getCSSVariable(
      "--admin-secondary",
      "#00cfee"
    );

  const padding = {
    top: 22,
    right: 12,
    bottom: 44,
    left: 38
  };

  const chartWidth =
    width -
    padding.left -
    padding.right;

  const chartHeight =
    height -
    padding.top -
    padding.bottom;

  const maximum =
    Math.max(
      1,
      ...currentRows.map(
        (row) =>
          Math.max(
            row.visits,
            row.interactions
          )
      )
    );

  context.font =
    "11px system-ui";

  for (
    let line = 0;
    line <= 4;
    line += 1
  ) {
    const ratio =
      line / 4;

    const y =
      padding.top +
      chartHeight * ratio;

    context.beginPath();

    context.strokeStyle =
      "rgba(255,255,255,0.08)";

    context.moveTo(
      padding.left,
      y
    );

    context.lineTo(
      width -
        padding.right,
      y
    );

    context.stroke();

    context.fillStyle =
      "rgba(255,255,255,0.42)";

    context.textAlign =
      "right";

    context.textBaseline =
      "middle";

    context.fillText(
      String(
        Math.round(
          maximum *
          (1 - ratio)
        )
      ),
      padding.left - 8,
      y
    );
  }

  const rowCount =
    Math.max(
      currentRows.length,
      1
    );

  const groupWidth =
    chartWidth /
    rowCount;

  const availableBarWidth =
    Math.min(
      groupWidth * 0.68,
      28
    );

  const barGap =
    Math.max(
      2,
      availableBarWidth * 0.12
    );

  const barWidth =
    Math.max(
      2,
      (
        availableBarWidth -
        barGap
      ) / 2
    );

  currentRows.forEach(
    (row, index) => {
      const groupX =
        padding.left +
        index * groupWidth +
        (
          groupWidth -
          availableBarWidth
        ) / 2;

      const visitHeight =
        row.visits > 0
          ? Math.max(
              3,
              (
                row.visits /
                maximum
              ) *
              chartHeight
            )
          : 2;

      const interactionHeight =
        row.interactions > 0
          ? Math.max(
              3,
              (
                row.interactions /
                maximum
              ) *
              chartHeight
            )
          : 2;

      const visitY =
        padding.top +
        chartHeight -
        visitHeight;

      const interactionY =
        padding.top +
        chartHeight -
        interactionHeight;

      context.fillStyle =
        row.visits > 0
          ? primary
          : "rgba(255,255,255,0.1)";

      roundedRectangle(
        context,
        groupX,
        visitY,
        barWidth,
        visitHeight,
        3
      );

      context.fill();

      context.fillStyle =
        row.interactions > 0
          ? secondary
          : "rgba(255,255,255,0.07)";

      roundedRectangle(
        context,
        groupX +
          barWidth +
          barGap,
        interactionY,
        barWidth,
        interactionHeight,
        3
      );

      context.fill();

      const labelInterval =
        selectedPeriod === 30
          ? 5
          : selectedPeriod === 14
            ? 2
            : 1;

      const showLabel =
        index % labelInterval === 0 ||
        index ===
          currentRows.length - 1;

      if (!showLabel) {
        return;
      }

      const date =
        parseReportDate(
          row.report_date
        );

      if (!date) {
        return;
      }

      context.fillStyle =
        "rgba(255,255,255,0.46)";

      context.textAlign =
        "center";

      context.textBaseline =
        "top";

      context.fillText(
        DATE_FORMATTER.format(
          date
        ),
        groupX +
          availableBarWidth / 2,
        height -
          padding.bottom +
          12
      );
    }
  );

  const totalVisits =
    currentRows.reduce(
      (total, row) =>
        total + row.visits,
      0
    );

  const totalInteractions =
    currentRows.reduce(
      (total, row) =>
        total +
        row.interactions,
      0
    );

  chartCanvas.setAttribute(
    "aria-label",
    `Relatório de ${selectedPeriod} dias com ${formatNumber(
      totalVisits
    )} visitas e ${formatNumber(
      totalInteractions
    )} interações.`
  );
}

/* ==================================================
   CARREGAR RELATÓRIO
================================================== */

async function loadFunnelReport() {
  const status =
    document.querySelector(
      "#funnel-report-status"
    );

  const exportButton =
    document.querySelector(
      "#export-funnel-csv"
    );

  if (status) {
    status.textContent =
      "A atualizar…";
  }

  if (exportButton) {
    exportButton.disabled =
      true;
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
    } =
      await supabaseClient.rpc(
        "get_profile_admin_funnel",
        {
          p_days_back:
            selectedPeriod
        }
      );

    if (error) {
      throw error;
    }

    currentRows =
      normaliseRows(data);

    renderSummary(
      currentRows
    );

    drawFunnelChart();

    if (status) {
      status.textContent =
        "Atualizado";
    }

    if (exportButton) {
      exportButton.disabled =
        currentRows.length === 0;
    }
  } catch (error) {
    console.error(
      "Não foi possível carregar o relatório:",
      error
    );

    currentRows = [];

    if (status) {
      status.textContent =
        "Indisponível";
    }
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

function exportReportToCSV() {
  if (
    currentRows.length === 0
  ) {
    return;
  }

  const header = [
    "Data",
    "Visitas",
    "Interações",
    "Interações por 100 visitas"
  ];

  const rows =
    currentRows.map(
      (row) => [
        row.report_date,
        row.visits,
        row.interactions,
        Number(
          row.interactions_per_100_visits
        ).toFixed(2)
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
    `identityhub-relatorio-${selectedPeriod}-dias-${currentDate}.csv`;

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
   INICIALIZAÇÃO
================================================== */

async function initialiseFunnel() {
  createFunnelSection();
  updatePeriodButtons();

  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(
        resizeTimer
      );

      resizeTimer =
        window.setTimeout(
          drawFunnelChart,
          120
        );
    }
  );

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
    await loadFunnelReport();
  }

  supabaseClient.auth
    .onAuthStateChange(
      (_event, session) => {
        window.setTimeout(
          () => {
            if (session) {
              loadFunnelReport();
            }
          },
          0
        );
      }
    );

  window.addEventListener(
    "identityhub:adminsaved",
    () => {
      loadFunnelReport();
    }
  );
}

initialiseFunnel();