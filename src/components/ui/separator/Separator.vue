<script setup>
import { cn } from "@/lib/utils";
const props = defineProps({
  class:       { type: String, default: "" },
  orientation: { type: String, default: "horizontal" },
});
</script>
<template>
  <div
    role="none"
    :class="cn(
      'shrink-0 bg-border',
      props.orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      props.class
    )"
  />
</template>
