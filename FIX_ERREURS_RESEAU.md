# 🔧 Guide de résolution des erreurs réseau Supabase

## ❌ Erreurs rencontrées
```
❌ Supabase fetch error: Network request failed
❌ Error signing in: Erreur de connexion
❌ Supabase connection test failed
Type: TypeError
```

## 🎯 Solutions appliquées

### 1. ✅ Amélioration du client Supabase (`lib/supabase.ts`)

Les modifications suivantes ont été apportées:
- ✅ Ajout de `flowType: 'pkce'` pour une meilleure sécurité
- ✅ Augmentation du timeout de 15s à 30s
- ✅ Ajout des headers `apikey` dans toutes les requêtes
- ✅ Meilleurs logs de diagnostic
- ✅ Messages d'erreur plus clairs en français

### 2. ✅ Amélioration des outils de diagnostic (`utils/networkDiagnostics.ts`)

Nouveaux outils disponibles:
- ✅ `testBasicConnectivity()` - Test de connexion Internet basique
- ✅ `testSupabaseConnection()` - Test spécifique à Supabase
- ✅ `runFullDiagnostic()` - Diagnostic complet avec rapports détaillés

### 3. ✅ Interface de test améliorée (`components/ConnectionTest.tsx`)

Nouvelle interface affichant:
- ✅ Status de la connexion Internet
- ✅ Status de la connexion Supabase
- ✅ Informations système détaillées
- ✅ Messages d'erreur détaillés avec suggestions

## 🔍 Comment diagnostiquer le problème

### Étape 1: Lancer le diagnostic réseau

1. Ouvrez l'application
2. Naviguez vers `/connection-test` (si accessible)
3. Ou exécutez dans la console:
```javascript
import { runFullDiagnostic } from '@/utils/networkDiagnostics';
runFullDiagnostic();
```

### Étape 2: Analyser les résultats

Le diagnostic vous dira:
- ✅ **Internet: ✅** → Connexion Internet OK
- ✅ **Supabase: ✅** → Connexion Supabase OK
- ❌ **Internet: ❌** → Pas de connexion Internet
- ❌ **Supabase: ❌** → Problème avec Supabase

## 🛠️ Solutions selon le problème détecté

### Cas 1: ❌ Pas de connexion Internet

**Solution:**
1. Vérifiez votre connexion WiFi ou données mobiles
2. Essayez de recharger une page web dans Safari/Chrome
3. Redémarrez votre routeur WiFi
4. Activez/désactivez le mode avion

### Cas 2: ✅ Internet OK, ❌ Supabase KO

C'est le problème le plus probable. Voici les solutions:

#### A. Vérifier la configuration Supabase

1. **Ouvrez le Dashboard Supabase** (https://app.supabase.com)
2. **Allez dans Settings → API**
3. **Vérifiez:**
   - URL du projet: `https://mxlxwqhkodgixztnydzd.supabase.co`
   - Clé anon/public (commence par `eyJhbG...`)
   
4. **Copiez les valeurs et comparez avec `.env`**

#### B. Configurer les CORS

1. **Dans le Dashboard Supabase**
2. **Settings → API → CORS**
3. **Ajoutez ces origines:**
   ```
   http://localhost:*
   https://localhost:*
   http://192.168.*.*:*
   capacitor://localhost
   ```
4. **Si sur le web, ajoutez aussi votre domaine**

#### C. Vérifier les politiques RLS

Les politiques RLS (Row Level Security) peuvent bloquer les requêtes.

**Option 1: Diagnostic rapide**
1. Ouvrez le SQL Editor dans Supabase
2. Collez le fichier `database/FIX_NETWORK_ERRORS.sql`
3. Exécutez-le pour voir les diagnostics

**Option 2: Désactiver temporairement RLS (⚠️ TESTS UNIQUEMENT)**
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE artisans DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE missions DISABLE ROW LEVEL SECURITY;
```

⚠️ **IMPORTANT:** Ne laissez JAMAIS RLS désactivé en production!

#### D. Vérifier les variables d'environnement

1. **Ouvrez `.env`**
2. **Vérifiez ces lignes:**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://mxlxwqhkodgixztnydzd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Si modifiées, redémarrez complètement:**
```bash
# Arrêtez le serveur (Ctrl+C)
# Nettoyez le cache
rm -rf node_modules/.cache
# Redémarrez
bun expo start --clear
```

#### E. Problèmes réseau spécifiques

**Si sur mobile (iOS/Android):**
1. Assurez-vous d'être sur le même réseau WiFi que votre ordinateur
2. Vérifiez que votre firewall n'bloque pas les connexions
3. Essayez de désactiver le VPN si actif

**Si sur Web:**
1. Ouvrez la console (F12)
2. Regardez l'onglet Network
3. Cherchez les requêtes vers Supabase
4. Vérifiez s'il y a des erreurs CORS

**Si sur simulateur:**
1. Le simulateur iOS/Android peut avoir des problèmes réseau
2. Testez sur un appareil réel
3. Redémarrez le simulateur

## 🔄 Procédure de redémarrage complet

Si rien ne fonctionne, suivez cette procédure:

```bash
# 1. Arrêter tous les processus
# Ctrl+C dans le terminal

# 2. Nettoyer complètement
rm -rf node_modules/.cache
rm -rf .expo

# 3. Redémarrer avec cache vidé
bun expo start --clear

# 4. Si toujours des problèmes, réinstaller les dépendances
rm -rf node_modules
bun install
bun expo start --clear
```

## 📊 Vérification du status Supabase

1. **Allez sur:** https://status.supabase.com/
2. **Vérifiez que tous les services sont opérationnels**
3. **Si un service est down, attendez qu'il soit rétabli**

## 🧪 Test de connexion directe

Pour tester si Supabase est accessible, ouvrez dans votre navigateur:
```
https://mxlxwqhkodgixztnydzd.supabase.co/rest/v1/
```

**Réponses possibles:**
- ✅ `{"message": "..."}` → Supabase accessible
- ❌ Page ne charge pas → Problème de connexion/firewall
- ❌ Erreur 401/403 → Problème d'authentification (normal sans clé)

## 📝 Script SQL de diagnostic

Un script SQL complet est disponible dans:
```
database/FIX_NETWORK_ERRORS.sql
```

**Pour l'utiliser:**
1. Ouvrez le SQL Editor dans Supabase
2. Copiez-collez le contenu du fichier
3. Exécutez le script
4. Lisez les résultats et suivez les recommandations

## ⚡ Solution rapide (Quick Fix)

Si vous êtes pressé et que le problème persiste:

1. **Vérifiez que vous avez Internet** → Ouvrez Google
2. **Vérifiez l'URL Supabase** → Ouvrez-la dans le navigateur
3. **Copiez les nouvelles clés** depuis le Dashboard Supabase
4. **Collez dans `.env`**
5. **Redémarrez:** `bun expo start --clear`

## 🆘 Toujours bloqué?

Si après toutes ces étapes le problème persiste:

1. **Vérifiez les logs de la console**
   - Cherchez les messages détaillés
   - Notez les URLs et erreurs exactes

2. **Testez la connexion basique:**
```javascript
// Dans la console de l'app
fetch('https://mxlxwqhkodgixztnydzd.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'VOTRE_CLE_ICI',
    'Authorization': 'Bearer VOTRE_CLE_ICI'
  }
})
.then(r => console.log('✅ OK:', r.status))
.catch(e => console.error('❌ Error:', e))
```

3. **Créez un nouveau projet Supabase**
   - Parfois, recréer le projet résout les problèmes
   - Exportez vos données d'abord
   - Créez un nouveau projet
   - Mettez à jour les clés dans `.env`

## 📞 Support

Si le problème persiste après toutes ces étapes, contactez le support avec:
- ✅ Les logs de la console
- ✅ Les résultats du diagnostic réseau
- ✅ Votre configuration (OS, appareil, réseau)
- ✅ Les étapes déjà tentées
