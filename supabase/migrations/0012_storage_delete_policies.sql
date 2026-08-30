-- 0012_storage_delete_policies.sql
--
-- Pre-launch-fynd: storage.objects hade ingen DELETE-policy för cvs/avatars/logos-buckets.
-- Uppladdning (INSERT) fungerade sedan tidigare, men remove()-anrop tystnade utan fel och
-- raderade 0 rader (RLS filtrerar bort allt utan en explicit DELETE-policy). Det gjorde att
-- varken "radera CV" i profilen eller den nya GDPR-raderingens filstädning faktiskt tog bort
-- några filer, trots att koden såg ut att lyckas.
--
-- Alla tre buckets använder samma sökvägskonvention: ägarens auth.uid() som första
-- mappsegment (cvs/avatars: "{uid}/{uid}.ext", logos: "logos/{uid}.ext" och "covers/{uid}.ext"
-- -- där uid ligger i FILNAMNET, inte som mappsegment, så den policyn matchar på position 2).

-- cvs och avatars: sökväg är "{uid}/{uid}.ext" -- uid är första mappsegmentet.
drop policy if exists "Users can delete own file in cvs" on storage.objects;
create policy "Users can delete own file in cvs"
  on storage.objects for delete
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own file in avatars" on storage.objects;
create policy "Users can delete own file in avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- logos: sökväg är "logos/{uid}.ext" eller "covers/{uid}.ext" -- uid ligger i filnamnet,
-- inte som eget mappsegment, så vi plockar ut det med vanliga strängfunktioner istället.
drop policy if exists "Users can delete own file in logos" on storage.objects;
create policy "Users can delete own file in logos"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and split_part(split_part(name, '/', 2), '.', 1) = auth.uid()::text
  );
