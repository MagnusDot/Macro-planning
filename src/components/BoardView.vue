<template>
  <main id="planning-capture" class="min-w-0 min-h-0 flex flex-col h-full">
    <Card class="flex-1 min-h-0 flex flex-col overflow-hidden"
      :class="{ 'rounded-none border-0 shadow-none': state.screenshotMode.value }"
    >

      <!-- ── Top bar ─────────────────────────────── -->
      <div v-if="!state.screenshotMode.value" class="flex items-center justify-between gap-4 px-4 py-3 border-b flex-wrap shrink-0">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Projet</p>
          <p class="text-base font-bold tracking-tight truncate">{{ state.projectName.value || "Projet sans nom" }}</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <div v-if="state.clientName.value" class="h-8 flex items-center gap-1.5 rounded-md border px-3 text-sm">
            <span class="text-muted-foreground">Client ·</span>
            <span class="font-medium">{{ state.clientName.value }}</span>
          </div>
          <div class="h-8 flex items-center gap-1.5 rounded-md border px-3 text-sm">
            <span class="text-muted-foreground">{{ state.safeTimelineLength.value }} mois</span>
          </div>
          <div class="h-8 flex items-center gap-1.5 rounded-md border px-3 text-sm">
            <span class="text-muted-foreground">Début ·</span>
            <span class="font-medium">{{ state.timelineStartLabel.value }}</span>
          </div>
          <div class="h-8 flex items-center gap-1.5 rounded-md border px-3 text-sm">
            <span class="text-muted-foreground">{{ state.phases.value.length }} phases</span>
          </div>
        </div>
      </div>

      <!-- ── Timeline ───────────────────────────── -->
      <div
        class="flex-1 min-h-0"
        :class="state.screenshotMode.value ? 'overflow-visible h-auto' : 'overflow-hidden'"
      >
        <div
          :class="state.screenshotMode.value ? 'overflow-visible' : 'h-full overflow-auto'"
        >
          <div
            :style="{
              ...state.boardStyle.value,
              display: 'grid',
              minWidth: 'max(100%, 960px)',
            }"
          >
            <!-- Header row -->
            <div
              class="grid border-b"
              :class="state.screenshotMode.value ? 'bg-[hsl(210_20%_98%)]' : 'bg-muted/40 sticky top-0 z-10'"
              :style="colStyle"
            >
              <div
                class="px-4 py-3 border-r flex items-center bg-[hsl(210_20%_98%)]"
                :class="state.screenshotMode.value ? '' : 'sticky left-0 z-10 bg-muted/40'"
              >
                <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phase</span>
              </div>
              <div
                v-for="month in state.monthLabels.value"
                :key="month.key"
                class="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground border-l"
              >
                {{ month.label }}
              </div>
            </div>

            <!-- Phase rows -->
            <div
              v-for="phase in state.normalizedPhases.value"
              :key="phase.id"
              class="grid border-b last:border-b-0 hover:bg-muted/20 transition-colors"
              :style="{ ...colStyle, minHeight: 'var(--row-height, 84px)' }"
            >
              <!-- Name cell -->
              <div
                class="px-4 py-3 border-r flex items-center bg-background"
                :class="state.screenshotMode.value ? '' : 'sticky left-0 z-[2]'"
              >
                <span class="text-sm font-medium leading-tight">{{ phase.name }}</span>
              </div>

              <!-- Month cells -->
              <div
                v-for="month in state.monthLabels.value"
                :key="month.key"
                class="relative border-l overflow-visible"
              >
                <div
                  v-if="month.index === phase.start"
                  class="absolute top-1/2 -translate-y-1/2 left-1.5 flex flex-col justify-center overflow-hidden z-[3] text-white rounded-md shadow-sm"
                  :style="{
                    ...state.phasePillStyle(phase),
                    height: 'var(--pill-height, 52px)',
                    width: `calc(${phase.duration} * 100% - 12px)`,
                    minWidth: 'calc(100% - 12px)',
                    padding: '8px 10px',
                    gap: '2px',
                  }"
                >
                  <span class="text-xs font-semibold leading-tight line-clamp-2">{{ phase.name }}</span>
                  <span v-if="state.density.value === 'comfortable'" class="text-[11px] opacity-75 font-medium">{{ phase.duration }} mois</span>
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
import { computed } from "vue";
import { Card } from "@/components/ui/card";

const props = defineProps({
  state: { type: Object, required: true },
});

const colStyle = computed(() => ({
  gridTemplateColumns: `minmax(200px, 1.1fr) repeat(${props.state.safeTimelineLength.value}, var(--month-width, minmax(88px, 1fr)))`,
}));
</script>
