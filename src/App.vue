<template>
  <div class="min-h-screen bg-[hsl(210_20%_98%)]">
    <div
      class="grid h-screen gap-3 p-3"
      style="grid-template-columns: 280px minmax(0,1fr)"
    >
      <EditorPanel />
      <BoardView />
    </div>
    <PhasesModal v-if="!planning.screenshotMode" />
  </div>
</template>

<script setup>
import { reactive, provide } from "vue";
import { usePlanningState, PLANNING_KEY } from "./composables/usePlanningState";
import BoardView   from "./components/BoardView.vue";
import EditorPanel from "./components/EditorPanel.vue";
import PhasesModal from "./components/PhasesModal.vue";

const planning = reactive(usePlanningState());
provide(PLANNING_KEY, planning);
</script>
