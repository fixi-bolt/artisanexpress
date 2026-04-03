-- ========================================
-- Script d'ajout de la visibilité du profil artisan
-- ========================================

-- Étape 1 : Ajouter la colonne is_profile_visible
-- Cette colonne contrôle si le profil est visible publiquement
alter table public.users
add column if not exists is_profile_visible boolean default true;

-- Étape 2 : Supprimer l'ancienne politique si elle existe
drop policy if exists "Only artisans can update their profile visibility" on public.users;

-- Étape 3 : Créer une politique pour que SEULS LES ARTISANS puissent modifier leur visibilité
create policy "Only artisans can update their profile visibility"
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

-- Étape 4 : Créer un index pour optimiser les recherches d'artisans visibles
create index if not exists idx_users_visible_artisans 
on public.users (user_type, is_profile_visible) 
where user_type = 'artisan' and is_profile_visible = true;

-- Étape 5 : Ajouter des commentaires explicatifs
comment on column public.users.is_available is 'Disponibilité en temps réel : l''artisan accepte de nouvelles missions maintenant';
comment on column public.users.is_profile_visible is 'Visibilité du profil : le profil peut être découvert par les clients (même si temporairement indisponible)';

-- ========================================
-- DIFFÉRENCES ENTRE LES DEUX COLONNES :
-- 
-- is_available (Dashboard) :
--   - Contrôle en temps réel
--   - "Je suis dispo MAINTENANT pour travailler"
--   - Toggle fréquent (plusieurs fois par jour)
--
-- is_profile_visible (Paramètres) :
--   - Contrôle de visibilité publique
--   - "Mon profil PEUT être vu par les clients"
--   - Changement rare (désactivation compte, congés longs)
-- ========================================
