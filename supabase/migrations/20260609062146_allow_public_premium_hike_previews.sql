drop policy if exists "Öffentliche Touren lesen" on public.public_hikes;

create policy "Öffentliche Touren lesen"
  on public.public_hikes for select
  using (
    (
      status = 'approved'
    )
    or (auth.uid() = user_id)
    or public.is_admin()
  );

drop policy if exists "Öffentliche Tourfotos lesen" on public.public_hike_photos;

create policy "Öffentliche Tourfotos lesen"
  on public.public_hike_photos for select
  using (
    exists (
      select 1
      from public.public_hikes h
      where h.id = public.public_hike_photos.hike_id
        and (
          (
            h.status = 'approved'
          )
          or h.user_id = auth.uid()
          or public.is_admin()
        )
    )
  );
