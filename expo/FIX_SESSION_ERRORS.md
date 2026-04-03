# 🔧 Guide de Correction des Erreurs de Session

## 🔍 Problèmes Résolus

### 1. ❌ Erreur "Invalid Refresh Token: Refresh Token Not Found"
**Cause :** Session Supabase expirée ou invalide

### 2. ❌ Erreur "Failed to load automation settings SyntaxError"
**Cause :** Données JSON corrompues dans le localStorage

### 3. ❌ Erreur "AuthSessionMissingError: Auth session missing!"
**Cause :** Tentative de déconnexion sans session active

---

## ✅ Solutions Appliquées

### 1. AuthContext.tsx - Ligne 498-515
Gestion améliorée du logout pour ignorer les erreurs de session :

```typescript
const logout = useCallback(async () => {
  try {
    // Ignore les erreurs de session/refresh token
    const { error } = await supabase.auth.signOut();
    if (error && !error.message?.includes('session') && !error.message?.includes('refresh')) {
      logger.error('SignOut error:', error.message);
    }
    
    setUser(null);
    setSession(null);
    logger.success('User logged out');
  } catch (error: any) {
    // Même si signOut échoue, on nettoie l'état local
    logger.warn('Error during logout, clearing local state:', error?.message);
    setUser(null);
    setSession(null);
  }
}, []);
```

### 2. AutomationContext.tsx - Amélioration du Parsing JSON
Validation robuste avec vérification de toutes les propriétés :

```typescript
const parsed = JSON.parse(trimmed);
if (
  parsed && 
  typeof parsed === 'object' && 
  'autoInvoice' in parsed &&
  'autoReminderDays' in parsed &&
  'accountingExport' in parsed
) {
  setSettings(parsed as AutomationSettings);
} else {
  // Réinitialiser aux valeurs par défaut
  setSettings(DEFAULT_SETTINGS);
}
```

### 3. Utilitaire de Nettoyage - `utils/clearSessionErrors.ts`
Nouvelles fonctions pour nettoyer les sessions corrompues :

```typescript
import { clearSessionErrors, checkSessionValidity } from '@/utils/clearSessionErrors';

// Nettoyer tout
await clearSessionErrors();

// Vérifier la session
const isValid = await checkSessionValidity();
```

---

## 🚀 Comment Utiliser

### Option 1 : Nettoyage Manuel (Console du Navigateur)
```javascript
// Dans la console du navigateur
localStorage.clear();
location.reload();
```

### Option 2 : Ajouter un Bouton de Debug (Recommandé pour Dev)
Dans votre écran de paramètres ou profil :

```typescript
import { clearSessionErrors } from '@/utils/clearSessionErrors';

<TouchableOpacity onPress={async () => {
  await clearSessionErrors();
  // Rediriger vers la page de login
}}>
  <Text>🧹 Nettoyer les Sessions</Text>
</TouchableOpacity>
```

### Option 3 : Nettoyage Automatique au Démarrage (si erreur)
Dans `app/_layout.tsx` :

```typescript
import { useEffect } from 'react';
import { checkSessionValidity, clearSessionErrors } from '@/utils/clearSessionErrors';

useEffect(() => {
  checkSessionValidity().then(async (isValid) => {
    if (!isValid) {
      console.log('🧹 Session invalide détectée, nettoyage...');
      await clearSessionErrors();
    }
  });
}, []);
```

---

## 📋 Checklist de Vérification

- [x] ✅ `AuthContext.tsx` gère les erreurs de session au logout
- [x] ✅ `AutomationContext.tsx` valide complètement le JSON avant parsing
- [x] ✅ Utilitaire `clearSessionErrors.ts` créé
- [ ] 🔄 Tester la déconnexion avec session expirée
- [ ] 🔄 Tester le chargement avec localStorage corrompu
- [ ] 🔄 Ajouter un bouton de debug (optionnel)

---

## 🎯 Prochaines Étapes

1. **Tester les corrections** : Ouvrir l'app et vérifier qu'il n'y a plus d'erreurs
2. **Forcer une session expirée** : Attendre 24h ou manipuler le localStorage
3. **Ajouter monitoring** : Logger les erreurs dans un service externe (Sentry, etc.)

---

## ❓ FAQ

**Q : L'erreur persiste après nettoyage ?**  
R : Vider complètement le cache du navigateur (Ctrl+Shift+Del) et réessayer

**Q : Est-ce que cela supprime les données utilisateur ?**  
R : Non, seules les sessions et paramètres locaux sont supprimés. Les données en BDD restent intactes.

**Q : Pourquoi "syntax error at or near createContextHook" ?**  
R : Quelqu'un a essayé d'exécuter du code TypeScript dans l'éditeur SQL de Supabase. Ignorez cette erreur, elle ne vient pas de votre app.

---

## 🆘 Support

Si les erreurs persistent :
1. Vérifier les logs de la console
2. Nettoyer complètement le localStorage
3. Vérifier que Supabase est accessible : https://nkxucjhavjfsogzpitry.supabase.co
4. Tester avec un nouvel utilisateur

---

**Date de mise à jour :** 2025-01-22  
**Version des corrections :** 1.0
