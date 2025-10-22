/**
 * 🚨 SCRIPT DE CORRECTION RAPIDE - À copier dans la console du navigateur
 * 
 * Si vous rencontrez des erreurs de session, copiez-collez ce code
 * dans la console du navigateur (F12) et appuyez sur Entrée.
 */

(async function fixSessionErrors() {
  console.log('🧹 Démarrage du nettoyage des sessions...\n');

  try {
    // 1. Nettoyer localStorage
    console.log('📦 Nettoyage du localStorage...');
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('supabase') ||
        key.includes('sb-') ||
        key.includes('automation:settings')
      )) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log('  ✅ Supprimé:', key);
      } catch {
        console.warn('  ⚠️ Impossible de supprimer:', key);
      }
    });

    // 2. Réinitialiser les paramètres d'automation
    console.log('\n🔧 Réinitialisation des paramètres d\'automation...');
    const defaultSettings = {
      autoInvoice: true,
      autoReminderDays: 3,
      accountingExport: 'monthly',
    };
    localStorage.setItem('automation:settings', JSON.stringify(defaultSettings));
    console.log('  ✅ Paramètres réinitialisés');

    // 3. Vider le cache de session
    console.log('\n🗑️ Nettoyage du cache de session...');
    sessionStorage.clear();
    console.log('  ✅ Cache vidé');

    // 4. Résumé
    console.log('\n' + '='.repeat(50));
    console.log('✅ NETTOYAGE TERMINÉ AVEC SUCCÈS');
    console.log('='.repeat(50));
    console.log('\n📋 Actions effectuées:');
    console.log(`  • ${keysToRemove.length} clés supprimées du localStorage`);
    console.log('  • Paramètres d\'automation réinitialisés');
    console.log('  • Cache de session vidé');
    console.log('\n🔄 Veuillez recharger la page (F5) pour appliquer les changements.\n');

    // 5. Proposer de recharger
    if (confirm('✅ Nettoyage terminé ! Recharger la page maintenant ?')) {
      location.reload();
    }

  } catch (error) {
    console.error('\n❌ ERREUR lors du nettoyage:', error);
    console.log('\n💡 Solution alternative:');
    console.log('  1. Ouvrir les DevTools (F12)');
    console.log('  2. Aller dans l\'onglet "Application" (Chrome) ou "Stockage" (Firefox)');
    console.log('  3. Cliquer sur "localStorage" puis "Clear All"');
    console.log('  4. Recharger la page (F5)');
  }
})();

// GUIDE D'UTILISATION :
// 1. Ouvrir la console du navigateur (F12)
// 2. Copier tout ce fichier
// 3. Coller dans la console
// 4. Appuyer sur Entrée
// 5. Suivre les instructions à l'écran
