# 🚨 Fix pour l'envoi de demandes d'intervention

## Problème
Vous n'arrivez plus à envoyer des demandes d'intervention.

## Diagnostic rapide

### 1. Vérifiez la console de l'application
Lorsque vous essayez d'envoyer une demande, recherchez ces logs:
- `📤 Starting mission submission...`
- `❌ Error creating mission:` (indique l'erreur)
- `❌ Supabase error:` (erreur base de données)

### 2. Vérifiez Supabase

Allez dans **Supabase Dashboard → SQL Editor** et collez:

```sql
-- Test si le trigger fonctionne
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_mission_created_notify_artisans';

-- Test si la fonction existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'notify_nearby_artisans';
```

## Solutions

### ✅ Solution 1: Réinitialiser le trigger de notifications

Copiez-collez ce script dans **Supabase SQL Editor**:

```sql
-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS on_mission_created_notify_artisans ON public.missions CASCADE;
DROP FUNCTION IF EXISTS public.notify_nearby_artisans() CASCADE;

-- Recréer la fonction corrigée
CREATE OR REPLACE FUNCTION public.notify_nearby_artisans()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  artisan_record RECORD;
  distance_km DOUBLE PRECISION;
  client_name TEXT;
  client_lat DOUBLE PRECISION;
  client_lon DOUBLE PRECISION;
BEGIN
  -- Récupérer les infos du client
  SELECT u.name, u.latitude, u.longitude
  INTO client_name, client_lat, client_lon
  FROM public.users u
  WHERE u.id = NEW.client_id;

  -- Position par défaut si manquante
  IF client_lat IS NULL OR client_lon IS NULL THEN
    client_lat := COALESCE(NEW.latitude, 48.8566);
    client_lon := COALESCE(NEW.longitude, 2.3522);
  END IF;

  -- Notifier les artisans proches
  FOR artisan_record IN
    SELECT 
      u.id, 
      u.name, 
      u.latitude, 
      u.longitude,
      a.intervention_radius
    FROM public.users u
    INNER JOIN public.artisans a ON a.id = u.id
    WHERE 
      u.user_type = 'artisan'
      AND a.is_available = true
      AND a.is_suspended = false
      AND (a.category = NEW.category OR NEW.category = 'Non spécifié')
      AND u.latitude IS NOT NULL 
      AND u.longitude IS NOT NULL
  LOOP
    distance_km := public.calculate_distance(
      client_lat,
      client_lon,
      artisan_record.latitude,
      artisan_record.longitude
    );

    IF distance_km <= COALESCE(artisan_record.intervention_radius, 50) THEN
      INSERT INTO public.notifications (
        user_id, 
        title, 
        message, 
        type,
        mission_id,
        metadata,
        is_read
      )
      VALUES (
        artisan_record.id,
        '🔔 Nouvelle mission disponible',
        'Mission "' || NEW.category || '" à ' || 
        CAST(CAST(distance_km AS NUMERIC(10,1)) AS TEXT) || ' km',
        'mission',
        NEW.id,
        jsonb_build_object('distance_km', distance_km),
        false
      );
    END IF;
  END LOOP;

  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur notify_nearby_artisans: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER on_mission_created_notify_artisans
AFTER INSERT ON public.missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_nearby_artisans();
```

### ✅ Solution 2: Désactiver temporairement le trigger

Si la solution 1 ne fonctionne pas:

```sql
-- Désactiver le trigger temporairement
ALTER TABLE public.missions DISABLE TRIGGER on_mission_created_notify_artisans;
```

Cela vous permettra de créer des missions pendant que nous corrigeons le problème.

### ✅ Solution 3: Vérifier les permissions RLS

```sql
-- Vérifier les policies sur la table missions
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'missions';

-- Si nécessaire, ajouter la policy d'insertion pour les clients
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'missions' 
    AND policyname = 'clients_can_create_missions'
  ) THEN
    CREATE POLICY "clients_can_create_missions"
    ON public.missions
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = client_id
    );
  END IF;
END $$;
```

## Test rapide

Après avoir appliqué une solution, testez dans l'app:

1. Allez sur l'écran d'accueil client
2. Appuyez sur "Demander un artisan"
3. Remplissez le formulaire
4. Appuyez sur "Envoyer la demande"
5. Vérifiez les logs dans la console

### Logs attendus en cas de succès:
```
📤 Starting mission submission...
[MissionContext] Creating mission...
✅ Mission created: [id]
✅ Demande envoyée !
```

## Débugger dans l'application

Si vous voulez plus de détails, ajoutez temporairement ces logs dans `MissionContext.tsx` (ligne 200):

```typescript
console.log('🔍 Debug mission creation:', {
  userId: user.id,
  userType: user.type,
  category: data.category,
  title: data.title,
  location: data.location,
});
```

## Besoin d'aide supplémentaire ?

Si aucune solution ne fonctionne, envoyez-moi:
1. Les logs de la console de l'application
2. Le résultat des requêtes de diagnostic SQL
3. Le message d'erreur exact
