export const colors = ['BLUE', 'GREEN', 'RED', 'YELLOW'] as const

export interface Card {
    type: string
    color?: string
    number?: number
}

export class Deck {
    private cards: Card[] = []

    constructor(cards?: Card[]) {
        if (cards) {
            this.cards = [...cards]
            return
        }

        const actionTypes = ['SKIP', 'REVERSE', 'DRAW'] as const
        const built: Card[] = []

        for (const color of colors) {
            built.push({ type: 'NUMBERED', color, number: 0 })
            for (let n = 1; n <= 9; n++) {
                built.push({ type: 'NUMBERED', color, number: n })
                built.push({ type: 'NUMBERED', color, number: n })
            }
        }

        for (const color of colors) {
            for (const t of actionTypes) {
                built.push({ type: t, color })
                built.push({ type: t, color })
            }
        }

        for (let i = 0; i < 4; i++) {
            built.push({ type: 'WILD' })   
        }

        for (let i = 0; i < 4; i++) {
            built.push({ type: 'WILD DRAW' })   
        }

        this.cards = built
    }

    get size(): number {
        return this.cards.length
    }

    deal(): Card | undefined {
        return this.cards.shift()
    }

    filter(pred: (card: Card) => boolean): Deck {
        const filtered = this.cards.filter(pred)
        const d = new Deck([])
        ;(d as any).cards = filtered
        return d
    }

    shuffle(shuffler: (cards: Card[]) => void): void {
        shuffler(this.cards)
    }
}