-- Stable competitive identities; the site keeps one Character Guessing family.
-- Plain INSERT intentionally fails on conflicting slugs instead of hiding drift.
insert into public.games (slug, name)
values
  ('character-guessing-expedition-crew', 'Character Guessing — Expedition Crew'),
  ('character-guessing-copperlight-city', 'Character Guessing — Copperlight City');
