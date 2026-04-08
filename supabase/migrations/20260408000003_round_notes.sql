CREATE TABLE round_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE round_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view round notes"
  ON round_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert round notes"
  ON round_notes FOR INSERT TO authenticated WITH CHECK (true);
