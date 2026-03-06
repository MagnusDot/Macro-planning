<template>
  <aside class="editor-shell">
    <section class="glass-card intro-card">
      <p class="eyebrow">Appel d'offres</p>
      <h1>Macro planning</h1>
      <p class="intro-copy">
        Edite les grandes phases, ajuste la densite d'affichage et prepare un export propre sans scroll parasite.
      </p>
    </section>

    <section class="glass-card form-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Projet</p>
          <h2>Contexte</h2>
        </div>
      </div>

      <div class="form-stack">
        <label class="field">
          <span>Nom du projet</span>
          <input v-model="state.projectName.value" type="text" />
        </label>

        <label class="field">
          <span>Client</span>
          <input v-model="state.clientName.value" type="text" />
        </label>

        <div class="field-grid">
          <label class="field">
            <span>Debut</span>
            <input v-model="state.startMonth.value" type="month" />
          </label>

          <label class="field">
            <span>Nb de mois</span>
            <input v-model.number="state.timelineLength.value" type="number" min="3" max="24" />
          </label>
        </div>
      </div>
    </section>

    <section class="glass-card control-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Affichage</p>
          <h2>Confort de lecture</h2>
        </div>
      </div>

      <div class="segmented">
        <button
          v-for="option in state.densityOptions"
          :key="option.value"
          type="button"
          :class="['segment', { active: state.density.value === option.value }]"
          @click="state.density.value = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <label class="toggle-row">
        <span>Mode screenshot</span>
        <input v-model="state.screenshotMode.value" type="checkbox" />
      </label>

      <div class="action-grid">
        <button class="primary-button" type="button" @click="state.saveAsPng">Enregistrer en PNG</button>
        <button class="secondary-button" type="button" @click="state.resetExample">Recharger l'exemple</button>
      </div>
    </section>
  </aside>
</template>

<script setup>
defineProps({
  state: {
    type: Object,
    required: true,
  },
});
</script>
