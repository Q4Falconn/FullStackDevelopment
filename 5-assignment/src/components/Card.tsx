import React, { useMemo } from "react";
import type { Card as UnoCard } from "@/model/deck";

export default function Card({
  card,
  isBackCard,
}: {
  card: UnoCard;
  isBackCard?: boolean;
}) {
  const src = useMemo(() => {
    if (isBackCard) {
      return `src/assets/cards/back.png`;
    }

    const isNumbered = card.type === "NUMBERED";
    if (isNumbered) {
      return `src/assets/cards/${card.color}_${card.number}.jpg`;
    }

    const isWild = card.type === "WILD";
    if (isWild) {
      return `src/assets/cards/WILD.jpg`;
    }

    const isWildDrawFour = card.type === "WILD DRAW";
    if (isWildDrawFour) {
      return `src/assets/cards/Wild_Draw_4.jpg`;
    }

    const isSkip = card.type === "SKIP";
    if (isSkip) {
      return `src/assets/cards/${card.color}_SKIP.jpg`;
    }

    const isReverse = card.type === "REVERSE";
    if (isReverse) {
      return `src/assets/cards/${card.color}_REVERSE.jpg`;
    }

    const isDrawTwo = card.type === "DRAW";
    if (isDrawTwo) {
      return `src/assets/cards/${card.color}_DRAW_2.jpg`;
    }

    return "";
    return "";
  }, [card, isBackCard]);

  return <img style={{ height: 230, display: "inline" }} src={src} />;
}
