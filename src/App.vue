<template>
  <div :class="['min-h-screen bg-[hsl(210_20%_98%)]', { 'bg-white': state.screenshotMode.value }]">
    <div
      :class="[
        state.screenshotMode.value
          ? 'block'
          : 'grid h-screen gap-3 p-3'
      ]"
      :style="!state.screenshotMode.value ? { gridTemplateColumns: '280px minmax(0,1fr)' } : {}"
    >
      <EditorPanel v-if="!state.screenshotMode.value" :state="state" />
      <BoardView :state="state" />
    </div>
    <PhasesModal v-if="!state.screenshotMode.value" :state="state" />
  </div>
</template>

<script setup>
import BoardView    from "./components/BoardView.vue";
import EditorPanel  from "./components/EditorPanel.vue";
import PhasesModal  from "./components/PhasesModal.vue";
import { usePlanningState } from "./composables/usePlanningState";

const state = usePlanningState();
</script>
