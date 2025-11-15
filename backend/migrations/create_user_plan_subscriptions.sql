CREATE TABLE IF NOT EXISTS user_plan_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES creator_plans(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, canceled, past_due
  start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_at TIMESTAMP,
  cancel_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique active subscription per user (partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_plan_per_user
ON user_plan_subscriptions(user_id) WHERE status = 'active';


