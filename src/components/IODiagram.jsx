import React from 'react';
import styles from './IODiagram.module.css';

const DEFAULT_BUFFER_ROWS = [
  { index: '①', label: 'byte 0', hex: '0x53', color: '#00FF7C', bg: 'rgba(0,255,124,0.07)', border: true },
  { index: '②', label: 'byte 1', hex: '0x42', color: '#00D4FF', bg: 'rgba(0,212,255,0.07)', border: true },
  { index: null, label: 'byte 2', hex: '0x00', color: '#00D4FF', bg: 'rgba(0,212,255,0.07)', border: true },
  { index: '③', label: 'byte 3', hex: '0x5D', color: '#FF9944', bg: 'rgba(255,153,68,0.07)', border: false },
];

function BufferPanel({ title, rows }) {
  return (
    <div className={`${styles.panel} ${styles.panelBuffer}`}>
      <div className={styles.header}>{title}</div>
      <div>
        {rows.map((row, i) => (
          <div
            key={i}
            className={styles.row}
            style={{
              color: row.color,
              background: row.bg,
              borderBottom: row.border ? '1px solid #363750' : undefined,
            }}
          >
            <div
              className={styles.rowIndex}
              style={row.index == null ? { borderLeft: `3px solid ${row.color}40` } : undefined}
            >
              {row.index}
            </div>
            <div className={styles.rowLabel}>{row.label}</div>
            {row.bytes ? (
              <div className={styles.rowBytes}>
                {row.bytes.map((b, j) => (
                  <span
                    key={j}
                    className={styles.byte}
                    style={{
                      opacity: row.dimFrom !== undefined && j >= row.dimFrom ? 0.25 : 1,
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            ) : (
              <div className={styles.rowHex}>{row.hex}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgramPanel({ title, lines }) {
  return (
    <div className={`${styles.panel} ${styles.panelProgram}`}>
      <div className={styles.header}>{title}</div>
      <div className={styles.programBody}>
        {lines.map((line, i) => (
          <div key={i} className={styles.programLine} style={{ color: line.color }}>
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Side-by-side I/O diagram with a buffer panel and a program panel.
 *
 * Props:
 *   bufferTitle   — label for the buffer panel (e.g. "Input Buffer")
 *   programTitle  — label for the program panel (e.g. "Guest Program")
 *   lines         — array of { text, color } for the program panel
 *   bufferRows    — optional array of { index, label, hex, color, bg, border }
 *                   overrides the default 4-row input buffer layout
 *   bufferOnLeft  — if true, buffer panel is on the left (default: false)
 */
export default function IODiagram({
  bufferTitle,
  programTitle,
  lines,
  bufferRows = DEFAULT_BUFFER_ROWS,
  bufferOnLeft = false,
}) {
  const buffer = <BufferPanel title={bufferTitle} rows={bufferRows} />;
  const program = <ProgramPanel title={programTitle} lines={lines} />;
  return (
    <div className={styles.wrapper}>
      {bufferOnLeft ? buffer : program}
      {bufferOnLeft ? program : buffer}
    </div>
  );
}
