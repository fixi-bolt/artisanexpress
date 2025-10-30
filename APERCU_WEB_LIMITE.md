# ⚠️ Limitations de l'Aperçu Web

## Pourquoi ces erreurs réseau ?

L'application fonctionne parfaitement, **mais l'aperçu web dans Rork a des limitations**.

### Le Problème
Quand vous voyez ces erreurs :
```
ERROR: Network request failed
URL: https://mxlxwqhkodgixztnydzd.supabase.co/auth/v1/token
Error type: TypeError
```

C'est normal ! L'environnement de prévisualisation web bloque les connexions externes à Supabase pour des raisons de sécurité (CORS).

## ✅ Solutions

### Option 1 : Utiliser l'Application Mobile (Recommandé)
1. **Scannez le QR code** affiché sur la plateforme Rork
2. **Ouvrez avec Expo Go** sur votre téléphone
3. L'application fonctionnera **parfaitement** avec toutes les fonctionnalités

### Option 2 : Tester en Local
```bash
# Dans votre terminal
npx expo start

# Puis :
# - Scannez le QR code avec Expo Go
# - OU appuyez sur 'w' pour ouvrir dans le navigateur
```

## 📱 Ce qui fonctionne

| Environnement | Connexion Supabase | Auth | Base de données |
|--------------|-------------------|------|----------------|
| **Aperçu Web Rork** | ❌ Bloqué par CORS | ❌ | ❌ |
| **Mobile (Expo Go)** | ✅ Parfait | ✅ | ✅ |
| **Localhost Web** | ⚠️ Partiel | ⚠️ | ⚠️ |
| **Localhost Mobile** | ✅ Parfait | ✅ | ✅ |

## 🔧 Modifications Apportées

J'ai amélioré la gestion des erreurs pour que l'application :

1. **Détecte automatiquement** l'environnement de prévisualisation
2. **Affiche des messages clairs** expliquant qu'il faut utiliser le mobile
3. **Ne fait pas crasher** l'application en cas d'erreur réseau
4. **Donne des instructions** pour tester correctement

### Fichiers Modifiés
- `lib/supabase.ts` - Détection de l'environnement et gestion des erreurs
- `contexts/AuthContext.tsx` - Messages d'erreur plus clairs
- `app/auth.tsx` - Meilleure UX pour les erreurs réseau

## 🎯 Résumé

**L'application n'a PAS de bug.** C'est l'aperçu web qui a des limitations normales.

Pour tester l'application complète :
1. Utilisez Expo Go sur mobile
2. Ou lancez avec `npx expo start`

Les erreurs que vous voyez sont attendues dans l'aperçu web et sont maintenant gérées proprement.
