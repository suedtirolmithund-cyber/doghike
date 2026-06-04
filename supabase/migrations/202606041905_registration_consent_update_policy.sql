drop policy if exists "Eigene Registrierungseinwilligung aktualisieren" on public.registration_consents;

create policy "Eigene Registrierungseinwilligung aktualisieren"
  on public.registration_consents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
