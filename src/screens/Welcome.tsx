import { useState } from 'react'
import { useManaData } from '../data/context'
import { Heart } from '../heart/Heart'
import { demoHeart, type DemoHeart } from '../heart/demoHearts'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import styles from './Welcome.module.css'

const STEPS: { heart: DemoHeart; title: string; body: string }[] = [
  {
    heart: 'gathering',
    title: 'Time becomes mana',
    body: 'Every minute of meditation or study gathers as mana, and after five hours of practice it forms a heart.',
  },
  {
    heart: 'forming',
    title: 'Circles form around it',
    body: 'As the hours grow, up to five circles take shape and orbit the heart.',
  },
  {
    heart: 'steadying',
    title: 'Rhythm steadies them',
    body: 'Practising most days steadies the circles, while long gaps leave them flickering. Once all five hold still, they can be condensed into a stronger heart.',
  },
]
const MODELS = STEPS.map((s) => demoHeart(s.heart))

/** First-run explanation in three short screens. Skippable; shown once per account. */
export function Welcome() {
  const { updateProfile } = useManaData()
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1
  const { title, body } = STEPS[step]

  // Optimistic: the app moves on at once; if saving fails, Welcome simply shows again next time.
  const finish = () => {
    updateProfile({ welcomeSeenAt: new Date().toISOString() }).catch(() => {})
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        {step > 0 ? (
          <button type="button" className={styles.icon} aria-label="Back" onClick={() => setStep(step - 1)}>
            <Icon name="back" />
          </button>
        ) : <span className={styles.icon} aria-hidden="true" />}
        <span className={`label ${styles.count}`}>{step + 1} of {STEPS.length}</span>
        {!last ? (
          <Button variant="ghost" className={styles.skip} onClick={finish}>Skip</Button>
        ) : <span className={styles.icon} aria-hidden="true" />}
      </header>

      <div className={styles.heart}>
        <Heart key={step} model={MODELS[step]} decorative />
      </div>

      <div className={styles.text}>
        <div className={styles.dots} role="img" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span key={s.title} className={i === step ? `${styles.dot} ${styles.dotOn}` : styles.dot} />
          ))}
        </div>
        <h1 key={title} className={styles.title}>{title}</h1>
        <p className={styles.body}>{body}</p>
      </div>

      <Button block className={styles.next} onClick={last ? finish : () => setStep(step + 1)}>
        {last ? 'Begin' : 'Continue'}
      </Button>
    </div>
  )
}
