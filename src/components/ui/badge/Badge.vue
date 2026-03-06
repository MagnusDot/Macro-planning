<script setup>
import { cn } from "@/lib/utils";
const props = defineProps({
  class:   { type: String, default: "" },
  variant: { type: String, default: "default" },
});
const variantClasses = {
  default:   "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:   "text-foreground",
};
</script>
<template>
  <div :class="cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors', variantClasses[variant], props.class)">
    <slot />
  </div>
</template>
