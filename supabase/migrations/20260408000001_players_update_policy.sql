-- Allow any authenticated user to update any player's name.
-- This is appropriate for a private friend-group app where all users are trusted.
DROP POLICY IF EXISTS "Users can update their own player record" ON players;

CREATE POLICY "Authenticated users can update players"
  ON players FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
