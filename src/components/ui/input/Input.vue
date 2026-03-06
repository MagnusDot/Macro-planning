<script setup>
import { cn } from "@/lib/utils";
const props = defineProps({
  class:       { type: String, default: "" },
  type:        { type: String, default: "text" },
  modelValue:  { default: undefined },
});
const emit = defineEmits(["update:modelValue"]);
</script>
<template>
  <input
    v-bind="$attrs"
    :type="props.type"
    :value="props.modelValue"
    :class="cn(
      'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
