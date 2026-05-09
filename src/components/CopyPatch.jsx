import React, { useState } from 'react';
import styles from './CopyPatch.module.css';

export default function CopyPatch({ line }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(line);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button className={`${styles.btn} ${copied ? styles.copied : ''}`} onClick={handleCopy}>
      {copied ? '✓' : 'Copy'}
    </button>
  );
}
