# 🚀 Configuration Finale de Supabase

## ✅ Étape 1: Initialiser la base de données Supabase

1. **Ouvrez votre projet Supabase**: https://nkxucjhavjfsogzpitry.supabase.co
2. **Allez dans le SQL Editor** (icône de base de données dans la barre latérale)
3. **Créez une nouvelle requête** (bouton "New query")
4. **Copiez-collez tout le contenu** du fichier `database/setup-new-supabase.sql`
5. **Exécutez le script** (bouton "Run" ou Ctrl+Enter)

✅ **Vous devriez voir**: "Success. No rows returned"

---

## ✅ Étape 2: Vérifier les variables d'environnement

Le fichier `.env` contient déjà les bonnes valeurs:

```env
EXPO_PUBLIC_SUPABASE_URL=https://nkxucjhavjfsogzpitry.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reHVjamhhdmpmc29nenBpdHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzMxMzAsImV4cCI6MjA3NjY0OTEzMH0.-JKjKW2_2ZQag1E7GzGEMvkuWxcWDzVSMB8mCoiNzig
```

✅ **C'est bon!** Pas besoin de modifier.

---

## ✅ Étape 3: Redémarrer l'application avec cache clear

Ouvrez votre terminal et exécutez:

```bash
# Arrêter expo (Ctrl+C)

# Puis redémarrer avec --clear pour recharger les variables d'environnement
npx expo start --clear
```

⚠️ **IMPORTANT**: Le `--clear` est obligatoire pour que les nouvelles variables d'environnement soient prises en compte.

---

## ✅ Étape 4: Tester l'inscription

1. **Ouvrez l'application** (web ou mobile)
2. **Créez un compte** avec:
   - Email: `test@example.com`
   - Mot de passe: `Test1234!`
   - Type: Client ou Artisan
3. **Vérifiez** que l'inscription fonctionne sans erreur

---

## 🔍 Vérifications dans Supabase

Après l'inscription, vérifiez dans Supabase:

1. **Table `auth.users`** (Authentication > Users): Doit contenir votre utilisateur
2. **Table `users`** (Table Editor > users): Doit contenir votre profil
3. **Table `clients` ou `artisans`**: Doit contenir votre profil spécifique

---

## ❌ En cas d'erreur "JSON Parse error"

Si vous voyez encore l'erreur, vérifiez:

1. ✅ Que le script SQL a été exécuté avec succès
2. ✅ Que vous avez redémarré avec `--clear`
3. ✅ Que l'URL Supabase se termine par `.supabase.co` (pas de slash `/` à la fin)
4. ✅ Que la clé anon est complète (commence par `eyJhbG...`)

---

## 📝 Logs de débogage

Pour voir les logs de connexion, ouvrez la console de votre navigateur ou terminal.
Vous devriez voir:

```
🔧 Supabase Config Check:
  URL: ✅ Set
  Key: ✅ Set
🔵 Starting signup for: test@example.com client
✅ Auth user created with ID: xxx-xxx-xxx
✅ User profile created
✅✅✅ User signup complete
```

---

## 🎉 C'est prêt!

Une fois ces étapes terminées, votre application devrait fonctionner correctement avec Supabase.
