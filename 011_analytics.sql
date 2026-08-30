CREATE TABLE IF NOT EXISTS analytics_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), member_id TEXT, event_type TEXT NOT NULL, page TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS analytics_events_member_idx ON analytics_events(member_id);