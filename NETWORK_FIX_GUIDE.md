# Guide de résolution des erreurs réseau

## Problèmes identifiés

Vous rencontrez les erreurs suivantes :
- ❌ Supabase connection test failed
- Error: Network request failed
- Type: TypeError

## Solutions appliquées

### 1. Amélioration de la gestion des erreurs réseau

**Fichier modifié : `lib/supabase.ts`**

J'ai ajouté :
- Un timeout de 15 secondes pour éviter les connexions qui traînent
- Une meilleure gestion des erreurs réseau avec des messages en français
- Un AbortController pour annuler les requêtes qui prennent trop de temps
- Des logs détaillés pour le débogage

### 2. Outil de diagnostic de connexion

**Nouveaux fichiers :**
- `components/ConnectionTest.tsx` - Composant de test de connexion
- `app/connection-test.tsx` - Écran de test de connexion

Cet outil permet de :
- Tester la connexion à Supabase
- Afficher les informations réseau
- Tester les requêtes à la base de données
- Voir les détails des erreurs

### 3. Intégration dans l'écran d'authentification

L'écran d'authentification (`app/auth.tsx`) propose déjà un bouton "Tester la connexion" quand une erreur réseau se produit.

## Comment utiliser

### Option 1 : Via l'écran d'authentification
1. Essayez de vous connecter
2. Si vous avez une erreur réseau, cliquez sur "Tester la connexion"
3. Suivez les recommandations affichées

### Option 2 : Via l'écran de test dédié
1. Naviguez vers `/connection-test`
2. L'outil testera automatiquement votre connexion
3. Cliquez sur "Tester à nouveau" pour relancer les tests

## Vérifications à effectuer

### 1. Configuration Supabase

Vérifiez que votre `.env` contient :
```
EXPO_PUBLIC_SUPABASE_URL=https://mxlxwqhkodgixztnydzd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
```

### 2. Connexion Internet

- Vérifiez que votre appareil est connecté à Internet
- Testez avec un navigateur web pour confirmer
- Sur simulateur iOS/Android, vérifiez les paramètres réseau

### 3. Configuration Supabase (côté serveur)

Dans votre projet Supabase :
1. Allez dans Settings > API
2. Vérifiez que l'URL et les clés correspondent à celles de votre `.env`
3. Vérifiez que le projet Supabase est actif et non en pause

### 4. Politiques RLS (Row Level Security)

Les politiques RLS peuvent bloquer les requêtes. Vérifiez dans votre dashboard Supabase :
1. Allez dans Authentication > Policies
2. Assurez-vous que les politiques permettent les opérations nécessaires
3. Pour le développement, vous pouvez temporairement désactiver RLS sur certaines tables

## Erreurs courantes et solutions

### "Network request failed"
**Causes possibles :**
- Pas de connexion Internet
- URL Supabase incorrecte
- Firewall bloquant la connexion
- Projet Supabase en pause

**Solutions :**
1. Vérifiez votre connexion Internet
2. Vérifiez l'URL dans `.env`
3. Assurez-vous que le projet Supabase est actif
4. Essayez de redémarrer l'application

### "Connection timeout"
**Causes possibles :**
- Connexion Internet lente
- Serveur Supabase surchargé
- Région Supabase éloignée

**Solutions :**
1. Vérifiez votre vitesse Internet
2. Attendez quelques minutes et réessayez
3. Vérifiez le statut de Supabase sur status.supabase.com

### "Invalid API key"
**Causes possibles :**
- Clé API incorrecte ou expirée
- Clé API non définie

**Solutions :**
1. Vérifiez la clé dans `.env`
2. Récupérez la clé depuis le dashboard Supabase
3. Assurez-vous d'utiliser la clé `anon` et non la clé `service_role`

## Commandes utiles

### Redémarrer l'application
```bash
# Arrêter le serveur
Ctrl+C

# Nettoyer le cache
npx expo start -c
```

### Vérifier les logs
Les logs affichent maintenant des informations détaillées :
- 🔧 Configuration Supabase
- ❌ Erreurs avec détails
- ✅ Succès des opérations

### Tester manuellement Supabase
```bash
curl https://mxlxwqhkodgixztnydzd.supabase.co/rest/v1/ \
  -H "apikey: VOTRE_CLE_ANON"
```

## Support supplémentaire

Si le problème persiste après avoir suivi ce guide :
1. Vérifiez les logs de la console pour des détails supplémentaires
2. Testez sur un autre réseau (4G au lieu de WiFi par exemple)
3. Vérifiez que votre projet Supabase n'a pas de limitations
4. Contactez le support Supabase si le problème vient de leur côté
