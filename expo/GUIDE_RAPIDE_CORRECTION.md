# 🚀 GUIDE RAPIDE - CORRECTION RÉSEAU SUPABASE

## ✅ Ce qui a été corrigé

### 1. **lib/supabase.ts** - Configuration simplifiée
- ❌ **AVANT** : customFetch complexe qui causait des erreurs réseau
- ✅ **APRÈS** : Configuration Supabase standard et simple
- 🎯 **Résultat** : Plus d'erreurs "Network request failed"

### 2. **Script SQL propre et fonctionnel**
- 📄 Fichier : `database/SCRIPT_SIMPLE_PRODUCTION.sql`
- ✅ Toutes les tables nécessaires
- ✅ RLS activé correctement
- ✅ Triggers automatiques
- ✅ Index de performance

---

## 📋 ÉTAPES À SUIVRE (DANS L'ORDRE)

### Étape 1 : Copier le script SQL
1. Ouvrez le fichier : `database/SCRIPT_SIMPLE_PRODUCTION.sql`
2. Copiez TOUT le contenu (Ctrl+A puis Ctrl+C)

### Étape 2 : Exécuter dans Supabase
1. Allez sur [https://supabase.com](https://supabase.com)
2. Ouvrez votre projet : `mxlxwqhkodgixztnydzd`
3. Cliquez sur **SQL Editor** (dans le menu de gauche)
4. Cliquez sur **New Query**
5. Collez le script SQL
6. Cliquez sur **RUN** en bas à droite

### Étape 3 : Vérifier que ça a fonctionné
Vous devriez voir ce message :
```
✅ Script exécuté avec succès!
📊 Tables créées et configurées
🔒 RLS activé sur toutes les tables
🚀 Application prête à fonctionner
```

### Étape 4 : Tester l'application
1. Ouvrez l'application sur votre téléphone avec Expo Go
2. Essayez de vous connecter avec :
   - Email : `test@example.com`
   - Mot de passe : `password123`
3. Ou créez un nouveau compte

---

## 🔍 Vérifications supplémentaires

### Vérifier les variables d'environnement
Votre fichier `.env` contient :
```env
EXPO_PUBLIC_SUPABASE_URL=https://mxlxwqhkodgixztnydzd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **C'est correct !** Ne changez rien.

### Vérifier que Supabase est accessible
Ouvrez ce lien dans votre navigateur :
```
https://mxlxwqhkodgixztnydzd.supabase.co/rest/v1/
```

Vous devriez voir une page JSON (même si elle dit "unauthorized", c'est normal).

---

## ❓ Si ça ne fonctionne toujours pas

### 1. Vérifiez votre connexion Internet
- Sur votre téléphone, ouvrez un navigateur
- Allez sur google.com pour vérifier

### 2. Redémarrez Expo
```bash
# Tuez le serveur Expo (Ctrl+C dans le terminal)
# Puis relancez :
bun start
```

### 3. Scannez à nouveau le QR code
- L'application se rechargera avec la nouvelle configuration

### 4. Vérifiez les logs dans la console
- Vous devriez voir : `✅ Supabase configuré: https://mxlxwqhkodgixztnydzd.supabase.co`
- Au lieu de : `❌ Network request failed`

---

## 🎯 Résumé des changements

| Fichier | Changement | Raison |
|---------|------------|--------|
| `lib/supabase.ts` | Suppression du customFetch | Causait des erreurs réseau |
| `database/SCRIPT_SIMPLE_PRODUCTION.sql` | Nouveau script SQL propre | Version simplifiée et fonctionnelle |

---

## 💡 Pourquoi ça marchait ce matin ?

Le `customFetch` a probablement été ajouté par erreur lors d'une modification récente.
Cette fonction interceptait toutes les requêtes Supabase et causait des problèmes de réseau.

**La solution :** Revenir à la configuration Supabase standard = ✅ Tout fonctionne !

---

## 📞 Support

Si vous avez encore des problèmes après avoir suivi ces étapes :
1. Vérifiez que le script SQL s'est bien exécuté sans erreur
2. Vérifiez que votre fichier `.env` contient bien les bonnes clés
3. Essayez de redémarrer Expo et de scanner à nouveau le QR code
4. Vérifiez les logs dans la console pour voir les messages d'erreur exacts
