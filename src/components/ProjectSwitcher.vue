<template>
  <div class="flex flex-col gap-1">
    <!-- Header -->
    <div class="flex items-center justify-between mb-1">
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projets</span>
      <div class="flex gap-1">
        <button
          title="Dupliquer le projet actuel"
          class="inline-flex items-center justify-center rounded-md w-7 h-7 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          @click="planning.duplicateProject"
        >
          <CopyIcon class="w-3.5 h-3.5" />
        </button>
        <button
          title="Nouveau projet"
          class="inline-flex items-center justify-center rounded-md w-7 h-7 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          @click="planning.createProject"
        >
          <PlusIcon class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Project list -->
    <ul class="flex flex-col gap-1">
      <li
        v-for="project in planning.projects"
        :key="project.id"
        :class="[
          'group flex items-center gap-2 rounded-md px-2.5 py-2 cursor-pointer transition-colors',
          project.id === planning.activeProjectId
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent text-foreground',
        ]"
        @click="planning.switchProject(project.id)"
      >
        <span
          :class="[
            'shrink-0 w-1.5 h-1.5 rounded-full',
            project.id === planning.activeProjectId ? 'bg-primary-foreground' : 'bg-border',
          ]"
        />

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate leading-tight">
            {{ project.name || "Projet sans nom" }}
          </p>
          <p
            :class="[
              'text-[10px] leading-tight',
              project.id === planning.activeProjectId ? 'text-primary-foreground/70' : 'text-muted-foreground',
            ]"
          >
            {{ formatDate(project.updatedAt) }}
          </p>
        </div>

        <button
          v-if="planning.projects.length > 1"
          title="Supprimer ce projet"
          :class="[
            'shrink-0 inline-flex items-center justify-center rounded w-5 h-5 transition-colors opacity-0 group-hover:opacity-100',
            project.id === planning.activeProjectId
              ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20'
              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
          ]"
          @click.stop="planning.deleteProject(project.id)"
        >
          <XIcon class="w-3 h-3" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { inject } from "vue";
import { CopyIcon, PlusIcon, XIcon } from "lucide-vue-next";
import { PLANNING_KEY } from "@/composables/usePlanningState";

const planning = inject(PLANNING_KEY);

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}
</script>
