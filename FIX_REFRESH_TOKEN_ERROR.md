# 🔧 Correction de l'erreur "Invalid Refresh Token"

## ❌ Le problème
L'erreur **"AuthApiError: Invalid Refresh Token: Refresh Token Not Found"** survient lorsque l'application essaie d'utiliser un token de rafraîchissement qui n'existe plus dans Supabase.

Causes courantes :
- Session expirée ou supprimée dans Supabase
- Données de session corrompues dans AsyncStorage
- L'utilisateur a été supprimé puis recréé
- Conflit entre plusieurs sessions

---

## ✅ Solutions appliquées

### 1. **Nettoyage automatique de l'auth state**

J'ai créé une fonction utilitaire qui nettoie toutes les données d'authentification :

📁 `utils/clearAuthState.ts`
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export async function clearAuthState() {
  // Sign out locally
  await supabase.auth.signOut({ scope: 'local' });
  
  // Clear all auth-related keys from AsyncStorage
  const allKeys = await AsyncStorage.getAllKeys();
  const authKeys = allKeys.filter(key => 
    key.includes('supabase') || 
    key.includes('auth') ||
    key.includes('sb-')
  );
  
  await AsyncStorage.multiRemove(authKeys);
}
```

### 2. **Gestion des erreurs de session dans AuthContext**

Le contexte détecte maintenant automatiquement les erreurs de refresh token :

```typescript
supabase.auth.getSession()
  .catch(async (error) => {
    // Détection automatique des erreurs de token
    if (error?.message?.includes('refresh') || error?.message?.includes('token')) {
      await clearAuthState();
    }
    
    // Reset de l'état
    setSession(null);
    setUser(null);
  });
```

### 3. **Composant AuthErrorHandler**

Un composant visuel qui détecte et affiche les erreurs d'authentification avec un bouton de réinitialisation :

📁 `components/AuthErrorHandler.tsx`

- ✅ Détection automatique des erreurs de session
- ✅ Affichage d'un message clair à l'utilisateur
- ✅ Bouton pour nettoyer manuellement la session
- ✅ Position en overlay pour être toujours visible

---

## 🚀 Comment utiliser

### Option 1 : Nettoyage automatique
Le système détecte et nettoie automatiquement les sessions invalides. **Aucune action requise**.

### Option 2 : Nettoyage manuel dans l'app
Si une erreur persiste, un message apparaîtra en haut de l'écran avec un bouton **"Réinitialiser"**.

### Option 3 : Nettoyage via console (Dev)
Dans la console de développement, exécutez :
```javascript
import { clearAuthState } from '@/utils/clearAuthState';
await clearAuthState();
```

---

## 🧪 Test de la solution

1. **Simuler l'erreur** (uniquement pour test) :
   - Connectez-vous à l'application
   - Allez dans Supabase Dashboard > Authentication > Users
   - Supprimez la session de l'utilisateur connecté
   - L'app détectera automatiquement le problème

2. **Vérifier la correction** :
   - Le message d'erreur apparaît en haut de l'écran
   - Cliquez sur "Réinitialiser"
   - L'app se reconnecte proprement

---

## 📋 Checklist de debug

Si le problème persiste :

- [ ] Vérifier que l'utilisateur existe dans Supabase
- [ ] Vérifier la configuration RLS dans Supabase
- [ ] Vérifier que les tables `users`, `artisans`, `clients` ont les bonnes données
- [ ] Essayer de se déconnecter complètement puis se reconnecter
- [ ] Vider le cache de l'app (AsyncStorage)
- [ ] Redémarrer Metro bundler

---

## 🔍 Logs à surveiller

Dans la console, vous verrez maintenant :
```
🔵 Loading user profile for ID: xxx
✅ User data fetched: user@email.com artisan
✅ User profile fully loaded: John Doe artisan
```

En cas d'erreur de token :
```
❌ Error getting session: Invalid Refresh Token
🔄 Invalid session detected, clearing auth state...
✅ Auth state cleared successfully
```

---

## 💡 Prévention future

Pour éviter ce problème :
1. Ne jamais supprimer un utilisateur dans Supabase sans nettoyer l'app
2. Utiliser la fonction `logout()` du AuthContext pour se déconnecter proprement
3. Ne pas manipuler directement AsyncStorage pour les données d'auth
4. Respecter les TTL des sessions Supabase (configurable dans les paramètres)

---

## 🆘 Si rien ne fonctionne

**Solution radicale** : Réinitialiser complètement l'application

### Sur mobile (Expo Go) :
1. Fermez l'app complètement
2. Supprimez l'app Expo Go
3. Réinstallez Expo Go
4. Scannez à nouveau le QR code

### En développement :
```bash
# Nettoyer Metro bundler
rm -rf node_modules/.cache
npx expo start -c

# Nettoyer AsyncStorage (dans l'app)
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

---

✅ **La correction est maintenant active dans l'application !**
