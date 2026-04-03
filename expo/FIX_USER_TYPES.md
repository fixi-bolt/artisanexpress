# 🔧 Guide pour vérifier et corriger les types d'utilisateurs

## Problème constaté
Les interfaces Client et Artisan apparaissent identiques pour certains utilisateurs.

## Cause probable
Le champ `user_type` dans la base de données n'est pas correctement défini, ou les profils associés (clients/artisans) ne sont pas créés.

## Solution étape par étape

### 1️⃣ Exécutez le script de vérification

Allez dans **Supabase Dashboard** → **SQL Editor** → Créez une nouvelle requête et collez :

```sql
-- Copier/coller le contenu de database/check-and-fix-user-types.sql
```

### 2️⃣ Analysez les résultats

Le script va vous montrer :
- ✅ La liste complète des utilisateurs avec leurs types
- ⚠️ Les incohérences détectées (profils manquants, types incorrects)
- 🔧 Les corrections automatiques appliquées
- 📊 Les statistiques finales

### 3️⃣ Vérifications manuelles pour un utilisateur spécifique

Si vous voulez vérifier un utilisateur en particulier :

```sql
-- Remplacez l'email par celui de l'utilisateur
SELECT 
  u.id,
  u.email,
  u.user_type,
  c.id IS NOT NULL AS a_profil_client,
  a.id IS NOT NULL AS a_profil_artisan
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
LEFT JOIN public.artisans a ON u.id = a.id
WHERE u.email = 'email@exemple.com';
```

### 4️⃣ Forcer le type d'un utilisateur spécifique

Si un utilisateur a le mauvais type :

#### Pour forcer en CLIENT :
```sql
-- Remplacez l'ID
UPDATE public.users 
SET user_type = 'client' 
WHERE id = 'USER_ID_ICI';

-- Créer le profil client
INSERT INTO public.clients (id)
VALUES ('USER_ID_ICI')
ON CONFLICT (id) DO NOTHING;

-- Supprimer le profil artisan si existe
DELETE FROM public.artisans WHERE id = 'USER_ID_ICI';
DELETE FROM public.wallets WHERE artisan_id = 'USER_ID_ICI';
```

#### Pour forcer en ARTISAN :
```sql
-- Remplacez l'ID
UPDATE public.users 
SET user_type = 'artisan' 
WHERE id = 'USER_ID_ICI';

-- Créer le profil artisan
INSERT INTO public.artisans (id, category, hourly_rate, travel_fee, intervention_radius)
VALUES ('USER_ID_ICI', 'Plombier', 50.00, 25.00, 20)
ON CONFLICT (id) DO NOTHING;

-- Créer le wallet
INSERT INTO public.wallets (artisan_id, balance, currency)
VALUES ('USER_ID_ICI', 0.00, 'EUR')
ON CONFLICT (artisan_id) DO NOTHING;

-- Supprimer le profil client si existe
DELETE FROM public.clients WHERE id = 'USER_ID_ICI';
```

### 5️⃣ Tester après correction

1. **Déconnectez l'utilisateur** de l'application
2. **Reconnectez-vous**
3. **Vérifiez que vous arrivez sur la bonne interface** :
   - Client → `/client/home` avec onglets : Carte, Missions, Profil
   - Artisan → `/artisan/dashboard` avec onglets : Missions, Revenus, Profil

## Différences entre les deux interfaces

### Interface CLIENT (`/client`)
- 🗺️ **Home** : Carte avec catégories d'artisans
- 📋 **Missions** : Suivi des demandes en cours
- 👤 **Profil** : Paramètres client, moyens de paiement
- 🎨 **Couleur principale** : Bleu (`Colors.primary`)

### Interface ARTISAN (`/artisan`)
- 💼 **Dashboard** : Nouvelles demandes à accepter
- 💰 **Revenus** : Gains, wallet, historique
- 👤 **Profil** : Paramètres artisan, tarifs, disponibilité
- 🎨 **Couleur principale** : Orange (`Colors.secondary`)

## Vérification dans le code

La redirection basée sur le rôle est gérée dans :

1. **app/index.tsx** (ligne 19) :
```typescript
router.replace(isClient ? '/(client)/home' : '/(artisan)/dashboard');
```

2. **app/auth.tsx** (lignes 43-52) :
```typescript
if (user.type === 'admin') {
  router.replace('/(admin)/dashboard');
} else if (user.type === 'client') {
  router.replace('/(client)/home');
} else {
  router.replace('/(artisan)/dashboard');
}
```

## Si le problème persiste

1. **Vérifiez le cache de l'app** : Redémarrez complètement l'application
2. **Vérifiez les logs** : Regardez la console pour voir `user.type`
3. **Testez avec un nouvel utilisateur** : Créez un nouveau compte client et un nouveau compte artisan
4. **Vérifiez le trigger** : Assurez-vous que le trigger `on_auth_user_created` fonctionne

```sql
-- Vérifier que le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```
