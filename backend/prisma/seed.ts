import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

async function main() {
    console.log('🌱 Start seeding academic levels...');

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL non trouvée dans .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: databaseUrl,
    });

    try {
        await client.connect();

        const academicLevels = [
            // --- Formations de base ---
            {
                id: 0,
                code: 'presciences',
                name: 'Presciences',
                displayName: 'Presciences / Géologie',
                order: 0
            },
            {
                id: 1,
                code: 'b1',
                name: 'Licence 1',
                displayName: 'B1 / Géologie',
                order: 1
            },
            {
                id: 2,
                code: 'b2',
                name: 'Licence 2',
                displayName: 'B2 / Géologie',
                order: 2
            },
            {
                id: 3,
                code: 'b3',
                name: 'Licence 3',
                displayName: 'B3 / Géologie',
                order: 3
            },

            // --- Master 1 : Spécialisations distinctes ---
            {
                id: 4,
                code: 'm1_geotechnique',
                name: 'Master 1 - Géotechnique',
                displayName: 'M1 / Géotechnique',
                order: 4
            },
            {
                id: 5,
                code: 'm1_exploration',
                name: 'Master 1 - Exploration et Géologie Minières',
                displayName: 'M1 / Exploration',
                order: 5
            },
            {
                id: 6,
                code: 'm1_environnement',
                name: 'Master 1 - Environnement et Hydrogéologie',
                displayName: 'M1 / Environnement',
                order: 6
            },

            // --- Master 2 : Spécialisations distinctes ---
            {
                id: 7,
                code: 'm2_geotechnique',
                name: 'Master 2 - Géotechnique',
                displayName: 'M2 / Géotechnique',
                order: 7
            },
            {
                id: 8,
                code: 'm2_exploration',
                name: 'Master 2 - Exploration et Géologie Minières',
                displayName: 'M2 / Exploration',
                order: 8
            },
            {
                id: 9,
                code: 'm2_environnement',
                name: 'Master 2 - Environnement et Hydrogéologie',
                displayName: 'M2 / Environnement',
                order: 9
            }
        ];

        for (const level of academicLevels) {
            // On utilise une requête SQL directe pour insérer avec ID explicite
            const result = await client.query(
                `INSERT INTO "AcademicLevel" (id, code, name, "displayName", "order", "isActive") 
                 VALUES ($1, $2, $3, $4, $5, true) 
                 ON CONFLICT (code) DO UPDATE SET
                    id = EXCLUDED.id,
                    name = EXCLUDED.name,
                    "displayName" = EXCLUDED."displayName",
                    "order" = EXCLUDED."order"
                 RETURNING id, code, "displayName", "order"`,
                [level.id, level.code, level.name, level.displayName, level.order]
            );

            if (result.rows.length > 0) {
                console.log(`✅ Created: ${result.rows[0].displayName}`);
            } else {
                console.log(`⚠️  Exists:  ${level.displayName}`);
            }
        }

        console.log('\n✨ Seeding completed successfully!');
        console.log(`📊 Total levels configured: ${academicLevels.length}`);

    } catch (e) {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
