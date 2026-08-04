/*
# Create ai_analyses table

## Overview
Stores AI physique analysis results so users can review past reports.
Owner-scoped, multi-user (sign-in required).

## New Tables
1. ai_analyses — stores AI analysis results linked to a progress photo
   - id (uuid PK)
   - user_id (uuid, defaults to auth.uid())
   - photo_id (uuid, references progress_photos)
   - photo_url (text)
   - physique_score (numeric)
   - body_fat_estimate (numeric)
   - muscle_definition (int)
   - shoulder_width (int)
   - chest_development (int)
   - arm_growth (int)
   - waist_reduction (int)
   - posture_improvement (int)
   - symmetry (int)
   - body_fat_trend (text)
   - suggestions (jsonb)
   - report (text)
   - raw_response (jsonb)
   - created_at (timestamptz)

## Security
- RLS enabled, owner-scoped CRUD for authenticated users only.
*/

CREATE TABLE IF NOT EXISTS ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id uuid REFERENCES progress_photos(id) ON DELETE SET NULL,
  photo_url text,
  physique_score numeric,
  body_fat_estimate numeric,
  muscle_definition int,
  shoulder_width int,
  chest_development int,
  arm_growth int,
  waist_reduction int,
  posture_improvement int,
  symmetry int,
  body_fat_trend text,
  suggestions jsonb,
  report text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_analyses" ON ai_analyses;
CREATE POLICY "select_own_ai_analyses" ON ai_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_analyses" ON ai_analyses;
CREATE POLICY "insert_own_ai_analyses" ON ai_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ai_analyses" ON ai_analyses;
CREATE POLICY "delete_own_ai_analyses" ON ai_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_user ON ai_analyses(user_id, created_at);
