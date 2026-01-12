import React from 'react'
import type { Card as UnoCard } from '@/model/deck'
import Card from './Card'

export default function Pile({ type, card }: { type: 'DRAW' | 'DISCARD'; card?: UnoCard }) {
  if (type === 'DRAW') {
    return <Card isBackCard card={{ type: 'WILD' }} />
  }
  if (!card) return null
  return <Card card={card} />
}
