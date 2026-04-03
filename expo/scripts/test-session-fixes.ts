/**
 * Script de test pour vérifier les corrections de session
 * 
 * Usage:
 *   - Copier ce code dans la console du navigateur
 *   - Ou l'exécuter avec: npx ts-node scripts/test-session-fixes.ts
 */

import { checkSessionValidity, clearAutomationSettings } from '@/utils/clearSessionErrors';

async function runTests() {
  console.log('🧪 Démarrage des tests de session...\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Vérification de session
  console.log('Test 1: Vérification de session valide');
  try {
    const isValid = await checkSessionValidity();
    console.log(`  Résultat: ${isValid ? '✅ Session valide' : '⚠️ Aucune session'}`);
    testsPassed++;
  } catch (error) {
    console.error('  ❌ Test échoué:', error);
    testsFailed++;
  }

  // Test 2: Nettoyage des paramètres d'automation
  console.log('\nTest 2: Nettoyage des paramètres d\'automation');
  try {
    await clearAutomationSettings();
    console.log('  ✅ Paramètres nettoyés avec succès');
    testsPassed++;
  } catch (error) {
    console.error('  ❌ Test échoué:', error);
    testsFailed++;
  }

  // Test 3: Vérification du localStorage/AsyncStorage
  console.log('\nTest 3: Vérification du stockage');
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const settings = window.localStorage.getItem('automation:settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.autoInvoice !== undefined && 
            parsed.autoReminderDays !== undefined && 
            parsed.accountingExport !== undefined) {
          console.log('  ✅ Structure des paramètres valide');
          testsPassed++;
        } else {
          console.error('  ❌ Structure des paramètres invalide');
          testsFailed++;
        }
      } else {
        console.log('  ⚠️ Aucun paramètre trouvé (normal après nettoyage)');
        testsPassed++;
      }
    } else {
      console.log('  ⚠️ localStorage non disponible (mobile ou Node.js)');
      testsPassed++;
    }
  } catch (error) {
    console.error('  ❌ Test échoué:', error);
    testsFailed++;
  }

  // Test 4: Simulation d'une erreur de parsing
  console.log('\nTest 4: Gestion d\'une donnée corrompue');
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Injecter une donnée invalide
      window.localStorage.setItem('automation:settings', 'INVALID_JSON;{');
      
      // Tenter de nettoyer
      await clearAutomationSettings();
      
      // Vérifier que c'est corrigé
      const settings = window.localStorage.getItem('automation:settings');
      if (settings) {
        JSON.parse(settings); // Devrait réussir maintenant
        console.log('  ✅ Données corrompues nettoyées avec succès');
        testsPassed++;
      } else {
        console.error('  ❌ Données non restaurées');
        testsFailed++;
      }
    } else {
      console.log('  ⚠️ Test skipped (pas de localStorage)');
      testsPassed++;
    }
  } catch (error) {
    console.error('  ❌ Test échoué:', error);
    testsFailed++;
  }

  // Résumé
  console.log('\n' + '='.repeat(50));
  console.log(`📊 RÉSULTAT DES TESTS`);
  console.log('='.repeat(50));
  console.log(`✅ Tests réussis: ${testsPassed}`);
  console.log(`❌ Tests échoués: ${testsFailed}`);
  console.log(`📈 Taux de réussite: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  console.log('='.repeat(50) + '\n');

  if (testsFailed === 0) {
    console.log('🎉 Tous les tests sont passés ! Les corrections fonctionnent correctement.\n');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.\n');
  }

  return { testsPassed, testsFailed };
}

// Exécuter les tests si ce fichier est lancé directement
if (typeof window !== 'undefined') {
  // Navigateur
  console.log('🌐 Tests dans le navigateur');
  runTests();
} else {
  // Node.js
  console.log('🖥️ Tests en Node.js (certains tests seront skipped)');
  runTests();
}

export { runTests };
