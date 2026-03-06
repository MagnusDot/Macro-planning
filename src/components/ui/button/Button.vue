<script setup>
import { buttonVariants } from ".";
import { cn } from "@/lib/utils";

const props = defineProps({
  variant: { type: String, default: "default" },
  size:    { type: String, default: "default" },
  class:   { type: String, default: "" },
});
</script>

<template>
  <button :class="cn(buttonVariants({ variant, size }), props.class)" v-bind="$attrs">
    <slot />
  </button>
</template>
