// Line icons from design/manaheart-design-system/components/Icons. 24px grid, currentColor.
import type { ReactNode } from 'react'

const PATHS = {
  heart: <><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-20 12 12)" /><path d="M12 7.5l2.6 4.5-2.6 4.5-2.6-4.5z" /></>,
  sessions: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  settings: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  meditation: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></>,
  study: <><path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z" /><path d="M12 6v13.5" /></>,
  play: <path d="M8 5.5v13l10-6.5z" />,
  pause: <path d="M9 5v14M15 5v14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M14 6l-6 6 6 6" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.1" /></>,
  forward: <path d="M10 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  delete: <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />,
  export: <><path d="M12 4v11M8 8l4-4 4 4" /><path d="M5 13v6h14v-6" /></>,
  signOut: <><path d="M14 5H6v14h8" /><path d="M10 12h10M17 9l3 3-3 3" /></>,
  locked: <><rect x="6" y="11" width="12" height="9" rx="2" /><path d="M9 11V8a3 3 0 0 1 6 0v3" /></>,
  show: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.5" /></>,
  hide: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.5" /><path d="M4 4l16 16" /></>,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 24, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={size <= 18 ? 1.6 : 1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  )
}
