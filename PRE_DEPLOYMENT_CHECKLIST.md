# ✅ Checklist Pré-Déploiement ArtisanNow

## 🎯 Avant de Déployer

Vérifiez tous les points ci-dessous avant de créer votre première build de production.

---

## 📱 Configuration de l'Application

### app.json / Configuration Expo

- [ ] **Nom de l'app** changé de "ArtisanGo" à "ArtisanNow"
- [ ] **Bundle identifier iOS** : `com.artisannow.app` (ou votre domaine)
- [ ] **Package Android** : `com.artisannow.app` (ou votre domaine)
- [ ] **Version** définie : `1.0.0`
- [ ] **Build number iOS** : `1`
- [ ] **Version code Android** : `1`
- [ ] **Icône de l'app** mise à jour avec le nouveau design
- [ ] **Splash screen** mis à jour
- [ ] **Favicon** mis à jour pour le web
- [ ] **Scheme URL** défini : `artisannow://`
- [ ] **Description** ajoutée
- [ ] **Permissions** configurées correctement :
  - [ ] Localisation (avec messages explicatifs)
  - [ ] Notifications push
  - [ ] Caméra (pour photos du problème)
  - [ ] Photos (accès galerie)

### Assets et Design

- [ ] Icône de l'app générée (1024x1024)
- [ ] Splash screen généré (1024x1536)
- [ ] Favicon généré (1024x1024)
- [ ] Screenshots préparés pour stores (minimum 4)
- [ ] Vidéo de présentation (optionnel mais recommandé)

---

## 🔧 Configuration Technique

### Variables d'Environnement

- [ ] `EXPO_PUBLIC_TOOLKIT_URL` configuré en production
- [ ] Clés API configurées (si externes) :
  - [ ] Stripe (clés de production)
  - [ ] Google Maps API (si utilisé)
  - [ ] Services de notifications push

### Backend et API

- [ ] Backend déployé et accessible
- [ ] API tRPC fonctionnelle en production
- [ ] Base de données configurée (production)
- [ ] Connexions testées
- [ ] Rate limiting activé
- [ ] Logs configurés

### Services Tiers

- [ ] **Stripe** :
  - [ ] Compte configuré en mode production
  - [ ] Webhooks configurés
  - [ ] Clés API de production
  - [ ] Commission calculée correctement (10-15%)
  
- [ ] **Notifications Push** :
  - [ ] FCM configuré pour Android
  - [ ] APNs configuré pour iOS
  - [ ] Certificats iOS valides
  - [ ] Service de notifications testé

- [ ] **Localisation** :
  - [ ] Service de géolocalisation fonctionnel
  - [ ] Calcul d'ETA testé
  - [ ] Carte interactive testée

---

## 🧪 Tests

### Tests Fonctionnels

#### Client
- [ ] Inscription / Connexion
- [ ] Création d'une mission
- [ ] Sélection d'un artisan
- [ ] Suivi en temps réel
- [ ] Paiement
- [ ] Notation
- [ ] Historique des missions
- [ ] Chat avec artisan

#### Artisan
- [ ] Inscription / Connexion
- [ ] Réception de mission
- [ ] Acceptation de mission
- [ ] Navigation vers le client
- [ ] Marquage mission terminée
- [ ] Réception du paiement
- [ ] Historique des gains

#### Admin
- [ ] Dashboard accessible
- [ ] Statistiques affichées
- [ ] Gestion des utilisateurs
- [ ] Gestion des missions
- [ ] Visualisation des transactions

### Tests sur Appareils

- [ ] Testé sur iPhone (iOS 15+)
- [ ] Testé sur Android (Android 10+)
- [ ] Testé sur différentes tailles d'écran
- [ ] Testé sur web (React Native Web)
- [ ] Mode portrait uniquement vérifié
- [ ] Performance : temps de chargement < 3s

### Tests Spécifiques

- [ ] **Notifications** :
  - [ ] Notification de nouvelle mission (artisan)
  - [ ] Notification d'acceptation (client)
  - [ ] Notification d'arrivée (client)
  - [ ] Notification de fin de mission

- [ ] **Paiement** :
  - [ ] Paiement par carte
  - [ ] Commission prélevée correctement
  - [ ] Remboursement fonctionne
  - [ ] Historique des transactions visible

- [ ] **Géolocalisation** :
  - [ ] Position client détectée
  - [ ] Position artisan mise à jour en temps réel
  - [ ] ETA calculé correctement
  - [ ] Carte s'affiche correctement

- [ ] **Hors ligne** :
  - [ ] Message approprié sans connexion
  - [ ] Données essentielles en cache
  - [ ] Reconnexion automatique

### Tests de Sécurité

- [ ] Authentification sécurisée
- [ ] Données sensibles chiffrées
- [ ] Pas de clés API dans le code
- [ ] Validation des entrées utilisateur
- [ ] Protection contre les injections
- [ ] Rate limiting sur API

---

## 📄 Documents Légaux

### Documents Requis

- [ ] **Politique de confidentialité** rédigée
- [ ] **Conditions d'utilisation** rédigées
- [ ] **Politique de remboursement** définie
- [ ] **Mentions légales** complètes
- [ ] Documents hébergés sur un site web
- [ ] Liens ajoutés dans l'app
- [ ] Conformité RGPD vérifiée (EU)
- [ ] Conformité CCPA vérifiée (Californie)

### Informations de Contact

- [ ] Email support configuré : `support@artisannow.com`
- [ ] Email privacy configuré : `privacy@artisannow.com`
- [ ] Site web en ligne (ou page de destination)
- [ ] Réponse automatique configurée

---

## 🏪 Préparation pour les Stores

### Apple App Store

- [ ] Compte Apple Developer actif ($99/an)
- [ ] Bundle identifier unique
- [ ] Certificats de distribution créés
- [ ] Provisioning profiles configurés
- [ ] App Store Connect : app créée
- [ ] Screenshots préparés (iPhone formats requis)
- [ ] Description rédigée
- [ ] Mots-clés choisis (max 100 caractères)
- [ ] Catégorie sélectionnée
- [ ] Âge minimum défini
- [ ] Privacy Policy URL ajoutée
- [ ] Support URL ajouté

### Google Play Store

- [ ] Compte Google Play Console actif ($25 une fois)
- [ ] Package name unique
- [ ] Keystore créé et sauvegardé en sécurité
- [ ] Screenshots préparés (formats Android)
- [ ] Description courte (80 caractères)
- [ ] Description longue rédigée
- [ ] Icône haute résolution (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Catégorie sélectionnée
- [ ] Âge minimum défini
- [ ] Privacy Policy URL ajoutée
- [ ] Support email ajouté

---

## 🚀 Build et Déploiement

### Configuration EAS

- [ ] Compte Expo créé
- [ ] `eas.json` configuré (le fichier existe déjà)
- [ ] Project ID Expo configuré dans `app.json`
- [ ] Credentials configurés :
  - [ ] iOS : certificats et provisioning profiles
  - [ ] Android : keystore

### Premier Build

- [ ] Build preview (APK) testé avec succès
- [ ] Build iOS testé via TestFlight
- [ ] Aucune erreur de build
- [ ] App démarre correctement
- [ ] Toutes les fonctionnalités marchent

---

## 📊 Monitoring et Analytics

### Après Publication

- [ ] Analytics configuré (ex: Firebase Analytics)
- [ ] Crash reporting configuré (ex: Sentry)
- [ ] Monitoring des performances
- [ ] Alertes configurées
- [ ] Dashboard de suivi créé

---

## 💰 Business et Légal

### Aspects Business

- [ ] Modèle économique clarifié :
  - [ ] Commission : 10-15% sur artisans
  - [ ] Aucun frais pour clients
- [ ] Conditions de paiement définies
- [ ] Politique d'annulation claire
- [ ] Structure légale de l'entreprise (SAS, SARL...)
- [ ] TVA / Taxes configurées
- [ ] Compte bancaire professionnel

### Conformité

- [ ] Conditions générales validées par un avocat
- [ ] RGPD : DPO nommé (si nécessaire)
- [ ] Registre des traitements créé
- [ ] Sous-traitants (Stripe, etc.) : contrats DPA signés
- [ ] Assurance responsabilité civile professionnelle

---

## 📢 Communication

### Marketing de Lancement

- [ ] Stratégie de lancement définie
- [ ] Réseaux sociaux créés
- [ ] Site web de présentation en ligne
- [ ] Communiqué de presse préparé
- [ ] Budget marketing alloué
- [ ] Premiers artisans recrutés
- [ ] Beta testeurs identifiés

---

## 🎉 Lancement

### Soft Launch (Recommandé)

- [ ] Lancement dans une ville pilote
- [ ] Groupe de testeurs réels (50-100 personnes)
- [ ] Feedback collecté
- [ ] Bugs critiques corrigés
- [ ] Ajustements effectués

### Hard Launch

- [ ] App publiée sur App Store
- [ ] App publiée sur Google Play
- [ ] Annonce officielle
- [ ] Support client opérationnel 24/7
- [ ] Plan de scaling prêt

---

## 🔥 Post-Lancement

### Première Semaine

- [ ] Monitoring quotidien
- [ ] Support réactif (< 2h)
- [ ] Correction rapide des bugs critiques
- [ ] Collecte des premiers retours

### Premier Mois

- [ ] Analyse des métriques
- [ ] Optimisations basées sur les données
- [ ] Recrutement d'artisans supplémentaires
- [ ] Roadmap V1.1 planifiée

---

## 📝 Notes

**Date de démarrage de la checklist** : __________

**Date de lancement prévue** : __________

**Responsable déploiement** : __________

---

## 🆘 En Cas de Problème

### Rollback Plan

Si un problème majeur survient après déploiement :

1. **Identifier** le problème rapidement
2. **Communiquer** : informer les utilisateurs
3. **Rollback** : revenir à la version précédente si nécessaire
4. **Corriger** : fix rapide
5. **Tester** : validation complète
6. **Redéployer** : nouvelle version stable

### Contacts d'Urgence

- **Expo Support** : https://expo.dev/support
- **Apple Support** : https://developer.apple.com/support/
- **Google Support** : https://support.google.com/googleplay/android-developer
- **Stripe Support** : https://support.stripe.com/

---

**✅ Quand tous les points sont cochés, vous êtes prêt à déployer !**
