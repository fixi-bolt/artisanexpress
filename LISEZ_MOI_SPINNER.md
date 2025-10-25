# 🚀 CORRECTION RAPIDE - Spinner bloqué

## 3 ÉTAPES SIMPLES

### 1️⃣ Exécuter le script SQL (2 minutes)

1. **Ouvrez Supabase**: https://supabase.com/dashboard
2. **Cliquez sur** SQL Editor (menu gauche)
3. **Cliquez sur** "+ New Query"
4. **Ouvrez le fichier** `database/FIX_SPINNER_BLOQUE.sql`
5. **Copiez TOUT** le contenu
6. **Collez-le** dans Supabase SQL Editor
7. **Cliquez sur** "Run" (bouton en bas à droite)

✅ **Résultat attendu:** Vous devez voir "✅ CORRECTION TERMINÉE !" dans les logs

---

### 2️⃣ Vérifier le fichier .env (30 secondes)

1. **Ouvrez** le fichier `.env` à la racine du projet
2. **Vérifiez** que ces lignes existent:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Si elles sont vides:**
   - Allez sur Supabase Dashboard
   - Cliquez sur Settings → API
   - Copiez "Project URL" et "anon public"
   - Collez-les dans `.env`

---

### 3️⃣ Redémarrer l'app (1 minute)

1. **Dans le terminal**, faites Ctrl+C pour arrêter l'app
2. **Tapez:**
   ```bash
   bun start --clear
   ```
3. **Attendez** que l'app se charge
4. **Appuyez sur R** pour recharger si nécessaire

---

## ✅ C'EST TOUT !

L'application devrait maintenant:
- ✅ Se charger en moins de 8 secondes
- ✅ Afficher l'écran d'accueil si vous n'êtes pas connecté
- ✅ Vous rediriger vers votre dashboard si vous êtes connecté

---

## ❌ Si ça ne marche toujours pas

1. **Ouvrez la console** du navigateur (F12)
2. **Regardez** s'il y a des erreurs en rouge
3. **Envoyez-moi** une capture d'écran de la console

---

## 📁 Fichiers modifiés

Pour info, j'ai modifié:
- ✅ `contexts/AuthContext.tsx` → Ajout d'un timeout de 8s
- ✅ `database/FIX_SPINNER_BLOQUE.sql` → Nouveau script SQL complet
- ✅ `FIX_SPINNER_GUIDE.md` → Guide détaillé (si besoin)

---

## 💡 Ce que fait le fix

**Script SQL:**
- Crée la table `subscriptions` manquante
- Crée les profils artisans/clients manquants
- Crée les wallets pour tous les artisans
- Configure les politiques de sécurité

**Code TypeScript:**
- Force l'initialisation après 8 secondes max
- Évite les boucles infinies de chargement
- Meilleure gestion des erreurs Supabase

---

🎯 **Temps total estimé: 3-4 minutes**
