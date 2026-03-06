<template>
  <div class="app-root" :class="{ 'screenshot-mode': state.screenshotMode.value }">
    <div class="app-shell">
      <EditorPanel v-if="!state.screenshotMode.value" :state="state" />
      <BoardView :state="state" />
    </div>
    <PhasesModal v-if="!state.screenshotMode.value" :state="state" />
  </div>
</template>

<script setup>
import BoardView from "./components/BoardView.vue";
import EditorPanel from "./components/EditorPanel.vue";
import PhasesModal from "./components/PhasesModal.vue";
import { usePlanningState } from "./composables/usePlanningState";

const state = usePlanningState();
</script>
