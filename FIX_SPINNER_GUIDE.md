# 🚨 FIX: Application bloquée sur le spinner

## Problème
L'application reste bloquée indéfiniment sur l'écran de chargement (spinner).

## Causes identifiées
1. ❌ Table `subscriptions` manquante → erreur SQL
2. ❌ Profils artisans incomplets
3. ❌ AuthContext qui ne finit jamais de charger
4. ❌ Wallets manquants pour certains artisans

## ✅ Solutions appliquées

### 1. Correction du AuthContext
**Fichier modifié:** `contexts/AuthContext.tsx`

**Ce qui a été fait:**
- ✅ Ajout d'un timeout de 8 secondes pour forcer l'initialisation
- ✅ Protection contre les chargements infinis
- ✅ Meilleure gestion des erreurs Supabase

**Code clé ajouté:**
```typescript
const timeout = setTimeout(() => {
  if (mounted && !isInitialized) {
    logger.warn('⏱️  Auth initialization timeout - forcing ready state');
    setIsLoading(false);
    setIsInitialized(true);
  }
}, 8000);
```

### 2. Script SQL pour Supabase
**Fichier:** `database/FIX_SPINNER_BLOQUE.sql`

**Ce script corrige:**
- ✅ Crée la table `subscriptions` manquante
- ✅ Crée les profils artisans manquants
- ✅ Crée les wallets manquants
- ✅ Crée les profils clients manquants
- ✅ Configure les politiques RLS correctement
- ✅ Génère un rapport complet

## 🎯 ÉTAPES À SUIVRE (dans l'ordre)

### Étape 1: Exécuter le script SQL
1. Ouvrez **Supabase Dashboard** → https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **"+ New Query"**
5. Copiez TOUT le contenu de `database/FIX_SPINNER_BLOQUE.sql`
6. Collez-le dans l'éditeur
7. Cliquez sur **"Run"** (ou Ctrl+Enter)
8. ✅ Vérifiez que vous voyez "✅ CORRECTION TERMINÉE !" dans les logs

### Étape 2: Vérifier la configuration
1. Ouvrez le fichier `.env` à la racine du projet
2. Vérifiez que ces variables existent et sont correctes:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anonyme
   ```
3. Si elles sont vides ou incorrectes, allez sur Supabase Dashboard → Settings → API

### Étape 3: Redémarrer l'application
1. Arrêtez l'application (Ctrl+C dans le terminal)
2. Supprimez le cache:
   ```bash
   rm -rf node_modules/.cache
   ```
3. Relancez:
   ```bash
   bun start --clear
   ```

### Étape 4: Tester la connexion
1. Appuyez sur **R** dans le terminal pour recharger l'app
2. L'app devrait maintenant se charger en moins de 8 secondes
3. Si vous n'êtes pas connecté, vous verrez l'écran d'accueil
4. Si vous êtes connecté, vous serez redirigé vers votre dashboard

## 🐛 Si le problème persiste

### Vérification 1: Console logs
Ouvrez les outils de développement et regardez la console:
- ⏱️ Si vous voyez "Auth initialization timeout" → Normal, l'app force le chargement
- ❌ Si vous voyez des erreurs SQL → Rejouez le script SQL
- 🔵 Si vous voyez "Loading user profile for ID" → Le chargement fonctionne

### Vérification 2: Supabase Dashboard
1. Allez dans **Table Editor**
2. Vérifiez que ces tables existent:
   - ✅ `users`
   - ✅ `artisans`
   - ✅ `clients`
   - ✅ `subscriptions` ← **IMPORTANT**
   - ✅ `wallets`
3. Ouvrez la table `subscriptions` et vérifiez qu'elle contient des lignes

### Vérification 3: Test de connexion manuel
1. Dans la console de votre navigateur, tapez:
   ```javascript
   fetch('https://votre-projet.supabase.co/rest/v1/subscriptions', {
     headers: {
       'apikey': 'votre-clé-anon',
       'Authorization': 'Bearer votre-clé-anon'
     }
   }).then(r => r.json()).then(console.log)
   ```
2. Si vous voyez `[]` → OK, la table existe
3. Si vous voyez une erreur → La table n'existe pas, rejouez le script

## 📝 Notes techniques

### Timeout de 8 secondes
Le AuthContext force maintenant l'initialisation après 8 secondes maximum. Cela évite:
- Les blocages infinis dus à Supabase qui ne répond pas
- Les erreurs silencieuses qui empêchent la navigation
- Les profils qui ne se chargent pas correctement

### Table subscriptions
Cette table est **obligatoire** pour les artisans. Sans elle:
- ❌ L'app peut crasher au chargement du profil artisan
- ❌ Les requêtes vers `subscriptions` échouent
- ❌ Le spinner reste bloqué

### Protection contre les boucles infinies
Le fichier `app/(artisan)/specialty.tsx` a été corrigé pour:
- ✅ Ne plus appeler `updateUser()` qui recharge le profil
- ✅ Mettre à jour la base directement avec `supabase.from('artisans').update()`
- ✅ Naviguer immédiatement après la sauvegarde

## ✅ Checklist finale

Avant de dire que c'est réglé, vérifiez:
- [ ] Le script SQL s'est exécuté sans erreur
- [ ] Vous voyez "✅ CORRECTION TERMINÉE !" dans les logs SQL
- [ ] Le fichier `.env` contient les bonnes credentials
- [ ] L'app se charge en moins de 8 secondes
- [ ] Vous pouvez naviguer dans l'application
- [ ] La console ne montre pas d'erreurs critiques

## 🆘 Besoin d'aide ?

Si après tout ça le spinner reste bloqué:
1. Envoyez une capture d'écran de la console
2. Envoyez le résultat du script SQL (les logs NOTICE)
3. Vérifiez que votre compte Supabase est bien actif
