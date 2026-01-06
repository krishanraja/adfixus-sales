-- Add missing Tranco and scan method columns to domain_results table
-- These columns are needed to store traffic estimation data from Tranco API

ALTER TABLE domain_results ADD COLUMN IF NOT EXISTS tranco_rank INTEGER;
ALTER TABLE domain_results ADD COLUMN IF NOT EXISTS estimated_monthly_pageviews BIGINT;
ALTER TABLE domain_results ADD COLUMN IF NOT EXISTS estimated_monthly_impressions BIGINT;
ALTER TABLE domain_results ADD COLUMN IF NOT EXISTS traffic_confidence TEXT;
ALTER TABLE domain_results ADD COLUMN IF NOT EXISTS tranco_rank_history JSONB;
ALTER TABLE domain_results ADD COLUMN IF NOT EXISTS rank_trend TEXT;
ALTER TABLE domain_results ADD COLUMN IF NOT EXISTS rank_change_30d INTEGER;
ALTER TABLE domain_results ADD COLUMN IF NOT EXISTS scan_method TEXT;

-- Add index for faster queries on tranco_rank
CREATE INDEX IF NOT EXISTS idx_domain_results_tranco_rank ON domain_results(tranco_rank);
