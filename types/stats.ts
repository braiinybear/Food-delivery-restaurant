// ─── Restaurant Stats API Response Types ───────────────────────────────

export interface KpiMetric {
  value: number;
  change: number; // % change compared to previous period
}

export interface StatsKpis {
  revenue: KpiMetric;
  orders: KpiMetric;
  aov: KpiMetric;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface TopSellingItem {
  name: string;
  orders: number;
  revenue: number;
}

export interface PaymentBreakdownItem {
  label: string;
  count: number;
  percentage: number;
}

export interface RatingBreakdownItem {
  stars: number;
  percentage: number;
}

export interface RatingSummary {
  average: number;
  count: number;
  breakdown: RatingBreakdownItem[];
}

export interface RestaurantStatsResponse {
  kpis: StatsKpis;
  chartData: ChartDataPoint[];
  topItems: TopSellingItem[];
  paymentBreakdown: PaymentBreakdownItem[];
  ratings: RatingSummary;
}
