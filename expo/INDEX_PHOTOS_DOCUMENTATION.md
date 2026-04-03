# 📚 Index de la documentation : Système de photos

## 🚀 Démarrage rapide

**Tu veux juste faire fonctionner les photos ?** Commence ici :

1. **[CHECKLIST_PHOTOS.md](./CHECKLIST_PHOTOS.md)** ← 📌 **COMMENCE ICI**
   - Checklist étape par étape
   - Configuration Supabase Dashboard (UI)
   - Tests de validation
   - Dépannage rapide

2. **[PHOTOS_ARTISAN_ACTION_IMMEDIATE.md](./PHOTOS_ARTISAN_ACTION_IMMEDIATE.md)**
   - Actions terminées (résumé)
   - Test rapide (3 étapes)
   - Vérification Supabase
   - Erreurs courantes

## 📖 Documentation complète

### Pour comprendre le système

3. **[PHOTO_SYSTEM_FLOW.md](./PHOTO_SYSTEM_FLOW.md)**
   - Architecture complète (diagramme)
   - Flow détaillé (6 étapes)
   - Code snippets commentés
   - Sécurité et permissions
   - Métriques et limites

4. **[FIX_PHOTOS_ARTISAN_GUIDE.md](./FIX_PHOTOS_ARTISAN_GUIDE.md)**
   - État actuel du code
   - Configuration Supabase (détails)
   - Tests à effectuer
   - Diagnostic complet
   - Scripts de vérification

## 🛠️ Outils et scripts

### Script SQL

5. **[database/verify-photos-setup.sql](./database/verify-photos-setup.sql)**
   - Vérification du bucket
   - Vérification des policies
   - Liste des photos stockées
   - Missions avec photos
   - Cohérence des URLs
   - Résumé final

### Code frontend

6. **[utils/uploadPhotos.ts](./utils/uploadPhotos.ts)**
   - Fonction `uploadMissionPhotos()`
   - Fonction `deleteMissionPhotos()`
   - Logs de debug améliorés

7. **[contexts/MissionContext.tsx](./contexts/MissionContext.tsx)**
   - `createMission()` - Upload des photos
   - `loadMissions()` - Récupération

8. **[app/(artisan)/dashboard.tsx](./app/(artisan)/dashboard.tsx)**
   - `NearbyMissionCard` - Affichage miniatures
   - `MissionRequestCard` - Affichage miniatures
   - Modal plein écran

9. **[app/mission-details.tsx](./app/mission-details.tsx)**
   - Section photos avec ScrollView
   - Modal plein écran

## 🎯 Par cas d'usage

### Je veux configurer Supabase
→ **[CHECKLIST_PHOTOS.md](./CHECKLIST_PHOTOS.md)** (Section "Configuration Supabase")

### Je veux comprendre comment ça marche
→ **[PHOTO_SYSTEM_FLOW.md](./PHOTO_SYSTEM_FLOW.md)**

### Je veux tester que tout fonctionne
→ **[CHECKLIST_PHOTOS.md](./CHECKLIST_PHOTOS.md)** (Section "Vérification")
→ Exécute **[database/verify-photos-setup.sql](./database/verify-photos-setup.sql)**

### J'ai une erreur
→ **[FIX_PHOTOS_ARTISAN_GUIDE.md](./FIX_PHOTOS_ARTISAN_GUIDE.md)** (Section "Diagnostic")
→ **[CHECKLIST_PHOTOS.md](./CHECKLIST_PHOTOS.md)** (Section "Dépannage")

### Je veux modifier le code
→ **[PHOTO_SYSTEM_FLOW.md](./PHOTO_SYSTEM_FLOW.md)** (Section "Étapes détaillées")

## 📊 Structure des fichiers

```
Projet/
├── CHECKLIST_PHOTOS.md                    ← 📌 Commence ici
├── PHOTOS_ARTISAN_ACTION_IMMEDIATE.md     ← Résumé rapide
├── PHOTO_SYSTEM_FLOW.md                   ← Architecture
├── FIX_PHOTOS_ARTISAN_GUIDE.md            ← Guide complet
├── INDEX_PHOTOS_DOCUMENTATION.md          ← Tu es ici
│
├── database/
│   └── verify-photos-setup.sql            ← Script de vérification
│
├── utils/
│   └── uploadPhotos.ts                    ← Logic upload
│
├── contexts/
│   └── MissionContext.tsx                 ← Orchestration
│
└── app/
    ├── request.tsx                        ← UI client
    ├── mission-details.tsx                ← Détails mission
    └── (artisan)/
        └── dashboard.tsx                  ← Dashboard artisan
```

## 🔍 Recherche rapide

### Par mot-clé

| Mot-clé | Fichier | Section |
|---------|---------|---------|
| **Configuration** | CHECKLIST_PHOTOS.md | Configuration Supabase |
| **Bucket** | FIX_PHOTOS_ARTISAN_GUIDE.md | Configuration requise |
| **Policies** | PHOTO_SYSTEM_FLOW.md | Sécurité et permissions |
| **Upload** | PHOTO_SYSTEM_FLOW.md | Étapes 1-3 |
| **Affichage** | PHOTO_SYSTEM_FLOW.md | Étapes 5-6 |
| **Erreur 404** | CHECKLIST_PHOTOS.md | Dépannage |
| **Permission denied** | CHECKLIST_PHOTOS.md | Dépannage |
| **SQL** | database/verify-photos-setup.sql | - |
| **Test** | CHECKLIST_PHOTOS.md | Vérification |
| **Debug** | FIX_PHOTOS_ARTISAN_GUIDE.md | Diagnostic |

### Par rôle

| Rôle | Fichiers recommandés |
|------|---------------------|
| **Développeur** | PHOTO_SYSTEM_FLOW.md, utils/uploadPhotos.ts |
| **Admin Supabase** | CHECKLIST_PHOTOS.md, database/verify-photos-setup.sql |
| **Testeur** | CHECKLIST_PHOTOS.md (Section Vérification) |
| **Support** | FIX_PHOTOS_ARTISAN_GUIDE.md (Section Diagnostic) |

## 🎓 Parcours d'apprentissage

### Niveau 1 : Configuration (15 min)
1. Lis **CHECKLIST_PHOTOS.md** (Section Configuration)
2. Exécute les étapes dans Supabase Dashboard
3. Exécute **database/verify-photos-setup.sql**

### Niveau 2 : Tests (10 min)
1. Lis **CHECKLIST_PHOTOS.md** (Section Vérification)
2. Teste upload client
3. Teste affichage artisan

### Niveau 3 : Compréhension (30 min)
1. Lis **PHOTO_SYSTEM_FLOW.md** (Architecture)
2. Lis le code dans **utils/uploadPhotos.ts**
3. Lis le code dans **app/(artisan)/dashboard.tsx**

### Niveau 4 : Expertise (1h)
1. Lis **FIX_PHOTOS_ARTISAN_GUIDE.md** (Guide complet)
2. Analyse **PHOTO_SYSTEM_FLOW.md** (Toutes sections)
3. Teste tous les scénarios d'erreur

## 💡 Conseils

### Pour une installation rapide
1. Ouvre **CHECKLIST_PHOTOS.md**
2. Coche les cases une par une
3. Exécute **database/verify-photos-setup.sql**
4. C'est fait ! ✅

### Pour débugger un problème
1. Vérifie les logs console (recherche `[PhotoUpload]`)
2. Exécute **database/verify-photos-setup.sql**
3. Consulte **FIX_PHOTOS_ARTISAN_GUIDE.md** (Section Diagnostic)
4. Teste les URLs directement dans un navigateur

### Pour modifier le système
1. Comprends le flow dans **PHOTO_SYSTEM_FLOW.md**
2. Identifie quelle étape modifier
3. Modifie le code correspondant
4. Teste avec **CHECKLIST_PHOTOS.md**

## 📞 Support

Si tu es bloqué après avoir suivi la documentation :

1. **Vérifie les logs** :
   - Recherche `[PhotoUpload]` dans la console
   - Recherche `Error` pour les erreurs

2. **Exécute le diagnostic SQL** :
   - `database/verify-photos-setup.sql`
   - Note les résultats (✅ ou ❌)

3. **Teste une URL directement** :
   - Copie une URL de photo depuis la DB
   - Ouvre-la dans un navigateur
   - Note le résultat (200 OK ou 404)

4. **Partage** :
   - Logs console
   - Résultats SQL
   - Test URL
   - Message d'erreur exact

---

**Créé le** : Décembre 2024  
**Dernière mise à jour** : Documentation complète pour système de photos

**Statut** : ✅ Configuration validée, code vérifié, tests documentés
