<template>
  <div
    class="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-xl border bg-card shadow-lg transition-all duration-200"
    :class="isOpen ? 'max-h-[75vh]' : 'max-h-[52px] overflow-hidden'"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-3 cursor-pointer select-none flex-shrink-0"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Phases</span>
        <Badge variant="secondary">{{ state.phases.value.length }}</Badge>
      </div>
      <div class="flex items-center gap-1.5" @click.stop>
        <Button v-if="isOpen" size="sm" variant="outline" @click="state.addPhase">
          <PlusIcon class="h-3.5 w-3.5 mr-1" />
          Ajouter
        </Button>
        <Button size="icon" variant="ghost" class="h-7 w-7" @click="isOpen = !isOpen">
          <ChevronDownIcon v-if="isOpen" class="h-4 w-4" />
          <ChevronUpIcon v-else class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <Separator />

    <!-- Phase list -->
    <Transition name="modal-body">
      <div v-if="isOpen" class="flex-1 overflow-y-auto p-3 grid gap-2 min-h-0">
        <div
          v-for="(phase, index) in state.phases.value"
          :key="phase.id"
          class="rounded-lg border bg-muted/40 p-3 grid gap-2"
        >
          <!-- Top row -->
          <div class="flex items-center gap-2">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-border text-xs font-bold text-muted-foreground">
              {{ index + 1 }}
            </span>
            <div class="flex-1 grid gap-1">
              <Input
                v-model="phase.name"
                placeholder="Nom de la phase"
                class="h-8 text-sm"
              />
            </div>
            <div class="flex gap-1">
              <Button size="icon" variant="ghost" class="h-7 w-7" :disabled="index === 0" @click="state.movePhase(index, -1)">
                <ChevronUpIcon class="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" class="h-7 w-7" :disabled="index === state.phases.value.length - 1" @click="state.movePhase(index, 1)">
                <ChevronDownIcon class="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" class="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" @click="state.removePhase(index)">
                <XIcon class="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <!-- Fields -->
          <div class="grid grid-cols-2 gap-2">
            <div class="grid gap-1">
              <Label class="text-xs">Début</Label>
              <Input v-model.number="phase.start" type="number" min="1" :max="state.safeTimelineLength.value" class="h-8 text-sm" />
            </div>
            <div class="grid gap-1">
              <Label class="text-xs">Durée</Label>
              <Input v-model.number="phase.duration" type="number" min="1" :max="state.safeTimelineLength.value" class="h-8 text-sm" />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Label class="text-xs shrink-0">Couleur</Label>
            <input v-model="phase.color" type="color" class="h-8 w-full rounded-md border border-input cursor-pointer p-1" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { PlusIcon, ChevronUpIcon, ChevronDownIcon, XIcon } from "lucide-vue-next";
import { Button }    from "@/components/ui/button";
import { Badge }     from "@/components/ui/badge";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

defineProps({ state: { type: Object, required: true } });

const isOpen = ref(true);
</script>

<style scoped>
.modal-body-enter-active,
.modal-body-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.modal-body-enter-from,
.modal-body-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
