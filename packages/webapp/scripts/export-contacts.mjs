import { Client } from 'pg';
import contactCsv from './contactCsv.cjs';

const { csvCell } = contactCsv;

if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL to export member contacts.');
  process.exitCode = 1;
} else {
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5_000 });
  try {
    await db.connect();
    const { rows } = await db.query(`
      select distinct contact_email from users
      where marketing_opt_in and nullif(contact_email, '') is not null
      order by contact_email
    `);
    process.stdout.write('contact_email\n');
    for (const { contact_email } of rows) process.stdout.write(`${csvCell(contact_email)}\n`);
  } catch {
    console.error('Could not export member contacts.');
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}
