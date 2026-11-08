import type { ReactNode } from "react";
import { Link } from "react-router";
import { demoHeart } from "../../heart/demoHearts";
import { Heart } from "../../heart/Heart";
import type { HeartModel } from "../../heart/heartModel";
import { Sky } from "../constellation/Sky";
import { demoSky } from "./demoSky";
import { PublicLayout } from "./PublicLayout";
import styles from "./Public.module.css";

const HERO = demoHeart("forming");
const FORMED: HeartModel = {
  phase: "heart",
  dense: false,
  rings: [],
  label: "",
};
const STEPS: {
  heart: HeartModel;
  numeral: string;
  title: string;
  body: string;
}[] = [
  {
    heart: FORMED,
    numeral: "I",
    title: "Practice gathers into a heart",
    body: "Every session logged, whether it's a quiet sit or an hour with a textbook, adds a little mana. Once five hours have gathered, they settle into a heart that beats softly at the centre of the screen.",
  },
  {
    heart: demoHeart("oneCircle"),
    numeral: "II",
    title: "Circles form around it",
    body: "As the hours keep adding up, rings of light begin to orbit the heart, up to five of them. Each one draws itself in slowly, like a line traced in the dark.",
  },
  {
    heart: demoHeart("steadying"),
    numeral: "III",
    title: "Steady practice, then the next rank",
    body: "Practising most days keeps the circles stable, while long gaps leave them flickering. When all five hold still, they condense into a stronger heart and a new rank begins.",
  },
];
const SKY = demoSky();
const NO_STARS = new Set<string>();

const LEFT_OUT: { icon: ReactNode; text: string }[] = [
  {
    icon: (
      <path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z" />
    ),
    text: "There are no streak flames, so missing a day won't put anything out.",
  },
  {
    icon: (
      <path d="M12 4l2.2 5 5.3.4-4 3.5 1.2 5.2L12 15.4 7.3 18.1l1.2-5.2-4-3.5 5.3-.4z" />
    ),
    text: "Nothing is scored, ranked against strangers or traded for points.",
  },
  {
    icon: (
      <>
        <path d="M7 16v-5a5 5 0 0 1 10 0v5l1.5 2h-13z" />
        <path d="M10.5 20.5h3" />
      </>
    ),
    text: "The app stays quiet, with no pings or pop-ups competing for attention.",
  },
];

function Actions() {
  return (
    <div className={styles.actions}>
      <Link to="/signin?mode=create" className={styles.primary}>
        Create account
      </Link>
      <Link to="/signin" className={styles.secondary}>
        Sign in
      </Link>
    </div>
  );
}

export function Landing() {
  return (
    <PublicLayout guideLink>
      <section className={styles.hero} aria-labelledby="landing-title">
        <div className={styles.heroHeart}>
          <Heart model={HERO} decorative />
        </div>
        <h1 id="landing-title" className={styles.heroTitle}>
          Manaheart
        </h1>
        <p className={`moment ${styles.heroLine}`}>
          Time spent meditating and studying slowly gathers into a heart of
          light.
        </p>
        <Actions />
      </section>

      <section className={styles.band} aria-labelledby="how-title">
        <p className={`label ${styles.eyebrow}`}>How it works</p>
        <h2 id="how-title" className={styles.bandTitle}>
          A slow ritual in three parts
        </h2>
        <ol className={styles.steps}>
          {STEPS.map((s) => (
            <li key={s.numeral}>
              <div className={styles.stepArt}>
                <Heart model={s.heart} decorative pulse="slow" />
              </div>
              <span className={styles.numeral} aria-hidden="true">
                {s.numeral}
              </span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepBody}>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className={`${styles.band} ${styles.split}`}
        aria-labelledby="sky-title"
      >
        <div className={styles.splitArt}>
          <Sky
            stars={SKY.stars}
            ratio={SKY.ratio}
            heartFormed
            variant="mana"
            selected={null}
            onSelect={() => {}}
            fresh={NO_STARS}
            label="A Constellation sky partly filled in"
            interactive={false}
          />
        </div>
        <div className={styles.splitText}>
          <p className={`label ${styles.eyebrow}`}>The Constellation</p>
          <h2 id="sky-title" className={styles.bandTitle}>
            A night sky that fills in over time
          </h2>
          <p className={styles.bodyText}>
            Hours of meditation light the stars of Mind, study lights Lore, and
            coming back regularly lights Rhythm.
          </p>
          <p className={`moment ${styles.aside}`}>
            Over the months, the shape of the sky ends up looking a lot like the
            shape of the practice.
          </p>
        </div>
      </section>

      <section
        className={`${styles.band} ${styles.split} ${styles.splitReverse}`}
        aria-labelledby="origin-title"
      >
        <div className={styles.splitArt}>
          <div className={styles.originHeart}>
            <Heart
              model={demoHeart("steadying")}
              variant="arcane"
              decorative
              pulse="slow"
            />
          </div>
        </div>
        <div className={styles.splitText}>
          <p className={`label ${styles.eyebrow}`}>Where it comes from</p>
          <h2 id="origin-title" className={styles.bandTitle}>
            Borrowed from the stories
          </h2>
          <p className={styles.bodyText}>
            In a lot of webnovels and manhwas, a mage's strength starts as a
            mana heart, and every circle formed around it marks a hard-won step
            up. Manaheart borrows that idea, so the heart grows from the hours
            put into meditation and study.
          </p>
          <p className={`moment ${styles.aside}`}>
            It's a small nod to those stories, and a way to make slow practice
            feel a little like levelling up.
          </p>
        </div>
      </section>

      <section className={styles.band} aria-labelledby="left-out-title">
        <h2 id="left-out-title" className={styles.bandTitle}>
          What Manaheart leaves out
        </h2>
        <ul className={styles.leftOut}>
          {LEFT_OUT.map((item) => (
            <li key={item.text}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {item.icon}
                <path d="M4 20L20 4" />
              </svg>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
        <p className={`moment ${styles.closing}`}>
          It's a log of the practice and a heart that grows with it, and that's
          all it needs to be.
        </p>
      </section>

      <section
        className={`${styles.band} ${styles.cta}`}
        aria-labelledby="cta-title"
      >
        <div className={styles.ctaHeart} aria-hidden="true">
          <Heart model={demoHeart("steadying")} decorative pulse="slow" />
        </div>
        <h2 id="cta-title" className={styles.ctaTitle}>
          Begin with a single session
        </h2>
        <p className={styles.bodyText}>
          Ten quiet minutes is enough to see the first sparks gather.
        </p>
        <Actions />
      </section>
    </PublicLayout>
  );
}
