drop policy if exists "Eigene Einträge lesen" on public.journal_entries;
create policy "Eigene Einträge lesen"
  on public.journal_entries for select
  using (auth.uid() = user_id OR public.is_admin());

drop policy if exists "Öffentliche Einträge lesen" on public.journal_entries;
create policy "Öffentliche Einträge lesen"
  on public.journal_entries for select
  using (visibility = 'public' and status = 'approved');

drop policy if exists "Eigene Einträge oder Admin bearbeiten" on public.journal_entries;
create policy "Eigene Einträge oder Admin bearbeiten"
  on public.journal_entries for update
  using (auth.uid() = user_id OR public.is_admin())
  with check (auth.uid() = user_id OR public.is_admin());

drop policy if exists "Eigene Einträge löschen" on public.journal_entries;
create policy "Eigene Einträge löschen"
  on public.journal_entries for delete
  using (auth.uid() = user_id);
