import { supabase } from '../lib/supabase';
import { mockArtisans } from '../mocks/artisans';
import { mockMissions } from '../mocks/missions';

export async function migrateData() {
  console.log('🚀 Starting data migration...');

  try {
    console.log('\n📦 Step 1: Migrating Users...');
    const userInserts = [];

    const mockClient = {
      id: 'cli-1',
      email: 'alex.durand@email.com',
      name: 'Alexandre Durand',
      phone: '+33 6 98 76 54 32',
      photo: 'https://i.pravatar.cc/150?img=68',
      user_type: 'client',
      rating: 4.9,
      review_count: 45,
    };

    userInserts.push(mockClient);

    for (const artisan of mockArtisans) {
      userInserts.push({
        id: artisan.id,
        email: artisan.email,
        name: artisan.name,
        phone: artisan.phone,
        photo: artisan.photo,
        user_type: 'artisan',
        rating: artisan.rating,
        review_count: artisan.reviewCount,
      });
    }

    const { error: usersError } = await supabase
      .from('users')
      .upsert(userInserts);

    if (usersError) throw usersError;
    console.log(`✅ ${userInserts.length} users migrated`);

    console.log('\n📦 Step 2: Migrating Clients...');
    const { error: clientError } = await supabase
      .from('clients')
      .upsert([{ id: 'cli-1' }]);

    if (clientError) throw clientError;
    console.log('✅ Client migrated');

    console.log('\n📦 Step 3: Migrating Artisans...');
    const artisanInserts = mockArtisans.map(a => ({
      id: a.id,
      category: a.category,
      hourly_rate: a.hourlyRate,
      travel_fee: a.travelFee,
      intervention_radius: a.interventionRadius,
      is_available: a.isAvailable,
      latitude: a.location?.latitude,
      longitude: a.location?.longitude,
      completed_missions: a.completedMissions,
      specialties: a.specialties,
      is_suspended: false,
    }));

    const { error: artisansError } = await supabase
      .from('artisans')
      .upsert(artisanInserts);

    if (artisansError) throw artisansError;
    console.log(`✅ ${artisanInserts.length} artisans migrated`);

    console.log('\n📦 Step 4: Migrating Payment Methods...');
    const { error: pmError } = await supabase
      .from('payment_methods')
      .upsert([
        {
          id: 'pm-1',
          client_id: 'cli-1',
          type: 'card',
          last4: '4242',
          is_default: true,
        },
      ]);

    if (pmError) throw pmError;
    console.log('✅ Payment methods migrated');

    console.log('\n📦 Step 5: Migrating Missions...');
    const missionInserts = mockMissions.map(m => ({
      id: m.id,
      client_id: m.clientId,
      artisan_id: m.artisanId || null,
      category: m.category,
      title: m.title,
      description: m.description,
      photos: m.photos || [],
      latitude: m.location.latitude,
      longitude: m.location.longitude,
      address: m.location.address,
      status: m.status,
      estimated_price: m.estimatedPrice,
      final_price: m.finalPrice,
      commission: m.commission,
      created_at: m.createdAt.toISOString(),
      accepted_at: m.acceptedAt?.toISOString(),
      completed_at: m.completedAt?.toISOString(),
      eta: m.eta,
      artisan_latitude: m.artisanLocation?.latitude,
      artisan_longitude: m.artisanLocation?.longitude,
    }));

    const { error: missionsError } = await supabase
      .from('missions')
      .upsert(missionInserts);

    if (missionsError) throw missionsError;
    console.log(`✅ ${missionInserts.length} missions migrated`);

    console.log('\n📦 Step 6: Creating Wallets...');
    const walletInserts = mockArtisans.map(a => ({
      artisan_id: a.id,
      balance: Math.random() * 3000,
      pending_balance: 0,
      total_earnings: Math.random() * 20000,
      total_withdrawals: Math.random() * 15000,
    }));

    const { error: walletsError } = await supabase
      .from('wallets')
      .upsert(walletInserts);

    if (walletsError) throw walletsError;
    console.log(`✅ ${walletInserts.length} wallets created`);

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('\n✅ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}
