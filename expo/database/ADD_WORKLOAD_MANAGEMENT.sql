-- ========================================
-- 🔧 AJOUT DE LA GESTION DE CHARGE DE TRAVAIL ARTISAN
-- ========================================

-- Étape 1 : Ajouter les colonnes nécessaires
alter table public.artisans
add column if not exists current_mission_id uuid references public.missions(id) on delete set null,
add column if not exists active_missions_count integer default 0 not null,
add column if not exists last_availability_change timestamptz,
add column if not exists availability_mode text default 'manual' check (availability_mode in ('manual', 'auto', 'smart'));

-- Étape 2 : Index pour optimiser les requêtes
create index if not exists idx_artisans_current_mission 
on public.artisans (current_mission_id) where current_mission_id is not null;

create index if not exists idx_artisans_workload 
on public.artisans (active_missions_count, is_available);

-- Étape 3 : Fonction pour calculer la charge de travail
create or replace function calculate_artisan_workload(p_artisan_id uuid)
returns table(
  active_missions integer,
  workload_status text,
  can_accept_more boolean
) as $$
declare
  v_active_count integer;
  v_max_concurrent integer := 3; -- Configurable par artisan plus tard
begin
  -- Compte les missions actives (accepted ou in_progress)
  select count(*) into v_active_count
  from public.missions
  where artisan_id = p_artisan_id
    and status in ('accepted', 'in_progress');

  -- Détermine le statut de charge
  return query select 
    v_active_count,
    case 
      when v_active_count = 0 then 'available'
      when v_active_count = 1 then 'busy'
      when v_active_count >= 2 then 'very_busy'
    end as workload_status,
    v_active_count < v_max_concurrent as can_accept_more;
end;
$$ language plpgsql;

-- Étape 4 : Fonction pour mettre à jour automatiquement le compteur de missions actives
create or replace function update_artisan_active_missions_count()
returns trigger as $$
declare
  v_artisan_id uuid;
  v_count integer;
begin
  -- Détermine l'artisan concerné
  if TG_OP = 'DELETE' then
    v_artisan_id := OLD.artisan_id;
  else
    v_artisan_id := NEW.artisan_id;
  end if;

  -- Si pas d'artisan assigné, on sort
  if v_artisan_id is null then
    return coalesce(NEW, OLD);
  end if;

  -- Compte les missions actives
  select count(*) into v_count
  from public.missions
  where artisan_id = v_artisan_id
    and status in ('accepted', 'in_progress');

  -- Met à jour le compteur
  update public.artisans
  set active_missions_count = v_count,
      current_mission_id = case 
        when v_count > 0 then (
          select id from public.missions 
          where artisan_id = v_artisan_id 
            and status in ('accepted', 'in_progress')
          order by accepted_at desc
          limit 1
        )
        else null
      end
  where id = v_artisan_id;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- Étape 5 : Trigger pour maintenir le compteur à jour
drop trigger if exists update_artisan_workload on public.missions;

create trigger update_artisan_workload
after insert or update or delete on public.missions
for each row
when (
  (TG_OP = 'DELETE' and OLD.artisan_id is not null) or
  (TG_OP in ('INSERT', 'UPDATE') and NEW.artisan_id is not null)
)
execute function update_artisan_active_missions_count();

-- Étape 6 : Fonction pour suggérer un changement de disponibilité (appelée depuis l'app)
create or replace function suggest_availability_change(p_artisan_id uuid)
returns table(
  should_suggest boolean,
  suggestion_type text,
  message text
) as $$
declare
  v_artisan record;
  v_workload record;
begin
  -- Récupère les infos de l'artisan
  select * into v_artisan
  from public.artisans
  where id = p_artisan_id;

  -- Récupère la charge de travail
  select * into v_workload
  from calculate_artisan_workload(p_artisan_id);

  -- Logique de suggestion
  if v_artisan.is_available = true and v_workload.active_missions >= 2 then
    -- Artisan disponible mais surchargé
    return query select 
      true as should_suggest,
      'become_unavailable' as suggestion_type,
      'Vous avez ' || v_workload.active_missions || ' missions actives. Voulez-vous vous marquer temporairement indisponible ?' as message;
  
  elsif v_artisan.is_available = false and v_workload.active_missions = 0 then
    -- Artisan indisponible mais sans mission
    return query select 
      true as should_suggest,
      'become_available' as suggestion_type,
      'Vous n''avez plus de missions actives. Voulez-vous redevenir disponible ?' as message;
  
  else
    -- Pas de suggestion
    return query select 
      false as should_suggest,
      'none' as suggestion_type,
      '' as message;
  end if;
end;
$$ language plpgsql;

-- Étape 7 : Vue pour faciliter l'affichage de la charge de travail
create or replace view artisan_workload_status as
select 
  a.id as artisan_id,
  u.name as artisan_name,
  a.category,
  a.is_available,
  a.active_missions_count,
  a.current_mission_id,
  w.workload_status,
  w.can_accept_more,
  case 
    when a.is_available = true and w.active_missions = 0 then '🟢 Disponible'
    when a.is_available = true and w.active_missions = 1 then '🟡 Occupé (1 mission)'
    when a.is_available = true and w.active_missions >= 2 then '🔴 Très occupé (' || w.active_missions || ' missions)'
    when a.is_available = false then '⚫ Indisponible'
  end as display_status
from public.artisans a
join public.users u on u.id = a.id
cross join lateral calculate_artisan_workload(a.id) as w;

-- Étape 8 : Commentaires
comment on column public.artisans.current_mission_id is 'ID de la mission actuellement en cours (la plus récente acceptée/in_progress)';
comment on column public.artisans.active_missions_count is 'Nombre total de missions actives (accepted + in_progress)';
comment on column public.artisans.availability_mode is 'Mode de gestion de disponibilité : manual (contrôle total artisan), auto (désactivation automatique), smart (suggestions intelligentes)';
comment on column public.artisans.last_availability_change is 'Timestamp du dernier changement manuel de disponibilité';

-- ========================================
-- ✅ Script terminé avec succès
-- ========================================

-- Pour tester la fonction de suggestion :
-- select * from suggest_availability_change('votre-artisan-id-uuid');

-- Pour voir la charge de travail de tous les artisans :
-- select * from artisan_workload_status;
