# ⚡ CORRECTIONS IMMÉDIATES

## 🔴 Problème actuel
```
ERROR: function calculate_distance(numeric, numeric, numeric, numeric) does not exist
ERROR: Syntax error at or near "RAISE" LINE 153
```

---

## ✅ SOLUTION EN 1 MINUTE

### 1️⃣ Ouvrir Supabase
👉 https://supabase.com/dashboard → Votre projet → **SQL Editor**

### 2️⃣ Copier-coller ce fichier
👉 Ouvrez : **`COPIER_COLLER_SUPABASE_MAINTENANT.sql`**

### 3️⃣ Exécuter
👉 Cliquez sur **Run** ou appuyez sur **Ctrl+Enter** (Windows/Linux) / **Cmd+Enter** (Mac)

### 4️⃣ Vérifier les messages
✅ Vous devez voir :
```
NOTICE: ✅ Distance test Paris-Lyon: 392 km
NOTICE: ✅ Fonction calculate_distance fonctionne correctement
NOTICE: ✅ TOUTES LES FONCTIONS SONT CRÉÉES
NOTICE: 🎉 Vous pouvez maintenant utiliser l'application !
```

---

## 🗺️ Carte rétractable

### ✅ Elle est déjà là !
La carte est **déjà intégrée** dans votre app :
- 📍 **Où ?** → Détails de mission (`/mission-details`)
- 🎯 **Comment ?** → Composant `<RetractableMap />`

### 🔍 Vérification
1. Créez une mission
2. Cliquez dessus pour voir les détails
3. La carte apparaît avec :
   - 📌 Position de la mission
   - 🎯 Handle pour agrandir/réduire
   - 👆 Tap ou drag pour interagir

---

## 🚨 Si ça ne marche pas

### Erreur persiste après SQL ?
1. **Rechargez l'app** (Cmd+R / Ctrl+R)
2. **Videz le cache** Supabase (reconnectez-vous)
3. **Vérifiez les permissions** (vous devez être owner du projet)

### Carte invisible ?
1. **Êtes-vous sur la bonne page ?** → `/mission-details` (pas `/tracking`)
2. **La mission a-t-elle une position ?** → Vérifiez `latitude/longitude`
3. **Rechargez l'app**

---

## 📞 Besoin d'aide ?

Si après avoir :
- ✅ Exécuté le script SQL
- ✅ Rechargé l'app
- ✅ Vérifié la page `/mission-details`

... les erreurs persistent, vérifiez :
1. **Console navigateur** → Erreurs JS ?
2. **Logs Supabase** → Erreurs SQL ?
3. **Variables d'environnement** → `.env` correct ?

---

## 🎯 Actions immédiates (dans l'ordre)

1. [ ] Ouvrir Supabase SQL Editor
2. [ ] Copier le fichier `COPIER_COLLER_SUPABASE_MAINTENANT.sql`
3. [ ] Exécuter le script
4. [ ] Vérifier les messages de succès
5. [ ] Recharger l'application
6. [ ] Tester la création d'une mission
7. [ ] Vérifier la carte dans les détails

---

**⏱️ Temps estimé : 2 minutes**
