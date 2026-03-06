<template>
  <main id="planning-capture" class="min-w-0 min-h-0 flex flex-col h-full">
    <Card
      :class="[
        'flex-1 min-h-0 flex flex-col overflow-hidden',
        planning.screenshotMode ? 'rounded-none border-0 shadow-none' : '',
      ]"
    >
      <!-- ── Top bar ─────────────────────────────── -->
      <div
        v-if="!planning.screenshotMode"
        class="flex items-center justify-between gap-4 px-4 py-3 border-b flex-wrap shrink-0"
      >
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Projet</p>
          <p class="text-base font-bold tracking-tight truncate">{{ planning.projectName || "Projet sans nom" }}</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <div v-if="planning.clientName" class="h-8 flex items-center gap-1.5 rounded-md border px-3 text-sm">
            <span class="text-muted-foreground">Client ·</span>
            <span class="font-medium">{{ planning.clientName }}</span>
          </div>
          <div class="h-8 flex items-center gap-1.5 rounded-md border px-3 text-sm">
            <span class="text-muted-foreground">{{ planning.safeTimelineLength }} {{ planning.columnUnit }}</span>
          </div>
          <div
            v-if="planning.timeUnit === 'month' && planning.startLabel"
            class="h-8 flex items-center gap-1.5 rounded-md border px-3 text-sm"
          >
            <span class="text-muted-foreground">Début ·</span>
            <span class="font-medium">{{ planning.startLabel }}</span>
          </div>
          <div class="h-8 flex items-center gap-1.5 rounded-md border px-3 text-sm">
            <span class="text-muted-foreground">{{ planning.phases.length }} phases</span>
          </div>
        </div>
      </div>

      <!-- ── Timeline ───────────────────────────── -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <div class="h-full overflow-auto">
          <div
            data-timeline-grid
            :style="{
              ...planning.boardStyle,
              display: 'grid',
              minWidth: 'max(100%, 960px)',
            }"
          >
            <!-- Header row -->
            <div
              class="grid border-b bg-muted/40 sticky top-0 z-10"
              :style="colStyle"
            >
              <div class="px-4 py-3 border-r flex items-center sticky left-0 z-10 bg-muted/40">
                <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phase</span>
              </div>
              <div
                v-for="col in planning.monthLabels"
                :key="col.key"
                class="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground border-l"
              >
                {{ col.label }}
              </div>
            </div>

            <!-- Phase rows -->
            <div
              v-for="phase in planning.normalizedPhases"
              :key="phase.id"
              class="grid border-b last:border-b-0 hover:bg-muted/20 transition-colors"
              :style="{ ...colStyle, minHeight: 'var(--row-height, 84px)' }"
            >
              <div class="px-4 py-3 border-r flex items-center bg-background sticky left-0 z-[2]">
                <span class="text-sm font-medium leading-tight">{{ phase.name }}</span>
              </div>

              <div
                v-for="col in planning.monthLabels"
                :key="col.key"
                class="relative border-l overflow-visible"
              >
                <div
                  v-if="col.index === phase.start"
                  class="absolute top-1/2 -translate-y-1/2 left-1.5 flex flex-col justify-center overflow-hidden z-[3] text-white rounded-md shadow-sm"
                  :style="{
                    ...planning.phasePillStyle(phase),
                    height:   'var(--pill-height, 52px)',
                    width:    `calc(${phase.duration} * 100% - 12px)`,
                    minWidth: 'calc(100% - 12px)',
                    padding:  '8px 10px',
                    gap:      '2px',
                  }"
                >
                  <span class="text-xs font-semibold leading-tight line-clamp-2">{{ phase.name }}</span>
                  <span
                    v-if="planning.density === 'comfortable'"
                    class="text-[11px] opacity-75 font-medium"
                  >{{ phase.duration }} {{ planning.columnUnit === 'sprints' ? 'sprints' : 'mois' }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Card>
  </main>
</template>

<script setup>
import { inject, computed } from "vue";
import { PLANNING_KEY } from "@/composables/usePlanningState";
import { Card } from "@/components/ui/card";

const planning = inject(PLANNING_KEY);

const colStyle = computed(() => ({
  gridTemplateColumns: `minmax(200px, 1.1fr) repeat(${planning.safeTimelineLength}, var(--month-width, minmax(88px, 1fr)))`,
}));
</script>
