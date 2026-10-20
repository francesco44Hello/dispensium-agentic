import type { ReactNode } from 'react';
import styles from './PlaceholderPage.module.css';

// Simple page shell for sections that are not built yet: shows the page title and what it will hold.
export function PlaceholderPage({ title, description }: { title: ReactNode; description?: string }) {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </section>
  );
}
