<template>
  <main class="preview-shell">
    <section class="board-shell glass-card">
      <header class="board-toolbar" v-if="!state.screenshotMode.value">
        <div class="toolbar-copy">
          <p class="eyebrow">Presentation</p>
          <h2>Vue executive</h2>
        </div>

        <div class="toolbar-metrics">
          <article>
            <span>Phases</span>
            <strong>{{ state.phases.value.length }}</strong>
          </article>
          <article>
            <span>Horizon</span>
            <strong>{{ state.safeTimelineLength.value }} mois</strong>
          </article>
          <article>
            <span>Debut</span>
            <strong>{{ state.timelineStartLabel.value }}</strong>
          </article>
        </div>
      </header>

      <section class="planning-board" :style="state.boardStyle.value">
        <div class="board-backdrop"></div>

        <header class="board-header" v-if="!state.screenshotMode.value">
          <div class="board-title">
            <p class="eyebrow">Planning directeur</p>
            <h3>{{ state.projectName.value || "Projet sans nom" }}</h3>
          </div>

          <div class="board-meta">
            <article>
              <span>Client</span>
              <strong>{{ state.clientName.value || "Client" }}</strong>
            </article>
            <article>
              <span>Livrable cle</span>
              <strong>{{ state.keyDeliverable.value }}</strong>
            </article>
          </div>
        </header>

        <section class="insight-strip" v-if="!state.screenshotMode.value">
          <article v-for="insight in state.insights.value" :key="insight.label">
            <span>{{ insight.label }}</span>
            <strong>{{ insight.value }}</strong>
          </article>
        </section>

        <section class="timeline-card">
          <div class="timeline-scroll">
            <div class="timeline-grid">
              <div class="timeline-header">
                <div class="timeline-cell sticky meta-header">
                  <span>Phase</span>
                </div>
                <div v-for="month in state.monthLabels.value" :key="month.key" class="timeline-cell month-header">
                  {{ month.label }}
                </div>
              </div>

              <div v-for="phase in state.normalizedPhases.value" :key="phase.id" class="timeline-row">
                <div class="timeline-cell sticky meta-cell">
                  <strong>{{ phase.name }}</strong>
                </div>

                <div
                  v-for="month in state.monthLabels.value"
                  :key="month.key"
                  class="timeline-cell slot-cell"
                  :class="{
                    active: month.index >= phase.start && month.index < phase.start + phase.duration,
                    edge: month.index === phase.start || month.index === phase.start + phase.duration - 1
                  }"
                >
                  <div
                    v-if="month.index === phase.start"
                    class="phase-pill"
                    :style="state.phasePillStyle(phase)"
                  >
                    <span class="phase-pill-title">{{ phase.name }}</span>
                    <small v-if="state.density.value === 'comfortable'">{{ phase.duration }} mois</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>

<script setup>
defineProps({
  state: {
    type: Object,
    required: true,
  },
});
</script>
