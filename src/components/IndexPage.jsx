import { PageCardGrid } from './PageCard';
import Summary from './Summary';

// Re-export PageCard so hub pages only need one import
export { PageCard } from './PageCard';

/**
 * Hub/index page layout. Renders a summary block followed by a card grid.
 *
 * Usage in MDX:
 *   import IndexPage, { PageCard } from '@site/src/components/IndexPage';
 *
 *   <IndexPage summary="Short description of this section.">
 *     <PageCard href="..." tag="..." tagColor="..." title="..." description="..." />
 *   </IndexPage>
 */
export default function IndexPage({ summary, columns, children }) {
  return (
    <>
      {summary && <Summary><p>{summary}</p></Summary>}
      <PageCardGrid columns={columns}>{children}</PageCardGrid>
    </>
  );
}
