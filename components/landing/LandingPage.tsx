'use client';

import Link from 'next/link';
import { LanguageSwitch } from '../i18n/LanguageSwitch';
import { SharedListDemo } from './SharedListDemo';
import { useLocale } from '../i18n/LocaleProvider';
import type { MessageKey } from '../../i18n/messages';
import styles from './LandingPage.module.css';

interface Feature {
  title: MessageKey;
  body: MessageKey;
  shot: MessageKey;
  image: string;
}

// The screenshots are captured from the app in mock mode by e2e/landing-media.spec.ts, never from a real household.
const FEATURES: Feature[] = [
  { title: 'landing.features.shop.title', body: 'landing.features.shop.body', shot: 'landing.shots.shop', image: '/landing/shopping.png' },
  { title: 'landing.features.recipes.title', body: 'landing.features.recipes.body', shot: 'landing.shots.recipes', image: '/landing/recipes.png' },
  { title: 'landing.features.menu.title', body: 'landing.features.menu.body', shot: 'landing.shots.menu', image: '/landing/menu.png' },
];

const RECEIPT_ROWS: { key: MessageKey; checked: boolean; later?: boolean }[] = [
  { key: 'landing.receipt.pasta', checked: true },
  { key: 'landing.receipt.tomatoes', checked: true },
  { key: 'landing.receipt.basil', checked: false, later: true },
  { key: 'landing.receipt.parmigiano', checked: false },
  { key: 'landing.receipt.lemons', checked: false },
];

const STEPS: { title: MessageKey; body: MessageKey }[] = [
  { title: 'landing.how.step1.title', body: 'landing.how.step1.body' },
  { title: 'landing.how.step2.title', body: 'landing.how.step2.body' },
  { title: 'landing.how.step3.title', body: 'landing.how.step3.body' },
];

// The hero receipt is the product in one glance: the shopping list, and the menu on the same sheet.
function Receipt() {
  const { t } = useLocale();
  return (
    <div className={styles.receipt} aria-hidden="true">
      <div className={styles.paper}>
        <p className={styles.receiptBrand}>Dispensium</p>
        <p className={styles.receiptTitle}>{t('landing.receipt.title')}</p>
        <div className={styles.dashed} />
        <ul className={styles.rows}>
          {RECEIPT_ROWS.map((row) => (
            <li key={row.key} className={`${styles.row} ${row.checked ? styles.done : ''} ${row.later ? styles.later : ''}`}>
              <span className={styles.box} />
              <span>{t(row.key)}</span>
            </li>
          ))}
        </ul>
        <p className={styles.menuRow}>{t('landing.receipt.menu')}</p>
        <div className={styles.dashed} />
        <p className={styles.receiptFooter}>{t('landing.receipt.footer')}</p>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { t } = useLocale();
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <p className={styles.wordmark}>Dispensium</p>
        <div className={styles.topActions}>
          <LanguageSwitch />
          <Link href="/login" className={styles.login}>
            {t('auth.login')}
          </Link>
        </div>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="landing-hero">
          <div className={styles.heroText}>
            <p className={styles.tagline}>{t('menu.tagline')}</p>
            <h1 id="landing-hero" className={styles.heroTitle}>
              {t('landing.hero.title')}
            </h1>
            <p className={styles.lead}>{t('landing.hero.body')}</p>
            <div className={styles.actions}>
              <Link href="/signup" className={styles.primary}>
                {t('auth.signup')}
              </Link>
              <Link href="/login" className={styles.secondary}>
                {t('auth.login')}
              </Link>
            </div>
          </div>
          <Receipt />
        </section>

        <section className={styles.section} aria-labelledby="landing-features">
          <h2 id="landing-features" className={styles.heading}>
            {t('landing.features.title')}
          </h2>
          <div className={styles.cards}>
            {FEATURES.map((feature) => (
              <article key={feature.title} className={styles.card}>
                <div className={styles.shotFrame}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- static, pre-sized captures; next/image would add nothing */}
                  <img className={styles.shot} src={feature.image} alt={t(feature.shot)} width={390} height={844} />
                </div>
                <h3 className={styles.cardTitle}>{t(feature.title)}</h3>
                <p className={styles.cardBody}>{t(feature.body)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.split}`} aria-labelledby="landing-video">
          <div>
            <h2 id="landing-video" className={styles.heading}>
              {t('landing.video.title')}
            </h2>
            <p className={styles.lead}>{t('landing.video.body')}</p>
          </div>
          <div className={styles.phone}>
            {/* Still until the walkthrough is recorded: the video file is not in public/ yet, so no player is rendered. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- static capture, as in the feature cards */}
            <img className={styles.video} src="/landing/demo-poster.png" alt={t('landing.video.label')} width={390} height={844} />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="landing-how">
          <h2 id="landing-how" className={styles.heading}>
            {t('landing.how.title')}
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <li key={step.title} className={styles.label}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className={styles.cardTitle}>{t(step.title)}</h3>
                <p className={styles.cardBody}>{t(step.body)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="landing-share">
          <h2 id="landing-share" className={styles.heading}>
            {t('landing.share.title')}
          </h2>
          <p className={styles.lead}>{t('landing.share.body')}</p>
          <p className={styles.quote}>{t('landing.share.quote')}</p>
          <SharedListDemo />
        </section>

        <section className={`${styles.section} ${styles.split}`} aria-labelledby="landing-household">
          <div>
            <h2 id="landing-household" className={styles.heading}>
              {t('landing.household.title')}
            </h2>
            <p className={styles.lead}>{t('landing.household.body')}</p>
            <p className={styles.codeLabel}>{t('landing.household.code')}</p>
            <p className={styles.code}>••••••••</p>
          </div>
          <div className={styles.avatars} aria-hidden="true">
            <span className={styles.avatar}>A</span>
            <span className={styles.avatar}>M</span>
            <span className={styles.avatar}>S</span>
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="landing-cta">
          <h2 id="landing-cta" className={styles.closingTitle}>
            {t('landing.cta.title')}
          </h2>
          <p className={styles.closingBody}>{t('landing.cta.body')}</p>
          <div className={styles.actions}>
            <Link href="/signup" className={styles.primary}>
              {t('auth.signup')}
            </Link>
            <Link href="/login" className={styles.secondaryOnDark}>
              {t('auth.login')}
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>{t('landing.footer.copy')}</p>
        <p>{t('menu.rights')}</p>
      </footer>
    </div>
  );
}
