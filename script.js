const defaultPhases = [
  { name: "Cadrage et lancement", start: 1, duration: 2, owner: "Direction de projet", color: "#d6642a" },
  { name: "Diagnostic et collecte", start: 2, duration: 3, owner: "Equipe conseil", color: "#1e6b7a" },
  { name: "Scenario cible", start: 4, duration: 3, owner: "Experts metier", color: "#5d7f31" },
  { name: "Feuille de route", start: 7, duration: 2, owner: "PMO", color: "#7f4da0" },
  { name: "Pilotage et passation", start: 9, duration: 4, owner: "Gouvernance", color: "#ad4454" },
];

const STORAGE_KEY = "macro-planning-state";

const state = {
  phases: structuredClone(defaultPhases),
  screenshotMode: false,
};

const projectNameInput = document.querySelector("#projectName");
const clientNameInput = document.querySelector("#clientName");
const startMonthInput = document.querySelector("#startMonth");
const timelineLengthInput = document.querySelector("#timelineLength");
const phaseList = document.querySelector("#phaseList");
const timelineGrid = document.querySelector("#timelineGrid");
const phaseTemplate = document.querySelector("#phaseItemTemplate");
const boardProjectName = document.querySelector("#boardProjectName");
const boardClientName = document.querySelector("#boardClientName");
const boardDuration = document.querySelector("#boardDuration");
const phaseCount = document.querySelector("#phaseCount");
const addPhaseButton = document.querySelector("#addPhaseButton");
const resetButton = document.querySelector("#resetButton");
const screenshotToggle = document.querySelector("#screenshotToggle");
const printButton = document.querySelector("#printButton");
const phaseLegend = document.querySelector("#phaseLegend");
let draggedPhaseIndex = null;

function sanitizePhase(phase, fallbackColor = "#c97b63") {
  return {
    name: typeof phase?.name === "string" ? phase.name : "Nouvelle phase",
    start: Number(phase?.start) || 1,
    duration: Number(phase?.duration) || 1,
    owner: typeof phase?.owner === "string" ? phase.owner : "A definir",
    color: typeof phase?.color === "string" ? phase.color : fallbackColor,
  };
}

function saveState() {
  const payload = {
    projectName: projectNameInput.value,
    clientName: clientNameInput.value,
    startMonth: startMonthInput.value,
    timelineLength: timelineLengthInput.value,
    screenshotMode: state.screenshotMode,
    phases: state.phases.map((phase) => sanitizePhase(phase, phase.color)),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function applyScreenshotMode(enabled) {
  state.screenshotMode = Boolean(enabled);
  document.body.classList.toggle("screenshot-mode", state.screenshotMode);
  screenshotToggle.textContent = state.screenshotMode
    ? "Quitter le mode screenshot"
    : "Mode screenshot";
}

function loadState() {
  const rawState = localStorage.getItem(STORAGE_KEY);
  if (!rawState) {
    return false;
  }

  try {
    const parsed = JSON.parse(rawState);
    projectNameInput.value = typeof parsed.projectName === "string"
      ? parsed.projectName
      : "Refonte du programme de transformation";
    clientNameInput.value = typeof parsed.clientName === "string"
      ? parsed.clientName
      : "Groupement territorial";
    startMonthInput.value = typeof parsed.startMonth === "string" ? parsed.startMonth : "2026-04";
    timelineLengthInput.value = String(Number(parsed.timelineLength) || 12);
    state.phases = Array.isArray(parsed.phases) && parsed.phases.length > 0
      ? parsed.phases.map((phase) => sanitizePhase(phase, "#c97b63"))
      : structuredClone(defaultPhases);
    applyScreenshotMode(parsed.screenshotMode);
    return true;
  } catch {
    return false;
  }
}

function updateTimelineMetrics() {
  const totalMonths = Math.max(3, Number(timelineLengthInput.value) || 12);
  const gridWidth = timelineGrid.clientWidth || timelineGrid.parentElement.clientWidth || 0;
  const phaseLabelWidth = 250;
  const minimumMonthWidth = 92;
  const availableWidth = Math.max(0, gridWidth - phaseLabelWidth);
  const computedMonthWidth = availableWidth > 0
    ? Math.max(minimumMonthWidth, Math.floor(availableWidth / totalMonths))
    : minimumMonthWidth;

  timelineGrid.style.setProperty("--months", totalMonths);
  timelineGrid.style.setProperty("--phase-label-width", `${phaseLabelWidth}px`);
  timelineGrid.style.setProperty("--month-width", `${computedMonthWidth}px`);
}

function monthLabels(startValue, totalMonths) {
  const [year, month] = startValue.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return Array.from({ length: totalMonths }, () => {
    const label = date.toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
    });
    date.setMonth(date.getMonth() + 1);
    return label.replace(".", "");
  });
}

function clampPhase(phase, totalMonths) {
  phase.start = Math.max(1, Math.min(Number(phase.start) || 1, totalMonths));
  phase.duration = Math.max(1, Number(phase.duration) || 1);
  if (phase.start + phase.duration - 1 > totalMonths) {
    phase.duration = totalMonths - phase.start + 1;
  }
}

function renderPhaseEditor() {
  phaseList.innerHTML = "";

  state.phases.forEach((phase, index) => {
    const fragment = phaseTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".phase-item");
    const dragHandle = fragment.querySelector(".drag-handle");
    const nameInput = fragment.querySelector(".phase-name");
    const startInput = fragment.querySelector(".phase-start");
    const durationInput = fragment.querySelector(".phase-duration");
    const ownerInput = fragment.querySelector(".phase-owner");
    const colorInput = fragment.querySelector(".phase-color");
    const deleteButton = fragment.querySelector(".delete-button");

    item.dataset.index = String(index);
    item.draggable = true;
    nameInput.value = phase.name;
    startInput.value = phase.start;
    durationInput.value = phase.duration;
    ownerInput.value = phase.owner;
    colorInput.value = phase.color;

    dragHandle.addEventListener("mousedown", () => {
      item.draggable = true;
    });

    item.addEventListener("dragstart", (event) => {
      draggedPhaseIndex = index;
      item.classList.add("dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      }
    });

    item.addEventListener("dragend", () => {
      draggedPhaseIndex = null;
      item.classList.remove("dragging");
      phaseList.querySelectorAll(".phase-item").forEach((phaseItem) => {
        phaseItem.classList.remove("drop-target");
      });
    });

    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (draggedPhaseIndex === null || draggedPhaseIndex === index) {
        return;
      }
      item.classList.add("drop-target");
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("drop-target");
    });

    item.addEventListener("drop", (event) => {
      event.preventDefault();
      item.classList.remove("drop-target");

      if (draggedPhaseIndex === null || draggedPhaseIndex === index) {
        return;
      }

      const [movedPhase] = state.phases.splice(draggedPhaseIndex, 1);
      state.phases.splice(index, 0, movedPhase);
      draggedPhaseIndex = null;
      renderPhaseEditor();
      renderBoard();
      saveState();
    });

    nameInput.addEventListener("input", (event) => {
      state.phases[index].name = event.target.value;
      renderBoard();
      saveState();
    });

    startInput.addEventListener("input", (event) => {
      state.phases[index].start = Number(event.target.value);
      clampPhase(state.phases[index], Number(timelineLengthInput.value));
      renderPhaseEditor();
      renderBoard();
      saveState();
    });

    durationInput.addEventListener("input", (event) => {
      state.phases[index].duration = Number(event.target.value);
      clampPhase(state.phases[index], Number(timelineLengthInput.value));
      renderPhaseEditor();
      renderBoard();
      saveState();
    });

    ownerInput.addEventListener("input", (event) => {
      state.phases[index].owner = event.target.value;
      renderBoard();
      saveState();
    });

    colorInput.addEventListener("input", (event) => {
      state.phases[index].color = event.target.value;
      renderBoard();
      saveState();
    });

    deleteButton.addEventListener("click", () => {
      state.phases.splice(index, 1);
      renderPhaseEditor();
      renderBoard();
      saveState();
    });

    phaseList.appendChild(item);
  });
}

function createHeaderRow(months) {
  const row = document.createElement("div");
  row.className = "timeline-header";
  row.innerHTML = `
    <div class="label-cell"></div>
    ${months.map((month) => `<div class="month-cell"><span class="month-label">${month}</span></div>`).join("")}
  `;
  return row;
}

function createPhaseRow(phase, totalMonths) {
  const row = document.createElement("div");
  row.className = "timeline-row";
  row.style.setProperty("--start", phase.start);
  row.style.setProperty("--duration", phase.duration);

  const cells = Array.from({ length: totalMonths }, () => '<div class="slot-cell"></div>').join("");

  row.innerHTML = `
    <div class="phase-meta">
      <strong class="phase-name-display">${phase.name || "Phase sans nom"}</strong>
      <span class="phase-caption">${phase.owner || "Responsable a definir"}</span>
    </div>
    ${cells}
    <div class="phase-bar" style="background:${phase.color}">
      <span class="phase-bar-label">${phase.name || "Phase"}</span>
      <small>${phase.duration} mois</small>
    </div>
  `;

  const phaseBar = row.querySelector(".phase-bar");
  if (phase.duration <= 1) {
    phaseBar.classList.add("is-compact");
  }

  return row;
}

function renderLegend() {
  const items = [];
  const rows = timelineGrid.querySelectorAll(".timeline-row");

  rows.forEach((row, index) => {
    const label = row.querySelector(".phase-bar-label");
    if (!label) {
      return;
    }

    const isTruncated = label.scrollHeight > label.clientHeight + 1 || label.scrollWidth > label.clientWidth + 1;
    if (!isTruncated) {
      return;
    }

    const phase = state.phases[index];
    items.push(`
      <article class="legend-item">
        <span class="legend-swatch" style="background:${phase.color}"></span>
        <div class="legend-text">${phase.name}</div>
      </article>
    `);
  });

  phaseLegend.innerHTML = items.join("");
  phaseLegend.classList.toggle("is-hidden", items.length === 0);
}

function renderBoard() {
  const totalMonths = Math.max(3, Number(timelineLengthInput.value) || 12);
  const months = monthLabels(startMonthInput.value, totalMonths);

  boardProjectName.textContent = projectNameInput.value || "Projet sans nom";
  boardClientName.textContent = clientNameInput.value || "Client";
  boardDuration.textContent = `${totalMonths} mois`;
  phaseCount.textContent = String(state.phases.length);

  timelineGrid.innerHTML = "";
  updateTimelineMetrics();
  timelineGrid.appendChild(createHeaderRow(months));

  state.phases.forEach((phase) => {
    clampPhase(phase, totalMonths);
    timelineGrid.appendChild(createPhaseRow(phase, totalMonths));
  });

  renderLegend();
}

function resetExample() {
  projectNameInput.value = "Refonte du programme de transformation";
  clientNameInput.value = "Groupement territorial";
  startMonthInput.value = "2026-04";
  timelineLengthInput.value = "12";
  state.phases = structuredClone(defaultPhases);
  applyScreenshotMode(false);
  renderPhaseEditor();
  renderBoard();
  saveState();
}

addPhaseButton.addEventListener("click", () => {
  state.phases.push({
    name: "Nouvelle phase",
    start: 1,
    duration: 2,
    owner: "A definir",
    color: "#c97b63",
  });
  renderPhaseEditor();
  renderBoard();
  saveState();
});

resetButton.addEventListener("click", resetExample);

screenshotToggle.addEventListener("click", () => {
  applyScreenshotMode(!state.screenshotMode);
  updateTimelineMetrics();
  saveState();
});

printButton.addEventListener("click", () => {
  applyScreenshotMode(true);
  updateTimelineMetrics();
  saveState();
  window.print();
});

[projectNameInput, clientNameInput, startMonthInput, timelineLengthInput].forEach((input) => {
  input.addEventListener("input", () => {
    renderBoard();
    if (input === timelineLengthInput) {
      renderPhaseEditor();
    }
    saveState();
  });
});

window.addEventListener("resize", updateTimelineMetrics);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.screenshotMode) {
    applyScreenshotMode(false);
    updateTimelineMetrics();
    saveState();
  }
});

if (!loadState()) {
  resetExample();
} else {
  renderPhaseEditor();
  renderBoard();
}
