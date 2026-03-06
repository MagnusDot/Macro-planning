import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { toPng } from "html-to-image";

const STORAGE_KEY = "macro-planning-vue-state";

const defaultPhases = [
  { id: 1, name: "Cadrage et lancement", start: 1, duration: 2, color: "#d6642a" },
  { id: 2, name: "Diagnostic et collecte", start: 2, duration: 3, color: "#1e6b7a" },
  { id: 3, name: "Scenario cible", start: 4, duration: 3, color: "#5d7f31" },
  { id: 4, name: "Feuille de route", start: 7, duration: 2, color: "#7f4da0" },
  { id: 5, name: "Pilotage et passation", start: 9, duration: 4, color: "#ad4454" },
];

const defaultState = {
  projectName: "Refonte du programme de transformation",
  clientName: "Groupement territorial",
  startMonth: "2026-04",
  timelineLength: 12,
  density: "balanced",
  screenshotMode: false,
  phases: defaultPhases,
};

function cloneDefaults() {
  return structuredClone(defaultState);
}

function uid() {
  return Math.floor(Date.now() + Math.random() * 100000);
}

function sanitizePhase(phase, fallbackId) {
  return {
    id: Number(phase?.id) || fallbackId,
    name: typeof phase?.name === "string" && phase.name.trim() ? phase.name : "Nouvelle phase",
    start: Math.max(1, Number(phase?.start) || 1),
    duration: Math.max(1, Number(phase?.duration) || 1),
    color: typeof phase?.color === "string" ? phase.color : "#c97b63",
  };
}

function sanitizeState(raw) {
  const base = cloneDefaults();
  const phases = Array.isArray(raw?.phases) && raw.phases.length
    ? raw.phases.map((phase, index) => sanitizePhase(phase, index + 1))
    : structuredClone(defaultPhases);

  return {
    projectName: typeof raw?.projectName === "string" ? raw.projectName : base.projectName,
    clientName: typeof raw?.clientName === "string" ? raw.clientName : base.clientName,
    startMonth: typeof raw?.startMonth === "string" ? raw.startMonth : base.startMonth,
    timelineLength: Math.min(24, Math.max(3, Number(raw?.timelineLength) || base.timelineLength)),
    density: ["compact", "balanced", "comfortable"].includes(raw?.density) ? raw.density : base.density,
    screenshotMode: Boolean(raw?.screenshotMode),
    phases,
  };
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function usePlanningState() {
  const initial = sanitizeState(loadSavedState());

  const projectName = ref(initial.projectName);
  const clientName = ref(initial.clientName);
  const startMonth = ref(initial.startMonth);
  const timelineLength = ref(initial.timelineLength);
  const density = ref(initial.density);
  const screenshotMode = ref(initial.screenshotMode);
  const phases = ref(initial.phases);

  const densityOptions = [
    { label: "Compact", value: "compact" },
    { label: "Equilibre", value: "balanced" },
    { label: "Detail", value: "comfortable" },
  ];

  const safeTimelineLength = computed(() => Math.min(24, Math.max(3, Number(timelineLength.value) || 12)));

  const monthLabels = computed(() => {
    const [year, month] = (startMonth.value || defaultState.startMonth).split("-").map(Number);
    const cursor = new Date(year, (month || 1) - 1, 1);

    return Array.from({ length: safeTimelineLength.value }, (_, index) => {
      const label = cursor.toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      }).replace(".", "");
      const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
      cursor.setMonth(cursor.getMonth() + 1);
      return { index: index + 1, label, key };
    });
  });

  const normalizedPhases = computed(() =>
    phases.value.map((phase, index) => {
      const sanitized = sanitizePhase(phase, index + 1);
      sanitized.start = Math.min(sanitized.start, safeTimelineLength.value);
      sanitized.duration = Math.min(sanitized.duration, safeTimelineLength.value - sanitized.start + 1);
      return sanitized;
    }),
  );

  const boardStyle = computed(() => {
    const densityConfig = {
      compact: { monthWidth: "minmax(76px, 1fr)", rowHeight: "76px", pillHeight: "52px" },
      balanced: { monthWidth: "minmax(92px, 1fr)", rowHeight: "92px", pillHeight: "64px" },
      comfortable: { monthWidth: "minmax(112px, 1fr)", rowHeight: "108px", pillHeight: "72px" },
    }[density.value];

    return {
      "--months": safeTimelineLength.value,
      "--month-width": densityConfig.monthWidth,
      "--row-height": densityConfig.rowHeight,
      "--pill-height": densityConfig.pillHeight,
      "--panel-opacity": "0.9",
    };
  });

  const timelineStartLabel = computed(() => monthLabels.value[0]?.label || "");

  const keyDeliverable = computed(() => {
    const lastPhase = normalizedPhases.value[normalizedPhases.value.length - 1];
    return lastPhase ? lastPhase.name : "Feuille de route priorisee";
  });

  const insights = computed(() => {
    const endMonth = Math.max(...normalizedPhases.value.map((phase) => phase.start + phase.duration - 1), 1);
    const overlapping = monthLabels.value.map((month) =>
      normalizedPhases.value.filter(
        (phase) => month.index >= phase.start && month.index < phase.start + phase.duration,
      ).length,
    );
    const peakLoad = Math.max(...overlapping, 1);

    return [
      { label: "Charge max", value: `${peakLoad} phases en parallele` },
      { label: "Atterrissage", value: `M${Math.min(endMonth, safeTimelineLength.value)}` },
      { label: "Lecture", value: density.value === "compact" ? "Sans scroll inutile" : "Vue detaillee" },
    ];
  });

  function saveState() {
    const payload = {
      projectName: projectName.value,
      clientName: clientName.value,
      startMonth: startMonth.value,
      timelineLength: safeTimelineLength.value,
      density: density.value,
      screenshotMode: screenshotMode.value,
      phases: phases.value.map((phase, index) => sanitizePhase(phase, phase.id || index + 1)),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function resetExample() {
    const defaults = cloneDefaults();
    projectName.value = defaults.projectName;
    clientName.value = defaults.clientName;
    startMonth.value = defaults.startMonth;
    timelineLength.value = defaults.timelineLength;
    density.value = defaults.density;
    screenshotMode.value = defaults.screenshotMode;
    phases.value = defaults.phases;
  }

  function addPhase() {
    phases.value.push({
      id: uid(),
      name: "Nouvelle phase",
      start: 1,
      duration: 2,
      color: "#c97b63",
    });
  }

  function removePhase(index) {
    phases.value.splice(index, 1);
  }

  function movePhase(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= phases.value.length) {
      return;
    }
    const phase = phases.value.splice(index, 1)[0];
    phases.value.splice(nextIndex, 0, phase);
  }

  async function saveAsPng() {
    screenshotMode.value = true;
    await nextTick();
    await nextTick();

    try {
      const board = document.querySelector("#planning-capture");
      if (!board) return;

      const dataUrl = await toPng(board, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        skipFonts: true,
        width: board.scrollWidth,
        height: board.scrollHeight,
        style: { overflow: "visible", fontFamily: "Inter, system-ui, sans-serif" },
      });

      const link = document.createElement("a");
      link.download = `${projectName.value || "macro-planning"}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      screenshotMode.value = false;
    }
  }

  function phasePillStyle(phase) {
    return {
      "--span": phase.duration,
      background: `linear-gradient(135deg, ${phase.color}, ${phase.color}dd)`,
    };
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && screenshotMode.value) {
      screenshotMode.value = false;
    }
  }

  watch(
    [projectName, clientName, startMonth, timelineLength, density, screenshotMode],
    () => {
      timelineLength.value = safeTimelineLength.value;
      document.body.classList.toggle("screenshot-mode", Boolean(screenshotMode.value));
      saveState();
    },
    { immediate: true },
  );

  watch(
    phases,
    () => {
      saveState();
    },
    { deep: true },
  );

  onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
  });

  return {
    projectName,
    clientName,
    startMonth,
    timelineLength,
    density,
    densityOptions,
    screenshotMode,
    phases,
    safeTimelineLength,
    monthLabels,
    normalizedPhases,
    boardStyle,
    timelineStartLabel,
    keyDeliverable,
    insights,
    addPhase,
    removePhase,
    movePhase,
    resetExample,
    saveAsPng,
    phasePillStyle,
  };
}
