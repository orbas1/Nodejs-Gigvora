export interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "disabled";
  rolloutType: "global" | "percentage" | "cohort";
  rolloutPercentage: number | null;
  metadata?: {
    [k: string]: unknown;
  };
}
