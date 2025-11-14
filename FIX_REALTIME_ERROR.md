# 🔧 CORRECTION ERREUR REALTIME - ACTION IMMÉDIATE

## ❌ ERREUR
```
❌ Realtime channel error!
```

## ✅ SOLUTION (2 minutes)

### ÉTAPE 1 : Exécuter le script SQL dans Supabase

1. **Ouvrez Supabase Dashboard** → SQL Editor
2. **Copiez-collez** le contenu du fichier `database/FIX_REALTIME_ERROR_NOW.sql`
3. **Exécutez** le script (Cmd/Ctrl + Enter)

### ÉTAPE 2 : Activer Realtime dans l'interface Supabase

1. **Allez dans** Database → **Replication**
2. **Activez** les tables suivantes :
   - ✅ `notifications`
   - ✅ `missions`

### ÉTAPE 3 : Vérifier que ça marche

Après avoir exécuté le script, vous devriez voir :

```
✅ Tables vérifiées
✅ notifications retirée de la publication
✅ missions retirée de la publication
✅ REPLICA IDENTITY configuré
✅ Tables ajoutées à la publication realtime
✅ notifications est dans la publication realtime
✅ missions est dans la publication realtime
```

### ÉTAPE 4 : Redémarrer l'app

```bash
# Recharger l'app
Cmd+R (iOS) ou R+R (Android)
```

## 🔍 Pourquoi cette erreur ?

Le realtime channel ne peut pas se connecter car :
1. ❌ Les tables ne sont pas publiées pour realtime
2. ❌ REPLICA IDENTITY n'est pas configuré
3. ❌ La publication supabase_realtime n'inclut pas les tables

## ✅ Ce que fait le script

1. Vérifie que les tables existent
2. Retire les tables de la publication (reset)
3. Configure REPLICA IDENTITY FULL
4. Ajoute les tables à la publication realtime
5. Vérifie que tout est OK

## 📝 Notes

- **Pas besoin de modifier le code** - c'est uniquement une config Supabase
- **Le fix est permanent** - vous ne devriez plus avoir cette erreur
- **Aucune donnée n'est perdue** - c'est juste de la configuration

## 🆘 Si ça ne marche toujours pas

Exécutez cette requête dans SQL Editor pour diagnostiquer :

```sql
-- Vérifier la publication realtime
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Vérifier les colonnes is_read
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications';
```

Et envoyez-moi le résultat !
