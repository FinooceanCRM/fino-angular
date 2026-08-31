/** The Super Admin module's "Reports" interface group — shapes shared by every chart and report page. */

// Re-exported from the shared chart components (moved there in the Tidewater
// dashboard pass so every role dashboard can reuse the same chart building
// blocks, not just Super Admin's report pages) — kept here so existing
// `import { BarDatum } from '@features/super-admin/data/models/report.model'`
// call sites across the reports feature don't all need touching.
export type { BarDatum } from '@shared/components/horizontal-bar-list.component';
export type { TrendPoint } from '@shared/components/trend-chart.component';
