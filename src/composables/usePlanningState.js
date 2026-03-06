import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { toPng } from "html-to-image";

const STORAGE_KEY        = "macro-planning-v2";
const STORAGE_KEY_LEGACY = "macro-planning-vue-state";

const defaultPhases = [
  { id: 1, name: "Cadrage et lancement",   start: 1, duration: 2, color: "#d6642a" },
  { id: 2, name: "Diagnostic et collecte", start: 2, duration: 3, color: "#1e6b7a" },
  { id: 3, name: "Scenario cible",         start: 4, duration: 3, color: "#5d7f31" },
  { id: 4, name: "Feuille de route",       start: 7, duration: 2, color: "#7f4da0" },
  { id: 5, name: "Pilotage et passation",  start: 9, duration: 4, color: "#ad4454" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function sanitizeProjectData(raw) {
  const phases = Array.isArray(raw?.phases) && raw.phases.length
    ? raw.phases.map((p, i) => sanitizePhase(p, i + 1))
    : structuredClone(defaultPhases);

  return {
    projectName:    typeof raw?.projectName === "string" ? raw.projectName : "Nouveau projet",
    clientName:     typeof raw?.clientName === "string"  ? raw.clientName  : "",
    startMonth:     typeof raw?.startMonth === "string"  ? raw.startMonth  : new Date().toISOString().slice(0, 7),
    timelineLength: Math.min(52, Math.max(3, Number(raw?.timelineLength) || 12)),
    density:  ["compact", "balanced", "comfortable"].includes(raw?.density)   ? raw.density   : "balanced",
    timeUnit: ["month", "sprint"].includes(raw?.timeUnit)                     ? raw.timeUnit  : "month",
    phases,
  };
}

function makeProject(overrides = {}) {
  const today = new Date().toISOString();
  return {
    id:          uid(),
    name:        "Nouveau projet",
    updatedAt:   today,
    projectName: "Nouveau projet",
    clientName:  "",
    startMonth:  today.slice(0, 7),
    timelineLength: 12,
    density:  "balanced",
    timeUnit: "month",
    phases:   structuredClone(defaultPhases),
    ...overrides,
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.projects) && parsed.projects.length) return parsed;
    }
    // Migrate from legacy single-project format
    const legacy = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacy) {
      const old = JSON.parse(legacy);
      const project = makeProject({
        name:        old.projectName || "Projet existant",
        projectName: old.projectName || "Projet existant",
        clientName:  old.clientName  || "",
        startMonth:  old.startMonth  || new Date().toISOString().slice(0, 7),
        timelineLength: old.timelineLength,
        density:  old.density,
        timeUnit: old.timeUnit,
        phases:   old.phases,
      });
      const storage = { activeId: project.id, projects: [project] };
      writeStorage(storage);
      localStorage.removeItem(STORAGE_KEY_LEGACY);
      return storage;
    }
  } catch { /* ignore */ }
  return null;
}

function writeStorage(storage) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function usePlanningState() {
  // ── Bootstrap ──────────────────────────────────────────────────────────────
  let stored = readStorage();
  if (!stored) {
    const first = makeProject({
      name:        "Refonte du programme de transformation",
      projectName: "Refonte du programme de transformation",
      clientName:  "Groupement territorial",
      startMonth:  "2026-04",
    });
    stored = { activeId: first.id, projects: [first] };
    writeStorage(stored);
  }

  const activeRaw = stored.projects.find(p => p.id === stored.activeId) || stored.projects[0];
  const initial   = sanitizeProjectData(activeRaw);

  // ── Per-project reactive state ──────────────────────────────────────────────
  const projectName    = ref(initial.projectName);
  const clientName     = ref(initial.clientName);
  const startMonth     = ref(initial.startMonth);
  const timelineLength = ref(initial.timelineLength);
  const density        = ref(initial.density);
  const timeUnit       = ref(initial.timeUnit);
  const screenshotMode = ref(false);
  const phases         = ref(initial.phases);

  // ── Projects list (id + name + date only, for the switcher UI) ──────────────
  const activeProjectId = ref(stored.activeId);
  const projects = ref(
    stored.projects.map(p => ({ id: p.id, name: p.name || p.projectName, updatedAt: p.updatedAt }))
  );

  // ── Options ─────────────────────────────────────────────────────────────────
  const densityOptions = [
    { label: "Compact",  value: "compact"     },
    { label: "Équilibré", value: "balanced"   },
    { label: "Détail",   value: "comfortable" },
  ];

  // ── Computed ─────────────────────────────────────────────────────────────────
  const safeTimelineLength = computed(() =>
    Math.min(52, Math.max(3, Number(timelineLength.value) || 12))
  );

  const monthLabels = computed(() => {
    if (timeUnit.value === "sprint") {
      return Array.from({ length: safeTimelineLength.value }, (_, i) => ({
        index: i + 1,
        label: `S${i + 1}`,
        key:   `sprint-${i + 1}`,
      }));
    }
    const [year, month] = (startMonth.value || "2026-01").split("-").map(Number);
    const cursor = new Date(year, (month || 1) - 1, 1);
    return Array.from({ length: safeTimelineLength.value }, (_, i) => {
      const label = cursor.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }).replace(".", "");
      const key   = `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
      cursor.setMonth(cursor.getMonth() + 1);
      return { index: i + 1, label, key };
    });
  });

  const normalizedPhases = computed(() =>
    phases.value.map((phase, i) => {
      const s = sanitizePhase(phase, i + 1);
      s.start    = Math.min(s.start, safeTimelineLength.value);
      s.duration = Math.min(s.duration, safeTimelineLength.value - s.start + 1);
      return s;
    })
  );

  const boardStyle = computed(() => {
    const cfg = {
      compact:     { monthWidth: "minmax(72px, 1fr)",  rowHeight: "72px",  pillHeight: "48px" },
      balanced:    { monthWidth: "minmax(92px, 1fr)",  rowHeight: "88px",  pillHeight: "58px" },
      comfortable: { monthWidth: "minmax(112px, 1fr)", rowHeight: "108px", pillHeight: "70px" },
    }[density.value];
    return {
      "--month-width":  cfg.monthWidth,
      "--row-height":   cfg.rowHeight,
      "--pill-height":  cfg.pillHeight,
    };
  });

  const timelineStartLabel = computed(() =>
    timeUnit.value === "sprint" ? null : (monthLabels.value[0]?.label || "")
  );

  const columnUnit = computed(() => timeUnit.value === "sprint" ? "sprints" : "mois");

  const keyDeliverable = computed(() => {
    const last = normalizedPhases.value[normalizedPhases.value.length - 1];
    return last ? last.name : "Feuille de route";
  });

  const insights = computed(() => {
    const endCol = Math.max(...normalizedPhases.value.map(p => p.start + p.duration - 1), 1);
    const loads  = monthLabels.value.map(m =>
      normalizedPhases.value.filter(p => m.index >= p.start && m.index < p.start + p.duration).length
    );
    const prefix = timeUnit.value === "sprint" ? "S" : "M";
    return [
      { label: "Charge max",   value: `${Math.max(...loads, 1)} phases en parallèle` },
      { label: "Atterrissage", value: `${prefix}${Math.min(endCol, safeTimelineLength.value)}` },
    ];
  });

  // ── Snapshot of current state ─────────────────────────────────────────────
  function currentSnapshot() {
    const name = projectName.value || "Projet sans nom";
    return {
      id:          activeProjectId.value,
      name,
      updatedAt:   new Date().toISOString(),
      projectName: projectName.value,
      clientName:  clientName.value,
      startMonth:  startMonth.value,
      timelineLength: safeTimelineLength.value,
      density:  density.value,
      timeUnit: timeUnit.value,
      phases:   phases.value.map((p, i) => sanitizePhase(p, p.id || i + 1)),
    };
  }

  // ── Save / load ───────────────────────────────────────────────────────────
  function saveState() {
    const fresh      = readStorage() || { projects: [] };
    const snapshot   = currentSnapshot();
    const allProjects = [...fresh.projects];
    const idx        = allProjects.findIndex(p => p.id === activeProjectId.value);
    if (idx >= 0) allProjects[idx] = snapshot;
    else          allProjects.push(snapshot);

    projects.value = allProjects.map(p => ({ id: p.id, name: p.name || p.projectName, updatedAt: p.updatedAt }));
    writeStorage({ activeId: activeProjectId.value, projects: allProjects });
  }

  function applyProjectData(data) {
    const d = sanitizeProjectData(data);
    projectName.value    = d.projectName;
    clientName.value     = d.clientName;
    startMonth.value     = d.startMonth;
    timelineLength.value = d.timelineLength;
    density.value        = d.density;
    timeUnit.value       = d.timeUnit;
    phases.value         = d.phases;
  }

  // ── Project management ────────────────────────────────────────────────────
  function createProject() {
    saveState();
    const p = makeProject();
    const fresh = readStorage() || { projects: [] };
    fresh.projects.push(p);
    fresh.activeId = p.id;
    writeStorage(fresh);
    activeProjectId.value = p.id;
    projects.value = fresh.projects.map(pr => ({ id: pr.id, name: pr.name || pr.projectName, updatedAt: pr.updatedAt }));
    applyProjectData(p);
  }

  function switchProject(id) {
    if (id === activeProjectId.value) return;
    saveState();
    const fresh = readStorage();
    const target = fresh?.projects.find(p => p.id === id);
    if (!target) return;
    fresh.activeId = id;
    writeStorage(fresh);
    activeProjectId.value = id;
    applyProjectData(target);
  }

  function deleteProject(id) {
    const fresh = readStorage();
    if (!fresh) return;
    const remaining = fresh.projects.filter(p => p.id !== id);
    if (!remaining.length) return; // cannot delete last project
    let newActiveId = activeProjectId.value;
    if (id === activeProjectId.value) {
      newActiveId = remaining[0].id;
      applyProjectData(remaining[0]);
      activeProjectId.value = newActiveId;
    }
    projects.value = remaining.map(p => ({ id: p.id, name: p.name || p.projectName, updatedAt: p.updatedAt }));
    writeStorage({ activeId: newActiveId, projects: remaining });
  }

  function duplicateProject() {
    saveState();
    const fresh = readStorage();
    const current = fresh?.projects.find(p => p.id === activeProjectId.value);
    if (!current) return;
    const clone = {
      ...structuredClone(current),
      id:          uid(),
      name:        `${current.name} (copie)`,
      projectName: `${current.projectName} (copie)`,
      updatedAt:   new Date().toISOString(),
    };
    fresh.projects.push(clone);
    fresh.activeId = clone.id;
    writeStorage(fresh);
    activeProjectId.value = clone.id;
    projects.value = fresh.projects.map(p => ({ id: p.id, name: p.name || p.projectName, updatedAt: p.updatedAt }));
    applyProjectData(clone);
  }

  // ── Phase operations ───────────────────────────────────────────────────────
  function addPhase() {
    phases.value.push({ id: uid(), name: "Nouvelle phase", start: 1, duration: 2, color: "#c97b63" });
  }
  function removePhase(index) { phases.value.splice(index, 1); }
  function movePhase(index, dir) {
    const next = index + dir;
    if (next < 0 || next >= phases.value.length) return;
    const [p] = phases.value.splice(index, 1);
    phases.value.splice(next, 0, p);
  }

  function phasePillStyle(phase) {
    return { background: `linear-gradient(135deg, ${phase.color}, ${phase.color}cc)` };
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  async function saveAsPng() {
    screenshotMode.value = true;
    await nextTick();
    await nextTick();
    try {
      const board = document.querySelector("#planning-capture");
      if (!board) return;
      const dataUrl = await toPng(board, {
        cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff",
        skipFonts: true, width: board.scrollWidth, height: board.scrollHeight,
        style: { overflow: "visible", fontFamily: "Inter, system-ui, sans-serif" },
      });
      const a = document.createElement("a");
      a.download = `${projectName.value || "macro-planning"}.png`;
      a.href = dataUrl;
      a.click();
    } finally {
      screenshotMode.value = false;
    }
  }

  function resetExample() {
    applyProjectData({
      projectName: "Refonte du programme de transformation",
      clientName:  "Groupement territorial",
      startMonth:  "2026-04",
      timelineLength: 12,
      density: "balanced",
      timeUnit: "month",
      phases: defaultPhases,
    });
  }

  // ── Keyboard ───────────────────────────────────────────────────────────────
  function handleKeydown(e) {
    if (e.key === "Escape" && screenshotMode.value) screenshotMode.value = false;
  }

  // ── Watchers ───────────────────────────────────────────────────────────────
  watch(
    [projectName, clientName, startMonth, timelineLength, density, timeUnit, screenshotMode],
    () => {
      timelineLength.value = safeTimelineLength.value;
      document.body.classList.toggle("screenshot-mode", Boolean(screenshotMode.value));
      saveState();
    },
    { immediate: true }
  );

  watch(phases, saveState, { deep: true });

  // Keep project list name in sync as user types
  watch(projectName, name => {
    const idx = projects.value.findIndex(p => p.id === activeProjectId.value);
    if (idx >= 0) projects.value[idx] = { ...projects.value[idx], name: name || "Projet sans nom" };
  });

  onMounted(()  => window.addEventListener("keydown", handleKeydown));
  onUnmounted(() => window.removeEventListener("keydown", handleKeydown));

  return {
    // Project management
    projects, activeProjectId,
    createProject, switchProject, deleteProject, duplicateProject,

    // Per-project state
    projectName, clientName, startMonth, timelineLength,
    density, densityOptions, timeUnit, screenshotMode, phases,

    // Computed
    safeTimelineLength, monthLabels, normalizedPhases,
    boardStyle, timelineStartLabel, columnUnit,
    keyDeliverable, insights,

    // Actions
    addPhase, removePhase, movePhase,
    resetExample, saveAsPng, phasePillStyle,
  };
}
