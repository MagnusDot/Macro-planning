import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { toPng } from "html-to-image";
import {
  DEFAULT_PHASES, DEMO_PROJECT,
  DENSITY_CONFIG, DENSITY_OPTIONS,
  STORAGE_KEY, STORAGE_KEY_LEGACY,
} from "@/lib/constants";

// Symbol used with provide/inject — import this in consuming components.
export const PLANNING_KEY = Symbol("planning");

// ─── Pure helpers ──────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizePhase(phase, fallbackId) {
  return {
    id:       Number(phase?.id)       || fallbackId,
    name:     (typeof phase?.name === "string" && phase.name.trim()) ? phase.name : "Nouvelle phase",
    start:    Math.max(1, Number(phase?.start)    || 1),
    duration: Math.max(1, Number(phase?.duration) || 1),
    color:    typeof phase?.color === "string" ? phase.color : "#c97b63",
  };
}

function sanitizeData(raw) {
  return {
    projectName:    typeof raw?.projectName === "string" ? raw.projectName : "Nouveau projet",
    clientName:     typeof raw?.clientName  === "string" ? raw.clientName  : "",
    startMonth:     typeof raw?.startMonth  === "string" ? raw.startMonth  : new Date().toISOString().slice(0, 7),
    timelineLength: Math.min(52, Math.max(3, Number(raw?.timelineLength) || 12)),
    density:  ["compact", "balanced", "comfortable"].includes(raw?.density)  ? raw.density  : "balanced",
    timeUnit: ["month", "sprint"].includes(raw?.timeUnit)                    ? raw.timeUnit : "month",
    phases: Array.isArray(raw?.phases) && raw.phases.length
      ? raw.phases.map((p, i) => sanitizePhase(p, i + 1))
      : structuredClone(DEFAULT_PHASES),
  };
}

function makeProject(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: uid(), name: "Nouveau projet", updatedAt: now,
    projectName: "Nouveau projet", clientName: "",
    startMonth: now.slice(0, 7), timelineLength: 12,
    density: "balanced", timeUnit: "month",
    phases: structuredClone(DEFAULT_PHASES),
    ...overrides,
  };
}

// ─── Storage ───────────────────────────────────────────────────────────────

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
      const old     = JSON.parse(legacy);
      const project = makeProject({ name: old.projectName || "Projet existant", ...sanitizeData(old) });
      const storage = { activeId: project.id, projects: [project] };
      writeStorage(storage.activeId, storage.projects);
      localStorage.removeItem(STORAGE_KEY_LEGACY);
      return storage;
    }
  } catch { /* ignore parse/access errors */ }
  return null;
}

function writeStorage(activeId, projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeId, projects }));
}

// ─── Composable ────────────────────────────────────────────────────────────

export function usePlanningState() {
  // ── Bootstrap ─────────────────────────────────────────────────────────────
  const bootstrapped = readStorage() ?? (() => {
    const p = makeProject({ ...DEMO_PROJECT, name: DEMO_PROJECT.projectName });
    const s = { activeId: p.id, projects: [p] };
    writeStorage(s.activeId, s.projects);
    return s;
  })();

  // In-memory project list — single source of truth, no repeated localStorage reads.
  const _projects       = ref(bootstrapped.projects);
  const activeProjectId = ref(bootstrapped.activeId);

  const _activeRaw = _projects.value.find(p => p.id === activeProjectId.value) ?? _projects.value[0];
  const _initial   = sanitizeData(_activeRaw);

  // ── Per-project reactive fields ────────────────────────────────────────────
  const projectName    = ref(_initial.projectName);
  const clientName     = ref(_initial.clientName);
  const startMonth     = ref(_initial.startMonth);
  const timelineLength = ref(_initial.timelineLength);
  const density        = ref(_initial.density);
  const timeUnit       = ref(_initial.timeUnit);
  const phases         = ref(_initial.phases);
  const screenshotMode = ref(false);

  // ── Derived computed ───────────────────────────────────────────────────────
  const safeTimelineLength = computed(() =>
    Math.min(52, Math.max(3, Number(timelineLength.value) || 12))
  );

  const columnUnit = computed(() => timeUnit.value === "sprint" ? "sprints" : "mois");

  const monthLabels = computed(() => {
    if (timeUnit.value === "sprint") {
      return Array.from({ length: safeTimelineLength.value }, (_, i) => ({
        index: i + 1, label: `S${i + 1}`, key: `sprint-${i + 1}`,
      }));
    }
    const [y, m] = (startMonth.value || "2026-01").split("-").map(Number);
    const cursor  = new Date(y, (m || 1) - 1, 1);
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
    const cfg = DENSITY_CONFIG[density.value] ?? DENSITY_CONFIG.balanced;
    return {
      "--month-width": cfg.monthWidth,
      "--row-height":  cfg.rowHeight,
      "--pill-height": cfg.pillHeight,
    };
  });

  const startLabel = computed(() =>
    timeUnit.value === "sprint" ? null : (monthLabels.value[0]?.label ?? "")
  );

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

  // Sidebar project list — only the metadata needed by the UI.
  const projects = computed(() =>
    _projects.value.map(p => ({
      id:        p.id,
      name:      p.name || p.projectName || "Projet sans nom",
      updatedAt: p.updatedAt,
    }))
  );

  // ── Internal helpers ───────────────────────────────────────────────────────
  function _snapshot() {
    const name = projectName.value || "Projet sans nom";
    return {
      id: activeProjectId.value, name, updatedAt: new Date().toISOString(),
      projectName: projectName.value, clientName:  clientName.value,
      startMonth:  startMonth.value,  timelineLength: safeTimelineLength.value,
      density:     density.value,     timeUnit: timeUnit.value,
      phases: phases.value.map((p, i) => sanitizePhase(p, p.id ?? i + 1)),
    };
  }

  function _persist() {
    const snapshot = _snapshot();
    const idx = _projects.value.findIndex(p => p.id === activeProjectId.value);
    if (idx >= 0) _projects.value[idx] = snapshot;
    else          _projects.value.push(snapshot);
    writeStorage(activeProjectId.value, _projects.value);
  }

  function _apply(data) {
    const d = sanitizeData(data);
    projectName.value    = d.projectName;
    clientName.value     = d.clientName;
    startMonth.value     = d.startMonth;
    timelineLength.value = d.timelineLength;
    density.value        = d.density;
    timeUnit.value       = d.timeUnit;
    phases.value         = d.phases;
  }

  // ── Project management ─────────────────────────────────────────────────────
  function createProject() {
    _persist();
    const p = makeProject();
    _projects.value.push(p);
    activeProjectId.value = p.id;
    writeStorage(p.id, _projects.value);
    _apply(p);
  }

  function switchProject(id) {
    if (id === activeProjectId.value) return;
    _persist();
    const target = _projects.value.find(p => p.id === id);
    if (!target) return;
    activeProjectId.value = id;
    writeStorage(id, _projects.value);
    _apply(target);
  }

  function deleteProject(id) {
    if (_projects.value.length <= 1) return;
    _projects.value = _projects.value.filter(p => p.id !== id);
    if (id === activeProjectId.value) {
      activeProjectId.value = _projects.value[0].id;
      _apply(_projects.value[0]);
    }
    writeStorage(activeProjectId.value, _projects.value);
  }

  function duplicateProject() {
    _persist();
    const src = _projects.value.find(p => p.id === activeProjectId.value);
    if (!src) return;
    const clone = {
      ...structuredClone(src),
      id:          uid(),
      name:        `${src.name} (copie)`,
      projectName: `${src.projectName} (copie)`,
      updatedAt:   new Date().toISOString(),
    };
    _projects.value.push(clone);
    activeProjectId.value = clone.id;
    writeStorage(clone.id, _projects.value);
    _apply(clone);
  }

  // ── Phase operations ───────────────────────────────────────────────────────
  function addPhase() {
    phases.value.push({ id: uid(), name: "Nouvelle phase", start: 1, duration: 2, color: "#c97b63" });
  }

  function removePhase(index) {
    phases.value.splice(index, 1);
  }

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
    const gridEl = document.querySelector("[data-timeline-grid]");
    if (!gridEl) return;

    // Place a clone in an off-screen fixed container with width:max-content so
    // columns expand to their natural sum without any viewport constraint.
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      position:   "fixed",
      top:        "0",
      left:       "-99999px",
      overflow:   "visible",
      background: "#ffffff",
      zIndex:     "-9999",
    });

    const clone = gridEl.cloneNode(true);
    clone.style.width    = "max-content";
    clone.style.minWidth = "0";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Let the browser reflow the clone at its natural size.
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const W = clone.offsetWidth;
    const H = clone.offsetHeight;

    // Lock to pixels so getBoundingClientRect is unambiguous during capture.
    clone.style.width    = `${W}px`;
    clone.style.minWidth = `${W}px`;

    await new Promise(r => requestAnimationFrame(r));

    const pixelRatio = Math.min(2, Math.max(0.5, 3840 / W));

    try {
      const url = await toPng(clone, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: "#ffffff",
        skipFonts: true,
        width: W,
        height: H,
        style: { fontFamily: "Inter, system-ui, sans-serif" },
      });
      Object.assign(document.createElement("a"), {
        download: `${projectName.value || "macro-planning"}.png`,
        href: url,
      }).click();
    } finally {
      document.body.removeChild(wrapper);
    }
  }

  function resetToDemo() {
    _apply({ ...DEMO_PROJECT, phases: DEFAULT_PHASES });
  }

  // ── Watchers & lifecycle ───────────────────────────────────────────────────

  // Clamp timeline length on change.
  watch(timelineLength, () => { timelineLength.value = safeTimelineLength.value; });

  // Sync body class for screenshot mode + prevent scroll while rendering.
  watch(screenshotMode, val => {
    document.body.classList.toggle("screenshot-mode", val);
    document.body.style.overflow = val ? "hidden" : "";
  });

  // Auto-save project data on any field change.
  watch([projectName, clientName, startMonth, timelineLength, density, timeUnit], _persist);
  watch(phases, _persist, { deep: true });

  // Keep sidebar name in sync as the user types (without waiting for debounce).
  watch(projectName, name => {
    const idx = _projects.value.findIndex(p => p.id === activeProjectId.value);
    if (idx >= 0) _projects.value[idx] = { ..._projects.value[idx], name: name || "Projet sans nom" };
  });

  const _onKeydown = (e) => { if (e.key === "Escape" && screenshotMode.value) screenshotMode.value = false; };
  onMounted(()  => window.addEventListener("keydown", _onKeydown));
  onUnmounted(() => window.removeEventListener("keydown", _onKeydown));

  return {
    // Project switcher
    projects, activeProjectId,
    createProject, switchProject, deleteProject, duplicateProject,

    // Editable state
    projectName, clientName, startMonth, timelineLength,
    density, timeUnit, phases, screenshotMode,

    // Static config (for select/toggle UIs)
    densityOptions: DENSITY_OPTIONS,

    // Derived read-only
    safeTimelineLength, monthLabels, normalizedPhases,
    boardStyle, startLabel, columnUnit, insights,

    // Actions
    addPhase, removePhase, movePhase, phasePillStyle,
    saveAsPng, resetToDemo,
  };
}
