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
        <ProjectSwitcher :state="state" />
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
          <Input v-model="state.projectName.value" placeholder="Mon projet" />
        </div>
        <div class="grid gap-1.5">
          <Label>Client</Label>
          <Input v-model="state.clientName.value" placeholder="Nom du client" />
        </div>
        <!-- Unité de temps -->
        <div class="grid gap-1.5">
          <Label>Unité de temps</Label>
          <div class="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              :class="[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                state.timeUnit.value === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
              @click="state.timeUnit.value = 'month'"
            >
              <CalendarIcon class="inline h-3 w-3 mr-1" />Mois
            </button>
            <button
              type="button"
              :class="[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                state.timeUnit.value === 'sprint'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
              @click="state.timeUnit.value = 'sprint'"
            >
              <ZapIcon class="inline h-3 w-3 mr-1" />Sprints
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div v-if="state.timeUnit.value === 'month'" class="grid gap-1.5">
            <Label>Début</Label>
            <Input v-model="state.startMonth.value" type="month" />
          </div>
          <div class="grid gap-1.5" :class="state.timeUnit.value === 'sprint' ? 'col-span-2' : ''">
            <Label>{{ state.timeUnit.value === 'sprint' ? 'Nb de sprints' : 'Nb de mois' }}</Label>
            <Input v-model.number="state.timelineLength.value" type="number" min="3" max="52" />
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
        <!-- Segmented control -->
        <div class="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          <button
            v-for="option in state.densityOptions"
            :key="option.value"
            type="button"
            :class="[
              'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              state.density.value === option.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            @click="state.density.value = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <!-- Screenshot toggle -->
        <div class="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <Label class="cursor-pointer font-normal">Mode export</Label>
          <input
            v-model="state.screenshotMode.value"
            type="checkbox"
            class="h-4 w-4 accent-foreground"
          />
        </div>

        <Separator />

        <Button @click="state.saveAsPng" class="w-full">
          <DownloadIcon class="mr-2 h-4 w-4" />
          Enregistrer en PNG
        </Button>
        <Button variant="outline" @click="state.resetExample" class="w-full">
          Recharger l'exemple
        </Button>
      </CardContent>
    </Card>

  </aside>
</template>

<script setup>
import { DownloadIcon, CalendarIcon, ZapIcon } from "lucide-vue-next";
import { Button }          from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input }           from "@/components/ui/input";
import { Label }           from "@/components/ui/label";
import { Separator }       from "@/components/ui/separator";
import ProjectSwitcher     from "@/components/ProjectSwitcher.vue";

defineProps({
  state: { type: Object, required: true },
});
</script>
