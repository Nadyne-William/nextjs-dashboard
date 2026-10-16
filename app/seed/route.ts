import bcrypt from 'bcrypt';
import type { TransactionSql } from 'postgres';
import { sql } from '@/app/lib/db';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

// Seeds the demo data. Safe to run more than once: existing rows are left
// alone, and invoices are only inserted into an empty table.
//
// In production this route needs ?secret=<SEED_SECRET>, so a deployed demo
// can't be reseeded by anyone who finds the URL.

async function seedUsers(tx: TransactionSql) {
  await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await tx`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `;
  // Added for role-based access. ALTER keeps databases seeded before roles existed working.
  await tx`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'viewer'`;

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await tx`
      INSERT INTO users (id, name, email, password, role)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword}, ${user.role})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
    `;
  }
}

async function seedCustomers(tx: TransactionSql) {
  await tx`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    )
  `;

  for (const customer of customers) {
    await tx`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedInvoices(tx: TransactionSql) {
  await tx`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    )
  `;

  // Invoices have generated ids, so ON CONFLICT can't stop duplicates on a re-run.
  const [{ count }] = await tx`SELECT COUNT(*)::int AS count FROM invoices`;
  if (count > 0) return;

  for (const invoice of invoices) {
    await tx`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
    `;
  }
}

async function seedRevenue(tx: TransactionSql) {
  await tx`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    )
  `;

  for (const rev of revenue) {
    await tx`
      INSERT INTO revenue (month, revenue)
      VALUES (${rev.month}, ${rev.revenue})
      ON CONFLICT (month) DO NOTHING
    `;
  }
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    const secret = new URL(request.url).searchParams.get('secret');
    if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
  }

  try {
    await sql.begin(async (tx) => {
      await seedUsers(tx);
      await seedCustomers(tx);
      await seedInvoices(tx);
      await seedRevenue(tx);
    });

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed failed:', error);
    return Response.json({ error: 'Seeding failed. Check the server logs.' }, { status: 500 });
  }
}
