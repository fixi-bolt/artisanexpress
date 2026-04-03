# 🔧 Guide de Correction Complet

## ✅ Problèmes identifiés

1. ❌ **Erreur SQL** : `function calculate_distance(numeric, numeric, numeric, numeric) does not exist`
2. ❌ **Carte disparue** : La carte rétractable n'apparaît plus

---

## 📋 Solution en 2 étapes

### **ÉTAPE 1 : Corriger la base de données Supabase**

1. Ouvrez votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (dans le menu de gauche)
4. Cliquez sur **New Query**
5. **Copiez-collez** le contenu complet du fichier `COPIER_COLLER_SUPABASE_MAINTENANT.sql`
6. Cliquez sur **Run** (ou appuyez sur Cmd+Enter / Ctrl+Enter)

✅ **Résultat attendu** : Vous devriez voir des messages `NOTICE` confirmant que :
- ✅ Distance test Paris-Lyon: ~392 km
- ✅ Fonction calculate_distance fonctionne correctement
- ✅ TOUTES LES FONCTIONS SONT CRÉÉES
- 🎉 Vous pouvez maintenant utiliser l'application !

---

### **ÉTAPE 2 : Vérifier la carte rétractable**

La carte rétractable est déjà intégrée dans votre application ! Elle apparaît :

#### 📍 **Dans `mission-details.tsx`** (lignes 160-173)
La carte s'affiche avec :
- 📌 Position de la mission
- 🚗 Position de l'artisan (si disponible)
- 🗺️ Interaction complète (zoom, pan, expansion)

#### ✅ **Vérification**
1. Ouvrez l'application
2. Créez une nouvelle demande (écran `/request`)
3. Une fois créée, allez dans les détails de la mission
4. La carte rétractable devrait apparaître avec :
   - Un **handle** en haut (petit trait horizontal)
   - Une adresse affichée quand elle est réduite
   - Possibilité de **glisser vers le haut** pour agrandir
   - Possibilité de **taper** pour agrandir/réduire

---

## 🎯 Test rapide après correction

### Test 1 : Fonction calculate_distance
```sql
-- Dans SQL Editor de Supabase, exécutez :
SELECT calculate_distance(48.8566, 2.3522, 45.7640, 4.8357) as distance_km;

-- Résultat attendu : ~392 km
```

### Test 2 : Création de mission
1. Ouvrez l'app
2. Cliquez sur "Nouvelle demande"
3. Remplissez les champs
4. Envoyez la demande
5. ✅ Aucune erreur ne devrait apparaître

### Test 3 : Carte rétractable
1. Après avoir créé une mission
2. Allez dans "Mes missions"
3. Cliquez sur une mission
4. La carte devrait apparaître
5. Testez :
   - ✅ Glisser vers le haut = expansion
   - ✅ Glisser vers le bas = réduction
   - ✅ Taper = basculer expansion/réduction

---

## ❓ Troubleshooting

### Problème : La fonction SQL ne se crée pas
**Solution** : Vérifiez que vous êtes connecté avec les bons droits (owner ou service_role)

### Problème : La carte n'apparaît toujours pas
**Solution** :
1. Vérifiez que vous avez bien des missions créées
2. Ouvrez les détails d'une mission (pas la page de suivi)
3. Rechargez l'app (Cmd+R ou Ctrl+R sur simulateur)

### Problème : Erreur "Row Level Security"
**Solution** : Les politiques RLS sont déjà configurées dans le script SQL. Si l'erreur persiste, contactez le support.

---

## 📞 Support

Si les erreurs persistent après avoir suivi ces étapes :
1. Vérifiez les logs dans la console développeur
2. Vérifiez les logs Supabase (dans Logs Explorer)
3. Assurez-vous d'avoir exécuté le script SQL complet

---

## ✅ Checklist finale

- [ ] Script SQL exécuté dans Supabase
- [ ] Messages de succès visibles dans SQL Editor
- [ ] Test de la fonction `calculate_distance` réussi
- [ ] Création de mission sans erreur
- [ ] Carte rétractable visible dans les détails
- [ ] Interactions de la carte fonctionnelles

---

**🎉 Une fois ces étapes terminées, votre application devrait fonctionner parfaitement !**
