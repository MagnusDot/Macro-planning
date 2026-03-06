export const STORAGE_KEY        = "macro-planning-v2";
export const STORAGE_KEY_LEGACY = "macro-planning-vue-state";

export const DEFAULT_PHASES = Object.freeze([
  { id: 1, name: "Cadrage et lancement",   start: 1, duration: 2, color: "#d6642a" },
  { id: 2, name: "Diagnostic et collecte", start: 2, duration: 3, color: "#1e6b7a" },
  { id: 3, name: "Scenario cible",         start: 4, duration: 3, color: "#5d7f31" },
  { id: 4, name: "Feuille de route",       start: 7, duration: 2, color: "#7f4da0" },
  { id: 5, name: "Pilotage et passation",  start: 9, duration: 4, color: "#ad4454" },
]);

export const DENSITY_CONFIG = Object.freeze({
  compact:     { monthWidth: "minmax(72px, 1fr)",  rowHeight: "72px",  pillHeight: "48px" },
  balanced:    { monthWidth: "minmax(92px, 1fr)",  rowHeight: "88px",  pillHeight: "58px" },
  comfortable: { monthWidth: "minmax(112px, 1fr)", rowHeight: "108px", pillHeight: "70px" },
});

export const DENSITY_OPTIONS = Object.freeze([
  { label: "Compact",   value: "compact"     },
  { label: "Équilibré", value: "balanced"    },
  { label: "Détail",    value: "comfortable" },
]);

export const DEMO_PROJECT = Object.freeze({
  projectName:    "Refonte du programme de transformation",
  clientName:     "Groupement territorial",
  startMonth:     "2026-04",
  timelineLength: 12,
  density:        "balanced",
  timeUnit:       "month",
});
