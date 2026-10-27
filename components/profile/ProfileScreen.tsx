'use client';

import { useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { useProfilePhoto } from '../../hooks/useProfilePhoto';
import { AVATAR_PHOTOS } from '../../constants/avatars';
import { MAX_DISPLAY_NAME_LENGTH } from '../../utils/displayName';
import { cleanPhotoUrl } from '../../utils/photoUrl';
import { useLocale } from '../i18n/LocaleProvider';
import { LanguageSelect } from '../i18n/LanguageSelect';
import { ProfileAvatar } from './ProfileAvatar';
import styles from './ProfileScreen.module.css';

export function ProfileScreen() {
  const { user, service: authService } = useAuth();
  const { householdId, service: householdService } = useHousehold();
  const { t } = useLocale();
  const currentPhoto = useProfilePhoto();
  const nameId = useId();
  const [savedName, setSavedName] = useState<string>();
  const [draftName, setDraftName] = useState<string>();
  const [pickedPhoto, setPickedPhoto] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const uid = user.uid;
  const name = savedName ?? user.displayName ?? '';
  const shownPhoto = pickedPhoto ?? currentPhoto;
  const googlePhoto = cleanPhotoUrl(user.photoURL);

  async function handleSaveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const saved = await authService.updateDisplayName(draftName ?? name);
      const displayName = saved.displayName ?? '';
      if (householdId) await householdService.saveMemberName(householdId, uid, displayName);
      setSavedName(displayName);
      setDraftName(undefined);
    } catch {
      setError(t('profile.saveError'));
    }
  }

  async function pickPhoto(photo: string) {
    if (!householdId) return;
    setError(null);
    try {
      await householdService.saveMemberPhoto(householdId, uid, photo);
      setPickedPhoto(photo);
    } catch {
      setError(t('profile.saveError'));
    }
  }

  return (
    <div className={styles.screen}>
      <Link href="/" className={styles.back}>
        {t('profile.back')}
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{t('profile.title')}</h1>
        <p className={styles.subtitle}>{t('profile.subtitle')}</p>
      </header>

      <section className={styles.section}>
        <ProfileAvatar photoUrl={shownPhoto} size="large" />
        <dl className={styles.details}>
          <dt className={styles.label}>{t('profile.name')}</dt>
          <dd className={styles.value}>{name || t('profile.noName')}</dd>
          <dt className={styles.label}>{t('profile.email')}</dt>
          <dd className={styles.value}>{user.email}</dd>
        </dl>
      </section>

      <section className={styles.section}>
        <form className={styles.nameForm} onSubmit={handleSaveName}>
          <label htmlFor={nameId} className={styles.label}>
            {t('profile.name')}
          </label>
          <input
            id={nameId}
            className={styles.input}
            value={draftName ?? name}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            onChange={(event) => setDraftName(event.target.value)}
          />
          <button type="submit" className={styles.saveButton}>
            {t('profile.saveName')}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{t('profile.pictureTitle')}</h2>
        <div className={styles.avatars}>
          {AVATAR_PHOTOS.map((photo, index) => (
            <button
              key={photo}
              type="button"
              className={styles.avatarOption}
              aria-label={t('profile.avatarOption', { number: String(index + 1) })}
              aria-pressed={shownPhoto === photo}
              onClick={() => pickPhoto(photo)}
            >
              <ProfileAvatar photoUrl={photo} />
            </button>
          ))}
        </div>
        {googlePhoto && (
          <button type="button" className={styles.linkButton} onClick={() => pickPhoto(googlePhoto)}>
            {t('profile.useGooglePicture')}
          </button>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </section>

      <section className={styles.section}>
        <LanguageSelect />
      </section>
    </div>
  );
}
