create policy "Authenticated users can update scores"
  on round_scores for update to authenticated
  using (true)
  with check (true);
