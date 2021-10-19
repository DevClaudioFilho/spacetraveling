import styles from './header.module.scss';
import Link from 'next/link';

export default function Header() {
  return (
    <div className={styles.header}>
      <Link href="/">
        <a href="">
          <img src="/img/Logo.svg" alt="logo" />
        </a>
      </Link>
    </div>
  );
}
