/**
 * Script to seed the Supabase database with client authorization data
 *
 * Run this script with: npx tsx scripts/seed-database.ts
 *
 * Make sure to set NEXT_PUBLIC_SUPABASE_KEY environment variable first!
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gdjqnlvkfgsfaybhnncj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

if (!supabaseKey) {
  console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_KEY environment variable not set!');
  console.log('Please set it in your .env.local file or run:');
  console.log('NEXT_PUBLIC_SUPABASE_KEY=your_key npx tsx scripts/seed-database.ts');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Client data with authorizations
// TODO: Fill this with the actual authorization data from the screenshots
const clientsData = [
  {
    name: 'Tschida, Klaus',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligung: {
      gueltig_von: '2025-01-01',
      gueltig_bis: '2025-12-31',
      status: 'aktiv',
      pflegedienst_name: 'DomusVita Gesundheit GmbH',
      pflegedienst_standort: 'Kreuzberg',
      pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
      pflegedienst_telefon: '030/6120152-0',
      pflegedienst_email: 'kreuzberg@domusvita.de',
      pflegedienst_ik: '461104096',
      leistungen: [
        // TODO: Add actual LK codes and quantities from screenshots
        // Example: { lk_code: 'LK1', menge: 10 },
      ],
    },
  },
  {
    name: 'Sweidan, Omar',
    pflegegrad: 2,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligung: {
      gueltig_von: '2025-04-01',
      gueltig_bis: '2025-10-31',
      status: 'aktiv',
      pflegedienst_name: 'DomusVita Gesundheit GmbH',
      pflegedienst_standort: 'Kreuzberg',
      pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
      pflegedienst_telefon: '030/6120152-0',
      pflegedienst_email: 'kreuzberg@domusvita.de',
      pflegedienst_ik: '461104096',
      leistungen: [],
    },
  },
  {
    name: 'Sommermann, Ulrich',
    pflegegrad: 3,
    adresse: 'Kreuzberg, Berlin',
    pflegedienst: 'DomusVita Gesundheit GmbH',
    standort: 'Kreuzberg',
    stadtteil: 'Kreuzberg / Sievos',
    pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
    bewilligung: {
      gueltig_von: '2025-02-01',
      gueltig_bis: '2025-12-31',
      status: 'aktiv',
      pflegedienst_name: 'DomusVita Gesundheit GmbH',
      pflegedienst_standort: 'Kreuzberg',
      pflegedienst_adresse: 'Waldemarstraße 10 A, 10999 Berlin',
      pflegedienst_telefon: '030/6120152-0',
      pflegedienst_email: 'kreuzberg@domusvita.de',
      pflegedienst_ik: '461104096',
      leistungen: [],
    },
  },
  // Add remaining 15 clients here...
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await supabase.from('leistungen').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bewilligungen').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('klienten').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    let totalClients = 0;
    let totalAuthorizations = 0;
    let totalServices = 0;

    // Insert clients with their authorizations
    for (const clientData of clientsData) {
      console.log(`\n➕ Adding client: ${clientData.name}`);

      // Insert client
      const { data: client, error: clientError } = await supabase
        .from('klienten')
        .insert([
          {
            name: clientData.name,
            pflegegrad: clientData.pflegegrad,
            adresse: clientData.adresse,
            pflegedienst: clientData.pflegedienst,
            standort: clientData.standort,
            stadtteil: clientData.stadtteil,
            pflegedienst_adresse: clientData.pflegedienst_adresse,
          },
        ])
        .select()
        .single();

      if (clientError) {
        console.error(`❌ Error inserting client ${clientData.name}:`, clientError);
        continue;
      }

      totalClients++;
      console.log(`   ✅ Client created with ID: ${client.id}`);

      // Insert authorization
      const { data: bewilligung, error: bewilligungError } = await supabase
        .from('bewilligungen')
        .insert([
          {
            klient_id: client.id,
            gueltig_von: clientData.bewilligung.gueltig_von,
            gueltig_bis: clientData.bewilligung.gueltig_bis,
            status: clientData.bewilligung.status,
            pflegedienst_name: clientData.bewilligung.pflegedienst_name,
            pflegedienst_standort: clientData.bewilligung.pflegedienst_standort,
            pflegedienst_adresse: clientData.bewilligung.pflegedienst_adresse,
            pflegedienst_telefon: clientData.bewilligung.pflegedienst_telefon,
            pflegedienst_email: clientData.bewilligung.pflegedienst_email,
            pflegedienst_ik: clientData.bewilligung.pflegedienst_ik,
          },
        ])
        .select()
        .single();

      if (bewilligungError) {
        console.error(`❌ Error inserting authorization:`, bewilligungError);
        continue;
      }

      totalAuthorizations++;
      console.log(`   ✅ Authorization created (valid until ${clientData.bewilligung.gueltig_bis})`);

      // Insert services (LK codes)
      if (clientData.bewilligung.leistungen.length > 0) {
        const leistungenToInsert = clientData.bewilligung.leistungen.map((l: any) => ({
          bewilligung_id: bewilligung.id,
          lk_code: l.lk_code,
          menge: l.menge,
        }));

        const { error: leistungenError } = await supabase
          .from('leistungen')
          .insert(leistungenToInsert);

        if (leistungenError) {
          console.error(`❌ Error inserting services:`, leistungenError);
        } else {
          totalServices += clientData.bewilligung.leistungen.length;
          console.log(`   ✅ Added ${clientData.bewilligung.leistungen.length} services`);
        }
      } else {
        console.log(`   ⚠️  No services defined for this client`);
      }
    }

    console.log('\n✅ Database seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Clients: ${totalClients}`);
    console.log(`   - Authorizations: ${totalAuthorizations}`);
    console.log(`   - Services: ${totalServices}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();
