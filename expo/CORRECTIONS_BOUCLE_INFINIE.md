# Corrections - Boucle Infinie et Blocage de l'Application

## Problème Initial
L'application restait bloquée sur un écran de chargement avec une boucle infinie causant l'erreur :
```
Error: Maximum update depth exceeded. This can happen when a component repeatedly calls 
setState inside componentWillUpdate or componentDidUpdate. React limits the number of 
nested updates to prevent infinite loops.
```

## Causes Identifiées

### 1. Boucle infinie dans `app/index.tsx`
**Ligne 41** : Le `useEffect` dépendait de `authContext?.user?.type` qui changeait constamment
```typescript
// AVANT (❌ Problème)
useEffect(() => {
  if (isAuthenticated && authContext.user) {
    const userType = authContext.user.type;
    // Redirection...
  }
}, [isAuthenticated, authContext?.isLoading, authContext?.user?.type]); // ❌ user?.type change à chaque render
```

**Solution** : Utilisation d'un `useRef` pour tracker la redirection et dépendre uniquement de `user?.id`
```typescript
// APRÈS (✅ Corrigé)
const hasRedirected = useRef(false);

useEffect(() => {
  if (!isInitialized) return;
  
  if (isAuthenticated && user && !hasRedirected.current) {
    hasRedirected.current = true; // ✅ Empêche les redirections multiples
    // Redirection...
  }
}, [isAuthenticated, isLoading, isInitialized, user?.id]); // ✅ user?.id est stable
```

### 2. Double chargement dans `contexts/AuthContext.tsx`
**Lignes 288-334** : `onAuthStateChange` et `getSession` appelaient tous deux `loadUserProfile`

**Solution** : Ignorer le premier événement `onAuthStateChange` pour éviter le double chargement
```typescript
// APRÈS (✅ Corrigé)
useEffect(() => {
  let mounted = true;
  let initialLoad = true; // ✅ Nouveau flag
  
  supabase.auth.getSession()
    .then(({ data: { session: currentSession } }) => {
      if (mounted) {
        setSession(currentSession);
        if (currentSession?.user) {
          loadUserProfile(currentSession.user.id);
        }
      }
    });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
    if (!mounted) return;
    
    if (initialLoad) { // ✅ Ignore le premier événement
      initialLoad = false;
      return;
    }
    
    // Traitement normal...
  });
}, [loadUserProfile]);
```

## Corrections Appliquées

### Fichier : `app/index.tsx`
1. ✅ Ajout d'un `useRef` `hasRedirected` pour tracker la redirection
2. ✅ Extraction de `user`, `isLoading`, `isInitialized` de `authContext`
3. ✅ Modification du `useEffect` pour :
   - Vérifier `isInitialized` avant toute action
   - Utiliser `hasRedirected.current` pour éviter les redirections multiples
   - Dépendre de `user?.id` au lieu de `user?.type`
   - Inclure toutes les dépendances (fadeAnim, slideAnim, router)
4. ✅ Ajout d'une vérification `!hasRedirected.current` dans la condition d'animation

### Fichier : `contexts/AuthContext.tsx`
1. ✅ Ajout d'un flag `initialLoad` dans le `useEffect`
2. ✅ Modification de `onAuthStateChange` pour :
   - Ignorer le premier événement (double avec getSession)
   - Vérifier `mounted` avant toute action
   - Éviter les appels multiples à `loadUserProfile`

## Résultat Attendu
- ✅ L'application ne reste plus bloquée sur l'écran de chargement
- ✅ Pas de boucle infinie de re-renders
- ✅ La redirection se fait une seule fois après la connexion
- ✅ Le profil utilisateur se charge une seule fois

## Test de Vérification
1. Redémarrer l'application
2. Se connecter avec un compte
3. Vérifier que la redirection se fait immédiatement vers le bon écran
4. Vérifier qu'il n'y a plus d'erreur "Maximum update depth exceeded"

## Remarques Supplémentaires
- L'erreur "source.uri should not be an empty string" peut encore apparaître si des composants essaient de charger des images avec des URIs vides
- Les profils utilisateurs utilisent des avatars avec initiales, donc ce problème ne devrait pas venir de là
- Si l'erreur persiste, vérifier les autres composants qui utilisent des images (missions, artisans, etc.)
