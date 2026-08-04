-- Add active_plan_type to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_plan_type text NOT NULL DEFAULT 'default';

-- Create custom_templates table
CREATE TABLE IF NOT EXISTS custom_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_index int NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
  day_label text NOT NULL,
  muscle_group text NOT NULL,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_index)
);

ALTER TABLE custom_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_templates" ON custom_templates;
CREATE POLICY "select_own_templates" ON custom_templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_templates" ON custom_templates;
CREATE POLICY "insert_own_templates" ON custom_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_templates" ON custom_templates;
CREATE POLICY "update_own_templates" ON custom_templates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_templates" ON custom_templates;
CREATE POLICY "delete_own_templates" ON custom_templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
