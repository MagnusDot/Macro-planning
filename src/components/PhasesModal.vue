<template>
  <aside class="phases-floating-modal glass-card" :class="{ collapsed: !isOpen }">
    <div class="phases-modal-header" @click="isOpen = !isOpen">
      <div class="phases-modal-title">
        <p class="eyebrow">Phases</p>
        <h2>{{ state.phases.value.length }} éléments</h2>
      </div>
      <div class="phases-modal-controls" @click.stop>
        <button v-if="isOpen" class="secondary-button" type="button" @click="state.addPhase">Ajouter</button>
        <button class="icon-button toggle-button" type="button" @click="isOpen = !isOpen" :title="isOpen ? 'Réduire' : 'Ouvrir'">
          {{ isOpen ? '↓' : '↑' }}
        </button>
      </div>
    </div>

    <Transition name="modal-body">
      <div v-if="isOpen" class="phase-list">
        <article v-for="(phase, index) in state.phases.value" :key="phase.id" class="phase-item">
          <div class="phase-top">
            <div class="phase-index">{{ index + 1 }}</div>
            <label class="field phase-title-field">
              <span>Intitulé</span>
              <input v-model="phase.name" type="text" />
            </label>
            <div class="phase-actions">
              <button type="button" class="icon-button" :disabled="index === 0" @click="state.movePhase(index, -1)">↑</button>
              <button
                type="button"
                class="icon-button"
                :disabled="index === state.phases.value.length - 1"
                @click="state.movePhase(index, 1)"
              >
                ↓
              </button>
              <button type="button" class="icon-button danger" @click="state.removePhase(index)">×</button>
            </div>
          </div>

          <div class="field-grid">
            <label class="field">
              <span>Début</span>
              <input v-model.number="phase.start" type="number" min="1" :max="state.safeTimelineLength.value" />
            </label>
            <label class="field">
              <span>Durée</span>
              <input v-model.number="phase.duration" type="number" min="1" :max="state.safeTimelineLength.value" />
            </label>
          </div>

          <label class="field">
            <span>Couleur</span>
            <input v-model="phase.color" type="color" />
          </label>
        </article>
      </div>
    </Transition>
  </aside>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const isOpen = ref(true);
</script>
