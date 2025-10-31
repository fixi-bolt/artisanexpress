-- ========================================
-- Script d'ajout du toggle de disponibilité artisan
-- ========================================

-- Étape 1 : Ajouter la colonne is_available
alter table public.users
add column if not exists is_available boolean default false;

-- Étape 2 : Supprimer les anciennes politiques si elles existent
drop policy if exists "Artisans can view their availability" on public.users;
drop policy if exists "Artisans can update their availability" on public.users;
drop policy if exists "Users can view artisan availability" on public.users;
drop policy if exists "Only artisans can update their availability" on public.users;

-- Étape 3 : Créer une politique pour que TOUS les utilisateurs puissent voir la disponibilité des artisans
-- (Important pour que les clients voient quels artisans sont disponibles)
create policy "Users can view artisan availability"
  on public.users
  for select
  using (true);  -- Tout le monde peut voir les profils publics, y compris is_available

-- Étape 4 : Créer une politique pour que SEULS LES ARTISANS puissent modifier leur disponibilité
create policy "Only artisans can update their availability"
  on public.users
  for update
  using (
    auth.uid() = id 
    and user_type = 'artisan'
  )
  with check (
    auth.uid() = id 
    and user_type = 'artisan'
  );

-- Étape 5 : Créer un index pour optimiser les requêtes de recherche d'artisans disponibles
create index if not exists idx_users_available_artisans 
on public.users (user_type, is_available) 
where user_type = 'artisan' and is_available = true;

-- Étape 6 : Ajouter un commentaire sur la colonne
comment on column public.users.is_available is 'Indique si l''artisan est actuellement disponible pour recevoir des missions. Géré par l''artisan via le toggle On/Off.';

-- ========================================
-- Script terminé avec succès
-- ========================================
