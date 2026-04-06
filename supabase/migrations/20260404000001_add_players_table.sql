-- Add a standalone players table (decoupled from auth.users)
-- This allows adding players without requiring a Supabase auth account.

CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE SET NULL UNIQUE,
  created_by uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view players"
  ON players FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert players"
  ON players FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own player record"
  ON players FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Migrate existing profiles data into players
-- (profiles.id = auth.user.id, so we keep the same IDs for continuity)
INSERT INTO players (id, name, user_id)
SELECT id, name, id FROM profiles;

-- Re-point round_scores.player_id from profiles → players
ALTER TABLE round_scores
  DROP CONSTRAINT round_scores_player_id_fkey;

ALTER TABLE round_scores
  ADD CONSTRAINT round_scores_player_id_fkey
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Update the auth signup trigger to also create a player record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  player_name text;
BEGIN
  player_name := coalesce(NEW.raw_user_meta_data->>'name', NEW.email);

  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, player_name);

  INSERT INTO public.players (name, user_id, created_by)
  VALUES (player_name, NEW.id, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
