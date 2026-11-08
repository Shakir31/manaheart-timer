import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useManaData } from '../../data/context'
import { useHeartState } from '../../data/useHeartState'
import { Heart } from '../../heart/Heart'
import { heartModel, variantFor } from '../../heart/heartModel'
import { useToast } from '../../ui/toast/context'
import styles from './Moments.module.css'

/** How long the rings collapse and the core flares (--dur-collapse plus a held beat). */
const CEREMONY_MS = 3000
const REDUCED_MS = 400

/**
 * The ceremony. The heart is frozen as it was on arrival, because recording the
 * condensation changes the live state. If saving fails nothing is lost: the circles
 * stay stable and Home offers Condense again.
 */
export function Condense() {
  const live = useHeartState()
  const { condense, profile } = useManaData()
  const toast = useToast()
  const navigate = useNavigate()
  const [start] = useState(live)

  useEffect(() => {
    if (!start.canCondense) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(async () => {
      try {
        await condense()
        navigate('/level-up', { replace: true, state: { condensed: true } })
      } catch {
        toast.show({ message: "The circles couldn't be condensed, so try again.", tone: 'error' })
        navigate('/', { replace: true })
      }
    }, reduced ? REDUCED_MS : CEREMONY_MS)
    return () => window.clearTimeout(id)
  }, [start, condense, navigate, toast])

  if (!start.canCondense) return <Navigate to="/" replace />

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <p className={`label ${styles.eyebrow}`}>Condensing</p>
        <div className={styles.heartLarge}>
          <Heart model={heartModel(start)} variant={variantFor(start.level, profile?.mage)} collapsing decorative />
        </div>
        <p role="status" className={`moment ${styles.body}`}>Five circles fold into the heart…</p>
      </div>
    </div>
  )
}
