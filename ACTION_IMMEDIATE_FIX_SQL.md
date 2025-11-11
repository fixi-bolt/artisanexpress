# ⚡ ACTION IMMÉDIATE - FIX SQL ERROR

## ❌ Erreur actuelle
```
cannot drop function notify_client_on_mission_accepted() 
because other objects depend on it
```

## ✅ Solution

### 📋 ÉTAPE 1 : Copier le script

Ouvrez le fichier :
```
database/SCRIPT_FINAL_PROPRE_CORRECTED.sql
```

### 📋 ÉTAPE 2 : Coller dans Supabase

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle requête
5. **COPIEZ-COLLEZ LE SCRIPT ENTIER**
6. Cliquez sur **RUN** (ou Ctrl+Enter)

### 📋 ÉTAPE 3 : Vérification

Le script affichera à la fin :
```
✅ INSTALLATION RÉUSSIE !
```

Si vous voyez ce message, tout est bon ! 🎉

## 🔧 Ce que le script corrige

1. ✅ Supprime les triggers AVANT les fonctions (résout l'erreur)
2. ✅ Renomme la colonne `read` en `is_read` si nécessaire
3. ✅ Recrée les fonctions de notifications correctement
4. ✅ Recrée les triggers
5. ✅ Configure Realtime
6. ✅ Vérifie l'installation

## 📝 Test après l'installation

Pour tester que tout fonctionne :

1. **Créez une mission** en tant que client
   - Les artisans proches recevront une notification

2. **Acceptez une mission** en tant qu'artisan
   - Le client recevra une notification

3. **Vérifiez les notifications** dans l'app
   - Elles doivent apparaître en temps réel

## 🆘 Si ça ne marche toujours pas

Partagez l'erreur exacte que vous voyez dans Supabase.
