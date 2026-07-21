import {
  supabaseClient
} from "./supabase-client.js";

const NUMBER_FORMATTER =
  new Intl.NumberFormat("pt-PT");

const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "pt-PT",
    {
      day: "2-digit",
      month: "short"
    }
  );

const DATE_TIME_FORMATTER =
  new Intl.DateTimeFormat(
    "pt-PT",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

let statisticsSection = null;
let previewSection = null;
let chartCanvas = null;
let previewFrame = null;
let adminToast = null;

let dailyStatistics = [];
let previewTimer = null;
let toastTimer = null;

function createStatisticsSection() {
  const summary =
    document.querySelector(
      ".admin-summary"
    );

  if (!summary) {
    return;
  }

  statisticsSection =
    document.createElement("section");

  statisticsSection.className =
    "admin-insights";

  statisticsSection.innerHTML = `
    <div class="admin-insights__heading">
      <div>
        <span class="admin-brand__eyebrow">
          Estatísticas
        </span>

        <h2>
          Desempenho do cartão
        </h2>

        <p>
          Visitas registadas nos diferentes períodos.
        </p>
      </div>

      <button
        class="admin-button admin-button--secondary"
        id="refresh-admin-stats"
        type="button"
      >
        Atualizar
      </button>
    </div>

    <div class="admin-stat-grid">
      <article class="admin-stat-card">
        <span>Hoje</span>

        <strong id="admin-visits-today">
          —
        </strong>

        <small>
          visitas registadas hoje
        </small>
      </article>

      <article class="admin-stat-card">
        <span>Últimos 7 dias</span>

        <strong id="admin-visits-seven-days">
          —
        </strong>

        <small>
          total da última semana
        </small>
      </article>

      <article class="admin-stat-card">
        <span>Últimos 30 dias</span>

        <strong id="admin-visits-thirty-days">
          —
        </strong>

        <small>
          total do último mês
        </small>
      </article>

      <article class="admin-stat-card">
        <span>Última alteração</span>

        <strong
          class="admin-stat-card__date"
          id="admin-profile-updated"
        >
          —
        </strong>

        <small>
          atualização do perfil
        </small>
      </article>
    </div>

    <div class="admin-chart">
      <div class="admin-chart__header">
        <div>
          <strong>
            Visitas dos últimos 14 dias
          </strong>

          <span>
            O gráfico é atualizado com os dados do Supabase.
          </span>
        </div>

        <span
          class="admin-chart__status"
          id="admin-chart-status"
        >
          A carregar…
        </span>
      </div>

      <div class="admin-chart__canvas">
        <canvas
          id="admin-visits-chart"
          role="img"
          aria-label="Gráfico de visitas dos últimos 14 dias"
        ></canvas>
      </div>
    </div>
  `;

  summary.insertAdjacentElement(
    "afterend",
    statisticsSection
  );

  chartCanvas =
    statisticsSection.querySelector(
      "#admin-visits-chart"
    );

  statisticsSection
    .querySelector(
      "#refresh-admin-stats"
    )
    ?.addEventListener(
      "click",
      loadStatistics
    );
}

function createPreviewSection() {
  const editor =
    document.querySelector(
      "#profile-editor-form"
    );

  if (!editor) {
    return;
  }

  previewSection =
    document.createElement("section");

  previewSection.className =
    "admin-live-preview";

  previewSection.innerHTML = `
    <div class="admin-live-preview__heading">
      <div>
        <span class="admin-brand__eyebrow">
          Pré-visualização
        </span>

        <h2>
          Resultado em tempo real
        </h2>

        <p>
          As alterações aparecem aqui antes de serem guardadas.
        </p>
      </div>

      <div class="admin-preview-device">
        <span aria-hidden="true"></span>

        <strong>
          Vista móvel
        </strong>
      </div>
    </div>

    <div class="admin-preview-window">
      <div class="admin-preview-window__bar">
        <span></span>
        <span></span>
        <span></span>

        <small>
          IdentityHub Pro
        </small>
      </div>

      <iframe
        id="admin-preview-frame"
        src="./index.html?preview=1"
        title="Pré-visualização do cartão digital"
        loading="eager"
      ></iframe>
    </div>
  `;

  editor.insertAdjacentElement(
    "beforebegin",
    previewSection
  );

  previewFrame =
    previewSection.querySelector(
      "#admin-preview-frame"
    );

  previewFrame.addEventListener(
    "load",
    schedulePreviewUpdate
  );

  editor.addEventListener(
    "input",
    schedulePreviewUpdate
  );

  editor.addEventListener(
    "change",
    schedulePreviewUpdate
  );

  const photoPreview =
    document.querySelector(
      "#admin-photo-preview"
    );

  if (photoPreview) {
    const observer =
      new MutationObserver(
        schedulePreviewUpdate
      );

    observer.observe(
      photoPreview,
      {
        attributes: true,
        attributeFilter: ["src"]
      }
    );
  }
}

function createAdminToast() {
  adminToast =
    document.createElement("div");

  adminToast.className =
    "admin-success-toast";

  adminToast.hidden = true;

  adminToast.setAttribute(
    "role",
    "status"
  );

  adminToast.setAttribute(
    "aria-live",
    "polite"
  );

  document.body.appendChild(
    adminToast
  );
}

function showAdminToast(
  message,
  type = "success"
) {
  if (!adminToast) {
    return;
  }

  window.clearTimeout(
    toastTimer
  );

  adminToast.textContent =
    message;

  adminToast.dataset.type =
    type;

  adminToast.hidden = false;

  requestAnimationFrame(() => {
    adminToast.classList.add(
      "admin-success-toast--visible"
    );
  });

  toastTimer =
    window.setTimeout(() => {
      adminToast.classList.remove(
        "admin-success-toast--visible"
      );

      window.setTimeout(() => {
        adminToast.hidden = true;
      }, 250);
    }, 3200);
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

function formatNumber(value) {
  return NUMBER_FORMATTER.format(
    Number(value) || 0
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Sem registo";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Sem registo";
  }

  return DATE_TIME_FORMATTER.format(
    date
  );
}

function normaliseSummary(data) {
  if (
    Array.isArray(data)
  ) {
    return data[0] || {};
  }

  return data || {};
}

async function loadStatistics() {
  const status =
    document.querySelector(
      "#admin-chart-status"
    );

  if (status) {
    status.textContent =
      "A atualizar…";
  }

  try {
    const {
      data: sessionData
    } =
      await supabaseClient.auth
        .getSession();

    if (!sessionData.session) {
      return;
    }

    const [
      summaryResult,
      dailyResult
    ] = await Promise.all([
      supabaseClient.rpc(
        "get_profile_admin_summary"
      ),

      supabaseClient.rpc(
        "get_profile_admin_daily_stats",
        {
          p_days_back: 14
        }
      )
    ]);

    if (summaryResult.error) {
      throw summaryResult.error;
    }

    if (dailyResult.error) {
      throw dailyResult.error;
    }

    const summary =
      normaliseSummary(
        summaryResult.data
      );

    dailyStatistics =
      Array.isArray(
        dailyResult.data
      )
        ? dailyResult.data
        : [];

    setText(
      "#admin-total-visits",
      formatNumber(
        summary.total_views
      )
    );

    setText(
      "#admin-visits-today",
      formatNumber(
        summary.today_views
      )
    );

    setText(
      "#admin-visits-seven-days",
      formatNumber(
        summary.last_7_days
      )
    );

    setText(
      "#admin-visits-thirty-days",
      formatNumber(
        summary.last_30_days
      )
    );

    setText(
      "#admin-profile-updated",
      formatDateTime(
        summary.profile_updated_at
      )
    );

    drawStatisticsChart();

    if (status) {
      status.textContent =
        "Atualizado";
    }
  } catch (error) {
    console.error(
      "Não foi possível carregar as estatísticas:",
      error
    );

    if (status) {
      status.textContent =
        "Indisponível";
    }

    showAdminToast(
      "Não foi possível atualizar as estatísticas.",
      "error"
    );
  }
}

function getChartColour(
  variable,
  fallback
) {
  const value =
    getComputedStyle(
      document.documentElement
    )
      .getPropertyValue(variable)
      .trim();

  return value || fallback;
}

function drawStatisticsChart() {
  if (!chartCanvas) {
    return;
  }

  const container =
    chartCanvas.parentElement;

  const width =
    Math.max(
      container.clientWidth,
      280
    );

  const height = 230;

  const pixelRatio =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  chartCanvas.width =
    width * pixelRatio;

  chartCanvas.height =
    height * pixelRatio;

  chartCanvas.style.width =
    `${width}px`;

  chartCanvas.style.height =
    `${height}px`;

  const context =
    chartCanvas.getContext("2d");

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
    getChartColour(
      "--admin-primary",
      "#7657ff"
    );

  const secondary =
    getChartColour(
      "--admin-secondary",
      "#00cfee"
    );

  const padding = {
    top: 20,
    right: 12,
    bottom: 38,
    left: 34
  };

  const chartWidth =
    width -
    padding.left -
    padding.right;

  const chartHeight =
    height -
    padding.top -
    padding.bottom;

  const values =
    dailyStatistics.map(
      (item) =>
        Number(item.views) || 0
    );

  const maximum =
    Math.max(
      1,
      ...values
    );

  context.font =
    "11px system-ui";

  context.textAlign =
    "right";

  context.textBaseline =
    "middle";

  for (
    let gridIndex = 0;
    gridIndex <= 4;
    gridIndex += 1
  ) {
    const ratio =
      gridIndex / 4;

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
      width - padding.right,
      y
    );

    context.stroke();

    const labelValue =
      Math.round(
        maximum * (1 - ratio)
      );

    context.fillStyle =
      "rgba(255,255,255,0.42)";

    context.fillText(
      String(labelValue),
      padding.left - 8,
      y
    );
  }

  const itemCount =
    Math.max(
      dailyStatistics.length,
      1
    );

  const itemWidth =
    chartWidth / itemCount;

  const barWidth =
    Math.max(
      Math.min(
        itemWidth * 0.58,
        26
      ),
      5
    );

  const gradient =
    context.createLinearGradient(
      0,
      padding.top,
      0,
      padding.top + chartHeight
    );

  gradient.addColorStop(
    0,
    secondary
  );

  gradient.addColorStop(
    1,
    primary
  );

  dailyStatistics.forEach(
    (item, index) => {
      const value =
        Number(item.views) || 0;

      const barHeight =
        value === 0
          ? 2
          : Math.max(
              4,
              (value / maximum) *
                chartHeight
            );

      const x =
        padding.left +
        index * itemWidth +
        (itemWidth - barWidth) / 2;

      const y =
        padding.top +
        chartHeight -
        barHeight;

      context.fillStyle =
        value === 0
          ? "rgba(255,255,255,0.12)"
          : gradient;

      context.fillRect(
        x,
        y,
        barWidth,
        barHeight
      );

      const shouldShowDate =
        index % 2 === 0 ||
        index ===
          dailyStatistics.length - 1;

      if (!shouldShowDate) {
        return;
      }

      const date =
        new Date(
          `${item.visit_date}T00:00:00`
        );

      context.fillStyle =
        "rgba(255,255,255,0.48)";

      context.textAlign =
        "center";

      context.textBaseline =
        "top";

      context.fillText(
        DATE_FORMATTER.format(date),
        x + barWidth / 2,
        height -
          padding.bottom +
          11
      );
    }
  );

  const total =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  chartCanvas.setAttribute(
    "aria-label",
    `Gráfico dos últimos 14 dias, com ${formatNumber(total)} visitas no total.`
  );
}

function readInputValue(
  selector,
  fallback = ""
) {
  const element =
    document.querySelector(
      selector
    );

  if (!element) {
    return fallback;
  }

  if (
    element.type === "checkbox"
  ) {
    return element.checked;
  }

  return element.value;
}

function createPreviewProfile() {
  const photo =
    document.querySelector(
      "#admin-photo-preview"
    );

  return {
    name:
      readInputValue(
        "#profile-name-input",
        "Hugo Rodrigues"
      ),

    tagline_pt:
      readInputValue(
        "#tagline-pt-input",
        "One Tap. Infinite Connections."
      ),

    tagline_en:
      readInputValue(
        "#tagline-en-input",
        "One Tap. Infinite Connections."
      ),

    job_pt:
      readInputValue(
        "#job-pt-input",
        "Gerente de Loja"
      ),

    job_en:
      readInputValue(
        "#job-en-input",
        "Store Manager"
      ),

    location_pt:
      readInputValue(
        "#location-pt-input",
        "Portugal"
      ),

    location_en:
      readInputValue(
        "#location-en-input",
        "Portugal"
      ),

    phone:
      readInputValue(
        "#phone-input"
      ),

    whatsapp:
      readInputValue(
        "#whatsapp-input"
      ),

    email:
      readInputValue(
        "#profile-email-input"
      ),

    instagram:
      readInputValue(
        "#instagram-input"
      ),

    steam:
      readInputValue(
        "#steam-input"
      ),

    photo_url:
      photo?.src ||
      "./assets/images/profile.jpg",

    theme_name:
      readInputValue(
        "#theme-name-input",
        "nebula-carbon"
      ),

    primary_color:
      readInputValue(
        "#primary-color-input",
        "#7657ff"
      ),

    secondary_color:
      readInputValue(
        "#secondary-color-input",
        "#00cfee"
      ),

    background_color:
      readInputValue(
        "#background-color-input",
        "#05070a"
      ),

    glow_intensity:
      Number(
        readInputValue(
          "#glow-intensity-input",
          0.75
        )
      ),

    motion_enabled:
      readInputValue(
        "#motion-enabled-input",
        true
      )
  };
}

function sendPreviewUpdate() {
  if (
    !previewFrame?.contentWindow
  ) {
    return;
  }

  previewFrame.contentWindow.postMessage(
    {
      type:
        "identityhub:admin-preview",

      profile:
        createPreviewProfile()
    },
    window.location.origin
  );
}

function schedulePreviewUpdate() {
  window.clearTimeout(
    previewTimer
  );

  previewTimer =
    window.setTimeout(
      sendPreviewUpdate,
      80
    );
}

function setupAuthenticationUpdates() {
  supabaseClient.auth.onAuthStateChange(
    (_event, session) => {
      window.setTimeout(() => {
        if (session) {
          loadStatistics();
          schedulePreviewUpdate();
        }
      }, 0);
    }
  );
}

async function initialiseExperience() {
  createStatisticsSection();
  createPreviewSection();
  createAdminToast();

  setupAuthenticationUpdates();

  window.addEventListener(
    "resize",
    () => {
      window.requestAnimationFrame(
        drawStatisticsChart
      );
    }
  );

  window.addEventListener(
    "identityhub:adminsaved",
    (event) => {
      const message =
        event.detail?.message ||
        "Alterações guardadas com sucesso.";

      showAdminToast(
        message
      );

      loadStatistics();
      schedulePreviewUpdate();
    }
  );

  const {
    data
  } =
    await supabaseClient.auth
      .getSession();

  if (data.session) {
    await loadStatistics();
  }
}

initialiseExperience();