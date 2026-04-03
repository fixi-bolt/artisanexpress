# 🚀 Quick Start - Intégration Supabase

## ✅ Ce qui a été fait

1. ✅ **Package Supabase installé** (`@supabase/supabase-js`)
2. ✅ **Schéma de base de données créé** (`database/schema.sql`)
3. ✅ **Configuration Supabase** (`lib/supabase.ts`)
4. ✅ **AuthContext migré** - Authentification avec Supabase Auth
5. ✅ **MissionContext migré** - CRUD avec Supabase + Realtime
6. ✅ **Script de seed** (`database/seed.sql`)
7. ✅ **Script de migration** (`scripts/migrate-data.ts`)

## 📝 Prochaines étapes

### 1️⃣ Créer votre projet Supabase (5 min)

```bash
# 1. Allez sur https://supabase.com
# 2. Créez un compte (gratuit)
# 3. Créez un nouveau projet
# 4. Notez votre URL et anon key
```

### 2️⃣ Exécuter le schéma SQL (2 min)

1. Dans Supabase Dashboard → **SQL Editor**
2. Créez une nouvelle query
3. Copiez le contenu de `database/schema.sql`
4. **RUN** pour créer toutes les tables

### 3️⃣ Insérer les données de test (1 min)

**Option A : Via SQL Editor**
1. Créez une nouvelle query
2. Copiez le contenu de `database/seed.sql`
3. **RUN**

**Option B : Via script (recommandé pour production)**
```bash
# Après avoir mis à jour .env avec vos clés
bun run scripts/migrate-data.ts
```

### 4️⃣ Configurer l'authentification (3 min)

1. Dans Supabase → **Authentication** → **Providers**
2. Activez **Email** (activé par défaut)
3. (Optionnel) Activez **Google**, **Apple**, etc.

### 5️⃣ Mettre à jour .env

```bash
# Copiez depuis Supabase Dashboard → Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important**: Utilisez `EXPO_PUBLIC_` pour les variables accessibles côté client

### 6️⃣ Tester l'application

```bash
bun start
```

Vous devriez voir dans la console :
- ✅ `Supabase client initialized`
- ✅ `User profile loaded` (après login)
- ✅ `Missions loaded`

## 🔐 Créer des utilisateurs

### Via Supabase Auth (Recommandé)

L'app utilise maintenant `signUp` et `signIn` :

```typescript
// Inscription
await signUp(
  'user@example.com',
  'password123',
  'John Doe',
  'client' // ou 'artisan'
);

// Connexion
await signIn('user@example.com', 'password123');
```

### Via SQL (Pour tests)

```sql
-- Créer un utilisateur dans auth.users
INSERT INTO auth.users (id, email, encrypted_password)
VALUES (
  'user-id-here',
  'test@example.com',
  crypt('password123', gen_salt('bf'))
);

-- Créer le profil dans users
INSERT INTO users (id, email, name, user_type)
VALUES ('user-id-here', 'test@example.com', 'Test User', 'client');

-- Si client
INSERT INTO clients (id) VALUES ('user-id-here');
```

## 🔄 Realtime activé

Les missions et notifications se mettent à jour automatiquement en temps réel !

```typescript
// Dans MissionContext
// ✅ Les changements de missions se synchronisent automatiquement
// ✅ Les nouvelles notifications apparaissent instantanément
```

## 🆘 Dépannage

### Erreur: "Invalid API key"
→ Vérifiez que `EXPO_PUBLIC_SUPABASE_ANON_KEY` est correct dans .env

### Erreur: "relation does not exist"
→ Exécutez `database/schema.sql` dans Supabase SQL Editor

### Erreur: "permission denied"
→ Vérifiez les Row Level Security policies dans Supabase

### Les données ne s'affichent pas
→ Assurez-vous d'être authentifié et d'avoir des données dans les tables

## 📚 Documentation complète

- `database/SETUP_GUIDE.md` - Guide détaillé de configuration
- `database/schema.sql` - Structure de la base de données
- `database/seed.sql` - Données de test
- `lib/supabase.ts` - Configuration client Supabase

## ✨ Nouveautés

**AuthContext**
- ✅ `signUp(email, password, name, type)` - Inscription
- ✅ `signIn(email, password)` - Connexion
- ✅ `session` - Session Supabase
- ✅ Auto-refresh du token

**MissionContext**
- ✅ Toutes les fonctions sont async
- ✅ Synchronisation temps réel
- ✅ `isLoading` pour les états de chargement
- ✅ `refreshMissions()` - Recharger manuellement
- ✅ `refreshNotifications()` - Recharger les notifications

## 🎯 Prochaine étape

Une fois Supabase configuré, vous pouvez :
- Déployer l'app en production
- Activer les backups automatiques
- Configurer les webhooks
- Ajouter des triggers personnalisés
