# ⚠️ CORRECTION ERREUR SQL

## Le problème
L'erreur `ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications` était incorrecte car la syntaxe SQL ne supporte pas `IF EXISTS` avec `DROP TABLE` dans `ALTER PUBLICATION`.

## ✅ La solution

### Ouvrez le fichier `COPIER_COLLER_FIX_SQL.sql`

1. **Copiez tout le contenu** du fichier `COPIER_COLLER_FIX_SQL.sql`
2. **Allez dans Supabase** → SQL Editor
3. **Collez le script**
4. **Cliquez sur "Run"**

## Ce que fait le script corrigé

1. ✅ Nettoie les anciennes publications avec gestion d'erreur
2. ✅ Recrée la publication realtime correctement
3. ✅ Active realtime sur notifications
4. ✅ Vérifie et crée la colonne is_read
5. ✅ Crée la fonction de notification
6. ✅ Crée le trigger pour l'acceptation de mission
7. ✅ Affiche les résultats de vérification

## Après l'exécution

Vous devriez voir :
- ✅ "Publication realtime: 1 table(s)"
- ✅ "Trigger configuré: 1"
- ✅ "Configuration des notifications terminée avec succès!"

## Test rapide

Dans votre app :
1. Un artisan accepte une mission
2. Le client devrait recevoir la notification immédiatement

---

**Ce script corrige définitivement l'erreur SQL et configure correctement les notifications.**
