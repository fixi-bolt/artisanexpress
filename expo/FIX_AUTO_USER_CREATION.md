# 🔧 CORRECTION : Création automatique des utilisateurs

## ❌ Problème
Les utilisateurs ne sont **PAS créés automatiquement** dans la table `public.users` lors de l'inscription. Le script ChatGPT fonctionne manuellement, mais il faut automatiser ce processus.

## ✅ Solution
Créer un **trigger automatique** qui crée l'utilisateur dans `public.users` dès qu'il s'inscrit dans `auth.users`.

---

## 📋 ÉTAPES À SUIVRE

### 1️⃣ Ouvrir le SQL Editor de Supabase
1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet **ArtisanNow**
3. Clique sur **SQL Editor** dans le menu de gauche

### 2️⃣ Exécuter le script de correction
1. Copie **TOUT** le contenu du fichier `database/fix-auto-user-creation.sql`
2. Colle-le dans le SQL Editor
3. Clique sur **Run** (bouton vert en bas à droite)

### 3️⃣ Vérifier que le trigger est créé
Tu devrais voir ce résultat :

```
trigger_name: on_auth_user_created
event_manipulation: INSERT
event_object_table: users
action_statement: EXECUTE FUNCTION public.handle_new_user()
```

---

## 🧪 TESTER LA CORRECTION

### Option A : Créer un nouveau compte
1. Va dans ton app
2. Crée un nouveau compte avec un **nouvel email** (ex: test2@example.com)
3. L'utilisateur devrait être créé automatiquement

### Option B : Créer manuellement ton utilisateur existant
Si tu veux continuer avec ton compte actuel `a52ede25-7947-48cb-9c3b-5ae865a6d8a0` :

```sql
-- Copie ce code dans le SQL Editor et exécute-le
DO $$
DECLARE
  v_user_id UUID := 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
  v_email TEXT;
  v_user_type TEXT := 'client';  -- Change en 'artisan' si nécessaire
BEGIN
  -- Récupérer l'email de l'utilisateur
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION '❌ Utilisateur introuvable dans auth.users';
  END IF;

  -- Créer l'utilisateur dans public.users
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

  -- Créer le profil selon le type
  IF v_user_type = 'client' THEN
    INSERT INTO public.clients (id)
    VALUES (v_user_id)
    ON CONFLICT (id) DO NOTHING;
    
  ELSIF v_user_type = 'artisan' THEN
    INSERT INTO public.artisans (id, category, hourly_rate, travel_fee, intervention_radius)
    VALUES (v_user_id, 'Plombier', 50.00, 25.00, 20)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00, 'EUR')
    ON CONFLICT (artisan_id) DO NOTHING;
  END IF;

  RAISE NOTICE '✅ Utilisateur créé : % (%)', v_email, v_user_type;
END $$;
```

### Vérifier que l'utilisateur existe
```sql
SELECT u.id, u.email, u.user_type, 
       c.id IS NOT NULL AS is_client, 
       a.id IS NOT NULL AS is_artisan
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
LEFT JOIN public.artisans a ON u.id = a.id
WHERE u.id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
```

---

## 🎯 CE QUI VA CHANGER

### Avant (❌ Problème)
1. Utilisateur s'inscrit via `supabase.auth.signUp()`
2. Compte créé dans `auth.users` ✅
3. **Code manuel** doit créer l'utilisateur dans `public.users` ❌
4. Si le code échoue → utilisateur fantôme ❌

### Après (✅ Solution)
1. Utilisateur s'inscrit via `supabase.auth.signUp()`
2. Compte créé dans `auth.users` ✅
3. **Trigger automatique** crée l'utilisateur dans `public.users` ✅
4. Plus de problème de synchronisation ✅

---

## ⚠️ NOTES IMPORTANTES

1. **Le trigger ne crée QUE la ligne dans `users`**
   - Il faut toujours créer `clients` ou `artisans` manuellement dans le code
   - Le trigger évite juste le problème "User not found"

2. **Redémarrer le projet Supabase**
   - Va dans Settings > General
   - Clique sur "Restart project"
   - Attends 2-3 minutes

3. **Le code existant continue de fonctionner**
   - Le hook `useSupabaseAuth.ts` continue de créer les profils
   - Le trigger évite juste les utilisateurs "fantômes"

---

## 🐛 PROBLÈMES POSSIBLES

### "permission denied for schema auth"
→ Le trigger nécessite des permissions spéciales. Utilise `SECURITY DEFINER` dans la fonction.

### "trigger already exists"
→ Le script DROP le trigger avant de le recréer. Pas de problème.

### "User profile not found" après signup
→ Attends 30 secondes et recharge l'app. Le trigger peut prendre quelques secondes.

---

## 📞 BESOIN D'AIDE ?
Si ça ne fonctionne toujours pas :
1. Vérifie les logs dans Supabase : **Database > Logs**
2. Vérifie que le trigger existe : **Database > Triggers**
3. Redémarre le projet Supabase
