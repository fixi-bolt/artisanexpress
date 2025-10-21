# 🔧 Instructions pour corriger l'erreur de connexion

## Problème actuel
Vous recevez cette erreur lors de l'inscription :
```
permission denied for table users
```

## Solution en 2 étapes

### Étape 1 : Corriger les permissions Supabase

1. **Ouvrez votre dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Ouvrez l'éditeur SQL**
   - Cliquez sur "SQL Editor" dans la barre latérale gauche
   - Cliquez sur "New Query"

3. **Exécutez le script de correction**
   - Ouvrez le fichier `FIX_SIGNUP_NOW.sql` dans votre projet
   - Copiez TOUT le contenu du fichier
   - Collez-le dans l'éditeur SQL
   - Cliquez sur le bouton "Run" (en bas à droite)

4. **Vérifiez le résultat**
   - Vous devriez voir : "Success. No rows returned"
   - Si vous voyez une erreur, copiez-la et envoyez-la moi

### Étape 2 : Testez l'inscription

1. **Relancez votre application**
   ```bash
   npx expo start --clear
   ```

2. **Essayez de créer un nouveau compte**
   - Utilisez une nouvelle adresse email (pas une déjà utilisée)
   - Remplissez le formulaire d'inscription
   - Cliquez sur "Créer un compte"

3. **Vérifiez les logs dans la console**
   - Vous devriez voir des messages avec ✅
   - Par exemple : "✅ User profile created"

## Si ça ne marche toujours pas

Envoyez-moi :
1. Le message d'erreur complet de la console
2. Une capture d'écran de l'erreur SQL (si elle apparaît dans Supabase)
3. Les logs qui commencent par 📝, ✅ ou ❌

## Pour supprimer les comptes de test

Si vous voulez supprimer tous les comptes créés pendant les tests :

1. Allez dans Supabase Dashboard → Authentication → Users
2. Supprimez les utilisateurs un par un
3. Ou exécutez cette requête SQL pour tout supprimer :

```sql
-- ATTENTION : Ceci supprime TOUS les utilisateurs !
-- À utiliser uniquement en développement

DELETE FROM users;
-- Les autres tables se videront automatiquement (CASCADE)
```

## Vérifications supplémentaires

Assurez-vous que dans votre fichier `.env` :
- `SKIP_EMAIL_VERIFICATION=true` est présent (déjà fait ✅)
- `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` sont corrects

---

**Besoin d'aide ?** Envoyez-moi les logs de console et je vous aiderai !
