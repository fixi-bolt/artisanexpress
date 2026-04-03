# ⚡ Actions immédiates à faire maintenant

## 🎯 Problème constaté
> "Les interfaces Client et Artisan sont identiques"

## ✅ La vérité
**Vos interfaces sont déjà différentes !** Le problème vient probablement de la base de données.

---

## 📋 ÉTAPES À SUIVRE (dans l'ordre)

### 1️⃣ Vérifier la base de données

**Ouvrez Supabase Dashboard :**
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu latéral
4. Cliquez sur **+ New query**

**Copiez-collez cette requête simple :**
```sql
SELECT 
  u.email,
  u.user_type,
  c.id IS NOT NULL AS a_profil_client,
  a.id IS NOT NULL AS a_profil_artisan
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
LEFT JOIN public.artisans a ON u.id = a.id
ORDER BY u.created_at DESC;
```

**Cliquez sur "Run"**

**Analysez les résultats :**
- ✅ Si vous voyez des `user_type` = "client" et d'autres = "artisan" → C'est bon !
- ⚠️ Si tous sont "client" ou tous "artisan" → C'est le problème
- ⚠️ Si certains n'ont pas de profil associé → Il faut corriger

---

### 2️⃣ Corriger automatiquement les profils

**Dans le même SQL Editor, copiez le contenu du fichier :**
`database/check-and-fix-user-types.sql`

**Ce script va :**
- 🔍 Analyser tous les utilisateurs
- ⚠️ Détecter les problèmes
- 🔧 Créer automatiquement les profils manquants
- ✅ Afficher un rapport final

**Cliquez sur "Run"**

---

### 3️⃣ Tester avec deux comptes

#### Option A : Créer 2 nouveaux comptes de test

Dans votre app :

1. **Créez un compte CLIENT :**
   - Déconnectez-vous
   - Cliquez sur "Commencer"
   - Choisissez "Je suis un Client"
   - Email : `client-test@test.com`
   - Mot de passe : `TestClient123!`
   - **Résultat attendu :** Interface **BLEUE** avec recherche d'artisans

2. **Créez un compte ARTISAN :**
   - Déconnectez-vous
   - Cliquez sur "Commencer"
   - Choisissez "Je suis un Artisan"
   - Email : `artisan-test@test.com`
   - Mot de passe : `TestArtisan123!`
   - Catégorie : `Plombier`
   - **Résultat attendu :** Interface **ORANGE** avec demandes à accepter

#### Option B : Modifier un utilisateur existant

Si vous voulez changer un utilisateur existant en artisan :

**Dans SQL Editor :**
```sql
-- Remplacez par l'email de l'utilisateur
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = 'votre.email@exemple.com';

  -- Changer en artisan
  UPDATE public.users 
  SET user_type = 'artisan' 
  WHERE id = v_user_id;

  -- Supprimer l'ancien profil client
  DELETE FROM public.clients WHERE id = v_user_id;

  -- Créer le profil artisan
  INSERT INTO public.artisans (id, category, hourly_rate, travel_fee, intervention_radius)
  VALUES (v_user_id, 'Plombier', 50.00, 25.00, 20)
  ON CONFLICT (id) DO NOTHING;

  -- Créer le wallet
  INSERT INTO public.wallets (artisan_id, balance, currency)
  VALUES (v_user_id, 0.00, 'EUR')
  ON CONFLICT (artisan_id) DO NOTHING;

  RAISE NOTICE 'Utilisateur converti en artisan !';
END $$;
```

---

### 4️⃣ Vérifier les différences

Après connexion, vous devriez voir :

#### Interface CLIENT 👤
```
┌─────────────────────────────┐
│ 🗺️ CARTE AVEC ARTISANS     │
│                             │
│ Bonjour, [Nom]              │
│ [🔍 Rechercher un artisan]  │
│                             │
│ 🔧 Plombier  ⚡ Électricien │
│ 🔒 Serrurier 🏠 Peintre    │
│                             │
│ [✨ Assistant IA]           │
└─────────────────────────────┘
Navigation : 📍 Carte | ⏰ Missions | 👤 Profil
Couleur : BLEU 🔵
```

#### Interface ARTISAN 🔧
```
┌─────────────────────────────┐
│ 💼 DEMANDES À ACCEPTER      │
│                             │
│ Bonjour, [Nom]              │
│ 🟢 Disponible               │
│                             │
│ [Nouvelle demande]          │
│ Fuite d'eau urgente         │
│ 📍 15 rue de Paris          │
│ 💰 80€   [✅ Accepter]      │
└─────────────────────────────┘
Navigation : 💼 Missions | 💰 Revenus | 👤 Profil
Couleur : ORANGE 🟠
```

---

### 5️⃣ Si vous ne voyez toujours pas la différence

**Ajoutez temporairement le composant de debug :**

#### Dans `app/(client)/home.tsx`, ajoutez en haut :
```typescript
import { DebugUserInfo } from '@/components/DebugUserInfo';

// Dans le JSX, juste après <View style={styles.container}>
<DebugUserInfo />
```

#### Dans `app/(artisan)/dashboard.tsx`, ajoutez en haut :
```typescript
import { DebugUserInfo } from '@/components/DebugUserInfo';

// Dans le JSX, juste après <View style={styles.container}>
<DebugUserInfo />
```

**Ce composant affiche :**
```
┌────────────────────────────┐
│ 🔧 ARTISAN                 │
│ artisan@test.com           │
│ Jean Dupont                │
│ ID: 972f58ff...            │
└────────────────────────────┘
```

Si vous voyez **"ARTISAN"** sur la page avec des artisans à rechercher → Problème !
Si vous voyez **"CLIENT"** sur la page avec des demandes à accepter → Problème !

---

## 🎯 Checklist rapide

Cochez au fur et à mesure :

- [ ] J'ai vérifié les `user_type` dans Supabase
- [ ] J'ai exécuté le script de correction
- [ ] J'ai créé 2 comptes de test (1 client + 1 artisan) OU j'ai modifié un existant
- [ ] Je vois l'interface BLEUE pour le client
- [ ] Je vois l'interface ORANGE pour l'artisan
- [ ] Les onglets sont différents
- [ ] Les fonctionnalités sont différentes

---

## 📚 Documentation complète

Si vous voulez plus de détails :

1. **Différences détaillées :** `DIFFERENCES_CLIENT_ARTISAN.md`
2. **Guide de correction :** `FIX_USER_TYPES.md`
3. **Script SQL :** `database/check-and-fix-user-types.sql`

---

## 🆘 En cas de blocage

Vérifiez dans la console de l'app :

```javascript
console.log('User type:', user.type);
console.log('Is Client:', isClient);
console.log('Is Artisan:', isArtisan);
```

Ces valeurs doivent correspondre au type dans Supabase.

---

## ✨ Résultat final attendu

Vous devez avoir **deux applications complètement différentes** :

### 📱 App CLIENT (Bleu)
- Rechercher un artisan
- Créer une demande
- Suivre sur une carte
- Payer dans l'app
- Noter l'artisan

### 🔧 App ARTISAN (Orange)
- Voir les demandes
- Accepter une mission
- Naviguer vers le client
- Compléter l'intervention
- Recevoir le paiement

**C'est comme Uber Client vs Uber Driver !** 🚗

---

## 🚀 Commencez maintenant !

**→ Étape 1 :** Ouvrez Supabase Dashboard  
**→ Étape 2 :** SQL Editor  
**→ Étape 3 :** Copiez la première requête ci-dessus  
**→ Étape 4 :** Run  

**Bonne chance ! 🎉**
