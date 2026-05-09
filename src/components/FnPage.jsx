import { FnPanel } from './FnPanel';
import Summary from './Summary';

// Re-export everything so pages only need one import:
//   import FnPage, { FnDef, FnPanel } from '@site/src/components/FnPage';
export { FnDef, FnPanel } from './FnPanel';

/**
 * Single-panel function reference page layout.
 * For pages with multiple sections, use <FnPanel> directly alongside <Summary>.
 *
 * Usage:
 *   <FnPage summary="Short description.">
 *     <FnDef name="fn_name">...</FnDef>
 *   </FnPage>
 */
export default function FnPage({ summary, children }) {
  return (
    <>
      {summary && <Summary><p>{summary}</p></Summary>}
      <FnPanel>{children}</FnPanel>
    </>
  );
}
