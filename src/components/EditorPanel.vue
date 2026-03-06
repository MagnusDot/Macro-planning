<template>
  <aside class="flex flex-col gap-3 min-h-0 overflow-y-auto">

    <!-- Intro -->
    <Card>
      <CardHeader class="pb-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Outil</p>
        <CardTitle class="text-base">Macro Planning</CardTitle>
        <CardDescription>
          Construisez et exportez votre planning directeur en quelques minutes.
        </CardDescription>
      </CardHeader>
    </Card>

    <!-- Projets -->
    <Card>
      <CardContent class="pt-4 pb-3">
        <ProjectSwitcher />
      </CardContent>
    </Card>

    <!-- Contexte projet -->
    <Card>
      <CardHeader class="pb-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Projet</p>
        <CardTitle class="text-sm">Contexte</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-3">
        <div class="grid gap-1.5">
          <Label>Nom du projet</Label>
          <Input v-model="planning.projectName" placeholder="Mon projet" />
        </div>
        <div class="grid gap-1.5">
          <Label>Client</Label>
          <Input v-model="planning.clientName" placeholder="Nom du client" />
        </div>

        <!-- Unité de temps -->
        <div class="grid gap-1.5">
          <Label>Unité de temps</Label>
          <div class="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              v-for="unit in timeUnitOptions"
              :key="unit.value"
              type="button"
              :class="[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all flex items-center justify-center gap-1',
                planning.timeUnit === unit.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="planning.timeUnit = unit.value"
            >
              <component :is="unit.icon" class="h-3 w-3" />
              {{ unit.label }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div v-if="planning.timeUnit === 'month'" class="grid gap-1.5">
            <Label>Début</Label>
            <Input v-model="planning.startMonth" type="month" />
          </div>
          <div class="grid gap-1.5" :class="planning.timeUnit === 'sprint' ? 'col-span-2' : ''">
            <Label>{{ planning.timeUnit === "sprint" ? "Nb de sprints" : "Nb de mois" }}</Label>
            <Input v-model.number="planning.timelineLength" type="number" min="3" max="52" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Affichage -->
    <Card>
      <CardHeader class="pb-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Affichage</p>
        <CardTitle class="text-sm">Densité</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-3">
        <div class="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          <button
            v-for="option in planning.densityOptions"
            :key="option.value"
            type="button"
            :class="[
              'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              planning.density === option.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="planning.density = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <Label class="cursor-pointer font-normal">Mode export</Label>
          <input v-model="planning.screenshotMode" type="checkbox" class="h-4 w-4 accent-foreground" />
        </div>

        <Separator />

        <Button class="w-full" @click="planning.saveAsPng">
          <DownloadIcon class="mr-2 h-4 w-4" />
          Enregistrer en PNG
        </Button>
      </CardContent>
    </Card>

  </aside>
</template>

<script setup>
import { inject } from "vue";
import { CalendarIcon, ZapIcon, DownloadIcon } from "lucide-vue-next";
import { PLANNING_KEY } from "@/composables/usePlanningState";
import { Button }      from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input }       from "@/components/ui/input";
import { Label }       from "@/components/ui/label";
import { Separator }   from "@/components/ui/separator";
import ProjectSwitcher from "@/components/ProjectSwitcher.vue";

const planning = inject(PLANNING_KEY);

const timeUnitOptions = [
  { value: "month",  label: "Mois",    icon: CalendarIcon },
  { value: "sprint", label: "Sprints", icon: ZapIcon      },
];
</script>
