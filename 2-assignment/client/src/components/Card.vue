<script setup lang="ts">
import type { Card } from "@/model/deck";
import { computed } from "vue";

const props = defineProps({
  card: {
    type: Object as () => Card,
    required: true,
  },
  isBackCard: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const cardNameInAssets = computed(() => {
  if (props.isBackCard) {
    return `src/assets/cards/back.png`;
  }

  const isNumbered = props.card.type === "NUMBERED";
  if (isNumbered) {
    return `src/assets/cards/${props.card.color}_${props.card.number}.jpg`;
  }

  const isWild = props.card.type === "WILD";
  if (isWild) {
    return `src/assets/cards/WILD.jpg`;
  }

  const isWildDrawFour = props.card.type === "WILD DRAW";
  if (isWildDrawFour) {
    return `src/assets/cards/Wild_Draw_4.jpg`;
  }

  const isSkip = props.card.type === "SKIP";
  if (isSkip) {
    return `src/assets/cards/${props.card.color}_SKIP.jpg`;
  }

  const isReverse = props.card.type === "REVERSE";
  if (isReverse) {
    return `src/assets/cards/${props.card.color}_REVERSE.jpg`;
  }

  const isDrawTwo = props.card.type === "DRAW";
  if (isDrawTwo) {
    return `src/assets/cards/${props.card.color}_DRAW_2.jpg`;
  }

  return "";
});
</script>

<template>
  <img style="height: 230px; display: inline" :src="cardNameInAssets" />
</template>
