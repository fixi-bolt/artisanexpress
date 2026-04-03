# 🚀 Guide de Configuration Supabase pour ArtisanNow

## Étape 1 : Créer le Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous ou créez un compte
3. Créez un nouveau projet
4. Notez votre **URL** et **anon key**

## Étape 2 : Exécuter le Schéma SQL

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez tout le contenu de `database/schema.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **RUN** pour exécuter le script

✅ Cela va créer toutes les tables, index, triggers et politiques RLS

## Étape 3 : Configurer l'Authentification

1. Allez dans **Authentication** > **Settings**
2. Activez **Email Authentication**
3. (Optionnel) Activez **OAuth providers** (Google, Apple, etc.)
4. Configurez les **Email Templates** si nécessaire

## Étape 4 : Insérer les Données de Test

1. Dans **SQL Editor**, exécutez le script `database/seed.sql` (à créer)
2. Ou utilisez la fonction de migration dans l'app

## Étape 5 : Obtenir vos Clés API

1. Allez dans **Settings** > **API**
2. Copiez:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (⚠️ JAMAIS exposer côté client) → `SUPABASE_SERVICE_ROLE_KEY`

## Étape 6 : Mettre à Jour .env

```bash
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Backend uniquement
```

## Étape 7 : Tester la Connexion

Lancez l'app et vérifiez la console :
- ✅ "Supabase connected" = Succès
- ❌ "Supabase credentials missing" = Vérifiez vos variables d'environnement

## 🔐 Sécurité Important

**NE JAMAIS:**
- Exposer `service_role_key` côté client
- Commit les clés dans Git
- Partager vos clés publiquement

**TOUJOURS:**
- Utiliser des variables d'environnement
- Activer Row Level Security (RLS)
- Tester les politiques RLS

## 📚 Ressources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase + React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

## 🆘 Dépannage

### Erreur: "relation does not exist"
→ Le schéma n'a pas été exécuté. Relancez `schema.sql`

### Erreur: "permission denied for table"
→ Problème RLS. Vérifiez que l'utilisateur est authentifié

### Les données ne s'affichent pas
→ Vérifiez les politiques RLS dans **Authentication** > **Policies**
