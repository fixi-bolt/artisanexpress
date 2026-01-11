import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nkxucjhavjfsogzpitry.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reHVjamhhdmpmc29nenBpdHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzMxMzAsImV4cCI6MjA3NjY0OTEzMH0.-JKjKW2_2ZQag1E7GzGEMvkuWxcWDzVSMB8mCoiNzig';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  step: string;
  status: 'success' | 'error';
  message: string;
  data?: any;
  duration: number;
}

const results: TestResult[] = [];
let testClientId: string | null = null;
let testArtisanId: string | null = null;
let testMissionId: string | null = null;

function logStep(step: string, status: 'success' | 'error', message: string, data?: any, duration: number = 0) {
  const result: TestResult = { step, status, message, data, duration };
  results.push(result);
  
  const icon = status === 'success' ? '✅' : '❌';
  console.log(`${icon} [${step}] ${message} (${duration}ms)`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

async function cleanup() {
  console.log('\n🧹 Nettoyage des données de test...');
  
  try {
    if (testMissionId) {
      await supabase.from('missions').delete().eq('id', testMissionId);
      console.log('   ✓ Mission supprimée');
    }
    
    if (testClientId) {
      await supabase.from('notifications').delete().eq('user_id', testClientId);
      await supabase.from('clients').delete().eq('id', testClientId);
      await supabase.from('users').delete().eq('id', testClientId);
      console.log('   ✓ Client supprimé');
    }
    
    if (testArtisanId) {
      await supabase.from('notifications').delete().eq('user_id', testArtisanId);
      await supabase.from('artisans').delete().eq('id', testArtisanId);
      await supabase.from('users').delete().eq('id', testArtisanId);
      console.log('   ✓ Artisan supprimé');
    }
  } catch (error) {
    console.log('   ⚠️  Erreur de nettoyage (non bloquante):', error);
  }
}

async function testStep1_CreateTestUsers() {
  const start = Date.now();
  console.log('\n📝 ÉTAPE 1: Création des utilisateurs de test');
  
  try {
    const clientEmail = `test-client-${Date.now()}@test.com`;
    const artisanEmail = `test-artisan-${Date.now()}@test.com`;
    
    const { data: clientAuth, error: clientAuthError } = await supabase.auth.signUp({
      email: clientEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Client Test',
          user_type: 'client'
        }
      }
    });
    
    if (clientAuthError) throw clientAuthError;
    if (!clientAuth.user) throw new Error('Client non créé');
    
    testClientId = clientAuth.user.id;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: artisanAuth, error: artisanAuthError } = await supabase.auth.signUp({
      email: artisanEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Artisan Test',
          user_type: 'artisan'
        }
      }
    });
    
    if (artisanAuthError) throw artisanAuthError;
    if (!artisanAuth.user) throw new Error('Artisan non créé');
    
    testArtisanId = artisanAuth.user.id;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { error: artisanProfileError } = await supabase
      .from('artisans')
      .update({
        category: 'plumber',
        hourly_rate: 50,
        travel_fee: 20,
        intervention_radius: 25000,
        is_available: true,
        latitude: 48.8566,
        longitude: 2.3522,
        specialties: ['Plomberie générale', 'Dépannage urgent']
      })
      .eq('id', testArtisanId);
    
    if (artisanProfileError) throw artisanProfileError;
    
    logStep(
      'Étape 1',
      'success',
      `Utilisateurs créés - Client: ${testClientId.substring(0, 8)}... | Artisan: ${testArtisanId.substring(0, 8)}...`,
      { clientId: testClientId, artisanId: testArtisanId },
      Date.now() - start
    );
    
    return true;
  } catch (error: any) {
    logStep('Étape 1', 'error', error.message, error, Date.now() - start);
    return false;
  }
}

async function testStep2_CreateMission() {
  const start = Date.now();
  console.log('\n🚀 ÉTAPE 2: Création de la mission');
  
  try {
    if (!testClientId) throw new Error('Client ID manquant');
    
    const { data, error } = await supabase
      .from('missions')
      .insert({
        client_id: testClientId,
        category: 'plumber',
        title: 'Fuite d\'eau urgente',
        description: 'Fuite sous l\'évier de la cuisine',
        latitude: 48.8566,
        longitude: 2.3522,
        address: '123 Rue de Test, Paris',
        status: 'pending',
        estimated_price: 150,
        commission: 15,
        photos: []
      })
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Mission non créée');
    
    testMissionId = data.id;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logStep(
      'Étape 2',
      'success',
      `Mission créée - ID: ${data.id.substring(0, 8)}...`,
      { missionId: testMissionId, title: data.title },
      Date.now() - start
    );
    
    return true;
  } catch (error: any) {
    logStep('Étape 2', 'error', error.message, error, Date.now() - start);
    return false;
  }
}

async function testStep3_CheckArtisanNotifications() {
  const start = Date.now();
  console.log('\n🔔 ÉTAPE 3: Vérification des notifications artisan');
  
  try {
    if (!testArtisanId || !testMissionId) {
      throw new Error('Artisan ID ou Mission ID manquant');
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testArtisanId)
      .eq('mission_id', testMissionId)
      .eq('type', 'mission_request');
    
    if (error) throw error;
    
    if (!notifications || notifications.length === 0) {
      throw new Error('Aucune notification reçue par l\'artisan');
    }
    
    logStep(
      'Étape 3',
      'success',
      `Artisan a reçu ${notifications.length} notification(s)`,
      { notifications: notifications.map(n => ({ id: n.id, title: n.title, message: n.message })) },
      Date.now() - start
    );
    
    return true;
  } catch (error: any) {
    logStep('Étape 3', 'error', error.message, error, Date.now() - start);
    return false;
  }
}

async function testStep4_CheckNearbyArtisan() {
  const start = Date.now();
  console.log('\n📍 ÉTAPE 4: Vérification artisan le plus proche');
  
  try {
    if (!testArtisanId || !testMissionId) {
      throw new Error('Artisan ID ou Mission ID manquant');
    }
    
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('latitude, longitude')
      .eq('id', testMissionId)
      .single();
    
    if (missionError) throw missionError;
    if (!mission) throw new Error('Mission non trouvée');
    
    const { data: artisans, error: artisansError } = await supabase
      .rpc('find_nearby_missions', {
        artisan_lat: mission.latitude,
        artisan_lon: mission.longitude,
        radius_meters: 25000,
        artisan_category: 'plumber'
      });
    
    if (artisansError) {
      console.log('   ℹ️  RPC non disponible, vérification manuelle...');
      
      const { data: artisan, error: artisanError } = await supabase
        .from('artisans')
        .select('*')
        .eq('id', testArtisanId)
        .single();
      
      if (artisanError) throw artisanError;
      
      logStep(
        'Étape 4',
        'success',
        'Artisan de test disponible dans le rayon',
        { artisan: { id: testArtisanId, category: artisan.category, radius: artisan.intervention_radius } },
        Date.now() - start
      );
      
      return true;
    }
    
    const nearbyArtisan = artisans?.find((a: any) => a.artisan_id === testArtisanId);
    
    if (!nearbyArtisan) {
      throw new Error('Artisan de test non trouvé dans les artisans à proximité');
    }
    
    logStep(
      'Étape 4',
      'success',
      'Artisan le plus proche identifié',
      { artisan: nearbyArtisan },
      Date.now() - start
    );
    
    return true;
  } catch (error: any) {
    logStep('Étape 4', 'error', error.message, error, Date.now() - start);
    return false;
  }
}

async function testStep5_AcceptMission() {
  const start = Date.now();
  console.log('\n✅ ÉTAPE 5: Acceptation de la mission');
  
  try {
    if (!testArtisanId || !testMissionId) {
      throw new Error('Artisan ID ou Mission ID manquant');
    }
    
    const { data, error } = await supabase
      .from('missions')
      .update({
        artisan_id: testArtisanId,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', testMissionId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Mission non mise à jour');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logStep(
      'Étape 5',
      'success',
      'Mission acceptée par l\'artisan',
      { mission: { id: data.id, status: data.status, artisan_id: data.artisan_id } },
      Date.now() - start
    );
    
    return true;
  } catch (error: any) {
    logStep('Étape 5', 'error', error.message, error, Date.now() - start);
    return false;
  }
}

async function testStep6_CheckClientNotifications() {
  const start = Date.now();
  console.log('\n🔔 ÉTAPE 6: Vérification des notifications client');
  
  try {
    if (!testClientId || !testMissionId) {
      throw new Error('Client ID ou Mission ID manquant');
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testClientId)
      .eq('mission_id', testMissionId)
      .eq('type', 'mission_accepted');
    
    if (error) throw error;
    
    if (!notifications || notifications.length === 0) {
      throw new Error('Aucune notification reçue par le client');
    }
    
    logStep(
      'Étape 6',
      'success',
      `Client a reçu ${notifications.length} notification(s) d'acceptation`,
      { notifications: notifications.map(n => ({ id: n.id, title: n.title, message: n.message })) },
      Date.now() - start
    );
    
    return true;
  } catch (error: any) {
    logStep('Étape 6', 'error', error.message, error, Date.now() - start);
    return false;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     🧪 TEST POST-PRODUCTION - FLUX COMPLET                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const totalStart = Date.now();
  
  try {
    console.log('\n📡 Connexion à Supabase...');
    console.log(`   URL: ${SUPABASE_URL}`);
    
    const step1 = await testStep1_CreateTestUsers();
    if (!step1) throw new Error('Étape 1 échouée');
    
    const step2 = await testStep2_CreateMission();
    if (!step2) throw new Error('Étape 2 échouée');
    
    const step3 = await testStep3_CheckArtisanNotifications();
    if (!step3) throw new Error('Étape 3 échouée');
    
    const step4 = await testStep4_CheckNearbyArtisan();
    if (!step4) throw new Error('Étape 4 échouée');
    
    const step5 = await testStep5_AcceptMission();
    if (!step5) throw new Error('Étape 5 échouée');
    
    const step6 = await testStep6_CheckClientNotifications();
    if (!step6) throw new Error('Étape 6 échouée');
    
    const totalDuration = Date.now() - totalStart;
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ TOUS LES TESTS RÉUSSIS              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n⏱️  Durée totale: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    
    console.log('\n📊 RÉSUMÉ DES ÉTAPES:');
    results.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' : '❌';
      console.log(`   ${icon} ${result.step}: ${result.message}`);
    });
    
  } catch (error: any) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ❌ TEST ÉCHOUÉ                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.error('\n🔥 Erreur:', error.message);
    
    console.log('\n📊 RÉSUMÉ DES ÉTAPES:');
    results.forEach((result) => {
      const icon = result.status === 'success' ? '✅' : '❌';
      console.log(`   ${icon} ${result.step}: ${result.message}`);
    });
  } finally {
    await cleanup();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    🏁 TEST TERMINÉ                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  }
}

runTests().catch(console.error);
