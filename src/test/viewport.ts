/** Which layout useMediaQuery reports in tests (mobile by default; reset after each test). */
export function setViewport(kind: 'mobile' | 'desktop'): void {
  ;(window as unknown as { __testWidth: number }).__testWidth = kind === 'desktop' ? 1440 : 390
}
