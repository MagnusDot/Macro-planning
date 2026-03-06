<template>
  <div class="flex flex-col gap-1">
    <!-- Header -->
    <div class="flex items-center justify-between mb-1">
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projets</span>
      <div class="flex gap-1">
        <button
          title="Dupliquer le projet actuel"
          class="inline-flex items-center justify-center rounded-md w-7 h-7 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          @click="state.duplicateProject()"
        >
          <CopyIcon class="w-3.5 h-3.5" />
        </button>
        <button
          title="Nouveau projet"
          class="inline-flex items-center justify-center rounded-md w-7 h-7 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          @click="state.createProject()"
        >
          <PlusIcon class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Project list -->
    <ul class="flex flex-col gap-1">
      <li
        v-for="project in state.projects.value"
        :key="project.id"
        :class="[
          'group flex items-center gap-2 rounded-md px-2.5 py-2 cursor-pointer transition-colors',
          project.id === state.activeProjectId.value
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent text-foreground',
        ]"
        @click="state.switchProject(project.id)"
      >
        <!-- Active indicator -->
        <span
          :class="[
            'shrink-0 w-1.5 h-1.5 rounded-full',
            project.id === state.activeProjectId.value ? 'bg-primary-foreground' : 'bg-border',
          ]"
        />

        <!-- Name + date -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate leading-tight">
            {{ project.name || "Projet sans nom" }}
          </p>
          <p
            :class="[
              'text-[10px] leading-tight',
              project.id === state.activeProjectId.value ? 'text-primary-foreground/70' : 'text-muted-foreground',
            ]"
          >
            {{ formatDate(project.updatedAt) }}
          </p>
        </div>

        <!-- Delete button (hidden unless hovered or active) -->
        <button
          v-if="state.projects.value.length > 1"
          title="Supprimer ce projet"
          :class="[
            'shrink-0 inline-flex items-center justify-center rounded w-5 h-5 transition-colors opacity-0 group-hover:opacity-100',
            project.id === state.activeProjectId.value
              ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20'
              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
          ]"
          @click.stop="state.deleteProject(project.id)"
        >
          <XIcon class="w-3 h-3" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { CopyIcon, PlusIcon, XIcon } from "lucide-vue-next";

const props = defineProps({
  state: { type: Object, required: true },
});

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}
</script>
