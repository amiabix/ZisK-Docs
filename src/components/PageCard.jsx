import styles from './PageCard.module.css';

const tagClass = { green: styles.tagGreen, yellow: styles.tagYellow, blue: styles.tagBlue, purple: styles.tagPurple };

export function PageCard({ href, tag, tagColor = 'blue', title, description }) {
  return (
    <a href={href} className={styles.link}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={`${styles.tag} ${tagClass[tagColor]}`}>{tag}</span>
          <span className={styles.arrow}>→</span>
        </div>
        <div className={styles.title}>{title}</div>
        <div className={styles.body}>{description}</div>
      </div>
    </a>
  );
}

export function PageCardGrid({ children, columns }) {
  const cls = columns === 2
    ? `${styles.grid} ${styles.grid2col}`
    : styles.grid;
  return <div className={cls}>{children}</div>;
}
