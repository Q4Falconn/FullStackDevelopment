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
    // All card assets live under the public/cards directory in the Next.js
    // project.  Prefixing with a leading slash ensures the correct
    // resolution.  Note that the original assets use capitalised colour
    // names and specific file naming conventions.
    if (isBackCard) {
      return `/cards/back.png`;
    }

    const titleCase = (c: string) => c.charAt(0) + c.slice(1).toLowerCase();

    // Numbered cards follow the pattern "Color_Number.jpg" where the
    // colour is capitalised (e.g. Red_5.jpg).  The card colour is stored
    // in uppercase in the game state.
    if (card.type === "NUMBERED") {
      return `/cards/${titleCase(card.color)}_${card.number}.jpg`;
    }

    // Wild cards use a single image regardless of colour.
    if (card.type === "WILD") {
      return `/cards/Wild.jpg`;
    }

    if (card.type === "WILD DRAW") {
      return `/cards/Wild_Draw_4.jpg`;
    }

    // Skip and draw two images follow the capitalised pattern for all
    // colours.
    if (card.type === "SKIP") {
      return `/cards/${titleCase(card.color)}_Skip.jpg`;
    }

    if (card.type === "DRAW") {
      return `/cards/${titleCase(card.color)}_Draw_2.jpg`;
    }

    // Reverse images use a fully uppercase colour for red in the source
    // assets; other colours follow the TitleCase pattern.  Special‑case
    // red accordingly.
    if (card.type === "REVERSE") {
      if (card.color === 'RED') {
        return `/cards/RED_Reverse.jpg`;
      }
      return `/cards/${titleCase(card.color)}_Reverse.jpg`;
    }

    return "";
  }, [card, isBackCard]);

  return <img style={{ height: 230, display: "inline" }} src={src} />;
}
