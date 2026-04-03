# 📖 LISEZ-MOI : Problème Client/Artisan

## 🎯 Votre problème

**Symptôme** : Les interfaces Client et Artisan sont identiques dans votre application.

**Cause** : Le champ `user_type` dans la base de données Supabase n'est pas correctement défini.

---

## 🚀 Solution ultra-rapide (2 minutes)

### 1️⃣ Ouvrir Supabase
- Allez sur https://supabase.com
- Cliquez sur **SQL Editor**

### 2️⃣ Copier/coller ce code
```sql
UPDATE users u
SET user_type = CASE
  WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) THEN 'artisan'
  WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) THEN 'client'
  ELSE 'client'
END
WHERE user_type IS NULL OR user_type = '';
```

### 3️⃣ Vider le cache
```bash
npx expo start --clear
```

### 4️⃣ Se reconnecter dans l'app

**✅ C'est tout !**

---

## 📚 Fichiers utiles

| Fichier | Description |
|---------|-------------|
| **`SOLUTION_RAPIDE_ROLES.md`** | Guide étape par étape avec captures |
| **`INSTRUCTIONS_CORRIGER_ROLES.md`** | Instructions détaillées complètes |
| **`database/fix-user-roles.sql`** | Script SQL complet avec diagnostics |
| **`FIX_ROLE_ROUTING.md`** | Guide technique approfondi |

---

## 🎨 Comment reconnaître les différences

### CLIENT 👤
- **Couleur principale** : Bleu (#007AFF)
- **Onglets** : Carte / Missions / Profil
- **Écran principal** : Grille de catégories (Plombier, Électricien...)
- **Bouton spécial** : "Ouvrir la Super App"

### ARTISAN 👨‍🔧
- **Couleur principale** : Orange (#FF9500)
- **Onglets** : Missions / Revenus / Profil
- **Écran principal** : Liste des demandes à accepter
- **Carte statut** : "🟢 Disponible"

---

## 🔍 Outils de diagnostic inclus

### Panel de Debug
Un bouton **œil bleu** apparaît en haut à droite des écrans (en mode dev) :
- Affiche le type d'utilisateur actuel
- Montre les flags `isClient` / `isArtisan`
- Visible uniquement en développement

---

## ⚙️ Technique : Structure du code

Votre code est **déjà correct** ! Voici la structure :

```
app/
├── (client)/          ← Interface CLIENT
│   ├── _layout.tsx    (Tabs bleus)
│   ├── home.tsx       (Recherche artisans)
│   └── missions.tsx
├── (artisan)/         ← Interface ARTISAN
│   ├── _layout.tsx    (Tabs oranges)
│   ├── dashboard.tsx  (Liste demandes)
│   └── earnings.tsx
└── index.tsx          ← Redirection automatique
```

**La redirection fonctionne** (ligne 19 dans `app/index.tsx`) :
```typescript
router.replace(isClient ? '/(client)/home' : '/(artisan)/dashboard');
```

**Le problème n'est PAS dans le code**, mais dans la **base de données**.

---

## 🆘 Aide rapide

### "user_type toujours NULL"
```sql
-- Forcer pour un utilisateur spécifique
UPDATE users SET user_type = 'client' WHERE email = 'votre@email.com';
```

### "Interface ne change pas"
```bash
# Forcer le rechargement
rm -rf .expo
npx expo start --clear
```

### "L'app crash"
Vérifiez que les profils clients/artisans existent :
```sql
SELECT * FROM clients;
SELECT * FROM artisans;
```

---

## 📞 Support

Si le problème persiste après avoir suivi **`SOLUTION_RAPIDE_ROLES.md`**, contactez-moi avec :

1. Résultat de : `SELECT email, user_type FROM users;`
2. Logs de console (F12)
3. Capture du panel de debug

---

**🎯 Action immédiate** : Ouvrez **`SOLUTION_RAPIDE_ROLES.md`** et suivez les 3 étapes !
