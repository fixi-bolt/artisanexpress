# ⚡ ACTION IMMÉDIATE - FIX ERREUR REALTIME

## 🚨 Problème
Erreur SQL : `syntax error at or near "EXISTS"`
La commande `ALTER PUBLICATION ... DROP TABLE IF EXISTS` n'est pas supportée par PostgreSQL.

## ✅ Solution (30 secondes)

### Étape 1 : Ouvrir Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Cliquez sur **SQL Editor** dans le menu gauche

### Étape 2 : Exécuter le script corrigé
1. Copiez le contenu du fichier : **`database/FIX_REALTIME_CORRECTED_FINAL.sql`**
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **Run** (Ctrl/Cmd + Enter)

### Étape 3 : Vérifier le résultat
Vous devriez voir :
```
✅ REALTIME CONFIGURÉ AVEC SUCCÈS !

| tablename     | status |
|---------------|--------|
| missions      | OK     |
| notifications | OK     |
```

## 📋 Ce qui a été corrigé

### ❌ Avant (erreur)
```sql
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;
```

### ✅ Après (corrigé)
```sql
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
```

## 🔍 Explication
- PostgreSQL ne supporte pas `IF EXISTS` avec `DROP TABLE` dans `ALTER PUBLICATION`
- La solution : utiliser un bloc `DO $$ ... $$` avec gestion d'erreur
- Les erreurs sont interceptées et ignorées si la table n'existe pas

## 📞 Besoin d'aide ?
Si le script échoue encore, envoyez-moi :
- Le message d'erreur complet
- Le numéro de ligne de l'erreur

## ✅ Prochaine étape
Une fois ce script exécuté avec succès, testez l'acceptation d'une mission pour vérifier que les notifications fonctionnent.
