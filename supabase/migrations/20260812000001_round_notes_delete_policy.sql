CREATE POLICY "Authors can delete their own notes"
  ON round_notes FOR DELETE TO authenticated
  USING (created_by IN (SELECT id FROM players WHERE user_id = auth.uid()));
