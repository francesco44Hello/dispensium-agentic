'use client';

import { MdPerson } from 'react-icons/md';
import { cleanPhotoUrl } from '../../utils/photoUrl';
import styles from './ProfileAvatar.module.css';

type ProfileAvatarProps = {
  photoUrl: string | null;
  size?: 'small' | 'large';
};

// Shows the Google profile picture, or a placeholder when there is none or it is not a Google link.
export function ProfileAvatar({ photoUrl, size = 'small' }: ProfileAvatarProps) {
  const src = cleanPhotoUrl(photoUrl);
  if (src) {
    // Plain img: the picture is Google's own link, shown as is.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={styles[size]} src={src} alt="" referrerPolicy="no-referrer" />;
  }
  return (
    <span className={`${styles[size]} ${styles.placeholder}`} aria-hidden="true">
      <MdPerson />
    </span>
  );
}
