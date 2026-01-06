-- Add change detection tables for monitoring domain changes over time

-- Domain snapshots table
CREATE TABLE IF NOT EXISTS domain_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES domain_scans(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Domain changes table
CREATE TABLE IF NOT EXISTS domain_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES domain_snapshots(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  change_details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_domain_snapshots_domain ON domain_snapshots(domain);
CREATE INDEX IF NOT EXISTS idx_domain_snapshots_scan_id ON domain_snapshots(scan_id);
CREATE INDEX IF NOT EXISTS idx_domain_changes_snapshot_id ON domain_changes(snapshot_id);
