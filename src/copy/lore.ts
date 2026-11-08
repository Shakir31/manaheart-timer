// One passage per rank, revealed in the Grimoire when the rank is reached.
// Apprentice and Adept are from the design; the rest continue in the same voice.

const LORE: Record<string, string> = {
  Apprentice:
    'The first light gathers where attention rests. An apprentice learns that the heart is not forced into being; it is kept, an hour at a time.',
  Adept:
    'Five circles folded into one brighter flame. The adept knows the rhythm now, and returns to it the way a tide returns: without being asked.',
  Magus:
    'The circles come more easily, and so do the quiet hours between them. A magus has stopped counting the minutes; the minutes have begun to count for something.',
  Archmagus:
    'Few keep the rhythm this long. The archmagus carries the heart lightly, the way one carries a lamp through a familiar house, never doubting it is lit.',
  Sage:
    'Every circle has been formed and folded many times over. The sage does not practise to grow the heart. The heart, by now, is simply where the sage lives.',
}

/** Past the last rank the name holds, and the page says so. */
const BEYOND =
  'Beyond the last name, the work goes on. Each condensing is quieter than the one before, and no less true.'

export function loreFor(level: number, ranks: readonly string[]): string {
  if (level > ranks.length) return BEYOND
  return LORE[ranks[level - 1]] ?? BEYOND
}
