import React, { useState } from 'react';
import styles from './FnPanel.module.css';

/**
 * FnPanel — pill-selector panel for a group of function definitions.
 *
 * Renders a row of pills (one per FnDef child). Clicking a pill swaps
 * the displayed function definition in-place. No scrolling.
 *
 * Usage in MDX:
 *
 *   import { FnPanel, FnDef } from '@site/src/components/FnPanel';
 *
 *   ## Base field (Fp)
 *
 *   <FnPanel>
 *   <FnDef name="fp_add">
 *
 *   Description and signature here.
 *
 *   </FnDef>
 *   <FnDef name="fp_mul">
 *   ...
 *   </FnDef>
 *   </FnPanel>
 */
export function FnPanel({ children }) {
  const entries = React.Children.toArray(children).filter(
    child => child?.type === FnDef
  );

  const [selected, setSelected] = useState(
    entries[0]?.props?.name ?? null
  );

  const active = entries.find(e => e.props.name === selected);

  return (
    <div className={styles.fnPanel}>
      <div className={styles.pills}>
        {entries.map(entry => (
          <button
            key={entry.props.name}
            className={
              styles.pill +
              (selected === entry.props.name ? ' ' + styles.active : '')
            }
            onClick={() => setSelected(entry.props.name)}
          >
            {entry.props.name}
          </button>
        ))}
      </div>
      {active && (
        <div className={styles.content}>
          {active.props.children}
        </div>
      )}
    </div>
  );
}

/**
 * FnDef — a single function entry inside a FnPanel.
 *
 * @param {string} name  Short function name shown on the pill.
 * @param children       Full function documentation as MDX children.
 */
export function FnDef({ children }) {
  // Intentionally renders nothing — FnPanel reads props.children directly.
  return null;
}
