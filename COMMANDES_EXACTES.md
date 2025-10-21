# 🎯 Commandes Exactes à Exécuter

## 📋 Checklist complète

### ✅ 1. Configuration Supabase (5 minutes)

#### A. Exécuter le script SQL

1. Ouvrez: https://nkxucjhavjfsogzpitry.supabase.co
2. Menu latéral → **SQL Editor**
3. Bouton **New query**
4. Copiez le contenu de `database/setup-new-supabase.sql`
5. Collez dans l'éditeur
6. Cliquez **Run**

**✅ Attendez**: "Success. No rows returned"

---

### ✅ 2. Vérification du fichier .env

Le fichier est déjà correct. **NE RIEN MODIFIER.**

Vérifiez juste qu'il contient:

```env
EXPO_PUBLIC_SUPABASE_URL=https://nkxucjhavjfsogzpitry.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reHVjamhhdmpmc29nenBpdHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzMxMzAsImV4cCI6MjA3NjY0OTEzMH0.-JKjKW2_2ZQag1E7GzGEMvkuWxcWDzVSMB8mCoiNzig
```

---

### ✅ 3. Redémarrage de l'application

Dans votre terminal, **exécutez exactement**:

```bash
npx expo start --clear
```

⚠️ **Ne lancez PAS**: `npm start` ou `yarn start` ou `expo start`
⚠️ **Lancez UNIQUEMENT**: `npx expo start --clear`

---

### ✅ 4. Test de l'application

Une fois l'app lancée:

1. **Ouvrez** l'application (web ou mobile via QR code)
2. **Allez** sur l'écran d'inscription
3. **Créez un compte** avec:
   - **Email**: `test@example.com`
   - **Mot de passe**: `Test1234!`
   - **Nom**: `Test User`
   - **Type**: Client (ou Artisan)
4. **Cliquez** sur "Créer un compte"

---

## 🔍 Vérifications post-test

### Dans la console de l'application, vous devriez voir:

```
🔧 Supabase Config Check:
  URL: https://nkxucjhavjfsogzpitry.supabase.co
  Key: ✅ eyJhbGciOiJIUzI1NiIsInR...
🔵 Starting signup for: test@example.com client
✅ Auth user created with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ User profile created
✅ Client profile created
✅✅✅ User signup complete: test@example.com client
```

### Dans Supabase Dashboard:

1. **Authentication** → **Users**: Vous devriez voir `test@example.com`
2. **Table Editor** → **users**: Vous devriez voir votre profil
3. **Table Editor** → **clients**: Vous devriez voir votre client

---

## ❌ Si ça ne fonctionne pas

### Erreur: "SUPABASE NOT CONFIGURED"

**Cause**: Variables d'environnement non chargées

**Solution**:
```bash
# Ctrl+C pour arrêter
npx expo start --clear
```

---

### Erreur: "JSON Parse error: Unexpected character: P"

**Cause**: Script SQL pas exécuté OU mauvaise URL

**Solution**:
1. Retournez à l'Étape 1
2. Exécutez le script SQL
3. Vérifiez que l'URL dans `.env` est: `https://nkxucjhavjfsogzpitry.supabase.co`
4. Redémarrez: `npx expo start --clear`

---

### Erreur: "new row violates row-level security policy"

**Cause**: Les policies RLS ne sont pas créées

**Solution**:
1. Retournez à l'Étape 1
2. **Exécutez à nouveau** le script SQL complet
3. Vérifiez qu'il n'y a pas d'erreur dans l'exécution
4. Redémarrez: `npx expo start --clear`

---

### Erreur: "relation 'users' does not exist"

**Cause**: Les tables ne sont pas créées

**Solution**:
1. Allez dans Supabase → **Table Editor**
2. Vérifiez si vous voyez les tables: `users`, `clients`, `artisans`, etc.
3. Si NON: Retournez à l'Étape 1 et exécutez le script SQL
4. Si OUI: Redémarrez: `npx expo start --clear`

---

## 🎯 Commande de debug

Si vous ne savez pas ce qui ne va pas, ajoutez ces logs:

```bash
# Dans votre terminal
npx expo start --clear

# Puis regardez attentivement les logs
# Cherchez les lignes qui commencent par ❌
```

---

## ✅ Tout fonctionne!

Vous devriez maintenant pouvoir:
- ✅ Créer des comptes
- ✅ Se connecter
- ✅ Naviguer dans l'app
- ✅ Créer des missions

**Félicitations! 🎉**
