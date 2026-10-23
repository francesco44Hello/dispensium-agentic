import { useLayoutEffect, useRef } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { PREVIOUS_STEP_DAYS, dayLabel, type PreviousAction } from '../../utils/menuWindow';
import styles from './CalendarBar.module.css';
import { useLocale } from '../i18n/LocaleProvider';
import { INTL_LOCALE } from '../../i18n/locale';

interface Props {
  days: string[];
  selected: string;
  onSelect: (date: string) => void;
  previous?: PreviousAction;
  onPrevious?: () => void;
}

// One day pill is 60px wide with a 12px gap; loading earlier days shifts the strip by this much.
const STEP_PX = 72;

// The horizontal day strip, copied from the legacy weekly menu.
export function CalendarBar({ days, selected, onSelect, previous, onPrevious }: Props) {
  const { t, locale } = useLocale();
  const strip = useRef<HTMLDivElement>(null);
  const pendingShift = useRef(0);

  // Open on today: the strip starts with today in view, and earlier days are reached by swiping left.
  useLayoutEffect(() => {
    const node = strip.current;
    const today = node?.querySelector('[aria-pressed="true"]');
    if (node && today) node.scrollLeft += today.getBoundingClientRect().left - node.getBoundingClientRect().left;
  }, []);

  // Earlier days are added to the left, so the view moves on by the same amount to keep the same day in place.
  useLayoutEffect(() => {
    if (strip.current && pendingShift.current) {
      strip.current.scrollLeft += pendingShift.current;
      pendingShift.current = 0;
    }
  }, [days]);

  const handlePrevious = () => {
    if (previous === 'load') pendingShift.current = PREVIOUS_STEP_DAYS * STEP_PX;
    onPrevious?.();
  };

  return (
    <div ref={strip} className={styles.scroll}>
      {previous && onPrevious && (
        <button
          type="button"
          aria-label={previous === 'load' ? t('menu.loadPrevious') : t('menu.hidePrevious')}
          className={styles.previous}
          onClick={handlePrevious}
        >
          {previous === 'load' ? <MdChevronLeft aria-hidden="true" /> : <MdChevronRight aria-hidden="true" />}
          <span>{previous === 'load' ? t('menu.prev') : t('menu.hide')}</span>
        </button>
      )}
      {days.map((date) => {
        const { dayName, dayNumber } = dayLabel(date, INTL_LOCALE[locale]);
        const isSelected = date === selected;
        return (
          <button
            type="button"
            key={date}
            aria-pressed={isSelected}
            aria-label={`${dayName} ${dayNumber}`}
            className={`${styles.pill} ${isSelected ? styles.active : ''}`}
            onClick={() => onSelect(date)}
          >
            <span className={styles.name}>{dayName}</span>
            <span className={styles.num}>{dayNumber}</span>
          </button>
        );
      })}
    </div>
  );
}
