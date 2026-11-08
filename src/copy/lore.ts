// One passage per rank, revealed in the Grimoire when the rank is reached.
// Plain with a little flavour, one sentence each (see CLAUDE.md, Copy style).

const LORE: Record<string, string> = {
  Apprentice:
    'The first light gathers where attention rests, and an apprentice learns that the heart is kept an hour at a time rather than forced.',
  Adept:
    'Five circles folded into one brighter flame, and the adept now returns to the rhythm the way a tide returns, without being asked.',
  Magus:
    'The circles come more easily now, and the minutes no longer need counting.',
  Archmagus:
    'Few keep the rhythm this long, and the archmagus carries the heart lightly, like a lamp through a familiar house.',
  Sage:
    'Every circle has been formed and folded many times over, and the heart has simply become where the sage lives.',
}

/** Past the last rank the name holds, and the page says so. */
const BEYOND =
  'The names end here, but the practice goes on, each condensing a little quieter than the last.'

export function loreFor(level: number, ranks: readonly string[]): string {
  if (level > ranks.length) return BEYOND
  return LORE[ranks[level - 1]] ?? BEYOND
}
