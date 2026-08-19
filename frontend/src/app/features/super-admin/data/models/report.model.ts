/** The Super Admin module's "Reports" interface group — shapes shared by every chart and report page. */

export interface BarDatum {
  label: string;
  value: number;
  colour?: string;
}

export interface TrendPoint {
  label: string;
  value: number;
}
