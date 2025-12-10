<script setup lang="ts">
import type { Card as CardType } from "@/model/deck";
import Card from "@/components/Card.vue";

const props = defineProps({
  deckType: {
    type: Object as () => { type: "DRAW" | "DISCARD" },
    required: true,
  },
  card: {
    type: Object as () => CardType,
    required: false,
  },
});

if (props.deckType.type === "DRAW" && !props.card) {
  throw new Error("Card prop is required when type is DRAW");
}

console.log(props.card?.type);
</script>

<template>
  <div>
    <Card
      v-if="deckType.type === 'DRAW'"
      :isBackCard="true"
      :card="{ type: 'WILD' }"
    />
    <Card v-else-if="deckType.type === 'DISCARD'" :card="props.card!" />
  </div>
</template>
