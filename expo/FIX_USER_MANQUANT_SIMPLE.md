# 🔧 SOLUTION RAPIDE - Utilisateur manquant

## Le problème
L'utilisateur avec l'ID `a52ede25-7947-48cb-9c3b-5ae865a6d8a0` existe dans `auth.users` mais pas dans la table `users`.

## ✅ SOLUTION EN 3 ÉTAPES

### Étape 1: Ouvrir SQL Editor dans Supabase
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche
4. Cliquez sur "New Query"

### Étape 2: Copier-coller ce code SQL

**IMPORTANT**: Changez `v_user_type` à la ligne 10:
- Mettez `'client'` si c'est un client
- Mettez `'artisan'` si c'est un artisan

```sql
DO $$
DECLARE
  v_user_id UUID := 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
  v_email TEXT;
  v_user_type TEXT := 'client'; -- 👈 CHANGEZ ICI: 'client' ou 'artisan'
BEGIN
  -- Récupérer l'email
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;
  
  -- Créer l'utilisateur
  INSERT INTO public.users (id, email, name, user_type, rating, review_count)
  VALUES (
    v_user_id,
    v_email,
    split_part(v_email, '@', 1),
    v_user_type,
    0.00,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Créer le profil
  IF v_user_type = 'client' THEN
    INSERT INTO public.clients (id) VALUES (v_user_id) ON CONFLICT (id) DO NOTHING;
  ELSIF v_user_type = 'artisan' THEN
    INSERT INTO public.artisans (
      id, category, hourly_rate, travel_fee, intervention_radius
    )
    VALUES (
      v_user_id, 'Plombier', 50.00, 25.00, 20
    )
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00, 'EUR')
    ON CONFLICT (artisan_id) DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Utilisateur créé avec succès!';
END $$;
```

### Étape 3: Exécuter et vérifier
1. Cliquez sur "Run" (ou Ctrl+Enter)
2. Vous devriez voir: "Success. No rows returned"
3. Rafraîchissez votre application

## 🔍 Vérification
Pour vérifier que l'utilisateur existe maintenant, exécutez:

```sql
SELECT * FROM users WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
```

Vous devriez voir l'utilisateur avec ses informations.

## 🚨 Si ça ne marche toujours pas

### Option A: Supprimer et recréer le compte
```sql
-- Supprimer l'utilisateur de auth (ATTENTION: va supprimer le compte!)
DELETE FROM auth.users WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
```
Puis reconnectez-vous pour créer un nouveau compte.

### Option B: Vérifier les triggers
Le problème vient peut-être du trigger qui devrait créer automatiquement l'utilisateur. Vérifiez qu'il existe:

```sql
-- Voir tous les triggers sur auth.users
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';
```

## 📞 Besoin d'aide?
Si le problème persiste:
1. Vérifiez les logs dans Supabase Dashboard > Logs
2. Essayez de vous déconnecter complètement et de vous reconnecter
3. Redémarrez votre projet Supabase (Dashboard > Settings > API > Restart)
