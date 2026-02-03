
import 'dotenv/config'
import pkg from 'pg'
const { Client } = pkg

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    })
    await client.connect()

    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '_AcademicLevelToCourse'
        `)
        console.table(res.rows)

        const count = await client.query('SELECT count(*) FROM "_AcademicLevelToCourse"')
        console.log("Rows in join table:", count.rows[0].count)

    } catch (e) {
        console.error(e)
    } finally {
        await client.end()
    }
}

main()
