import { query, withTransaction } from '../config/db.js';
import { calculateInvoiceTotals } from '../utils/money.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INDIAN_CITIES = [
  'Bengaluru, Karnataka',
  'Mumbai, Maharashtra',
  'Hyderabad, Telangana',
  'Pune, Maharashtra',
  'Chennai, Tamil Nadu',
  'Gurugram, Haryana',
  'Noida, Uttar Pradesh',
  'New Delhi, Delhi',
  'Kolkata, West Bengal',
  'Ahmedabad, Gujarat',
  'Kochi, Kerala',
  'Jaipur, Rajasthan',
  'Chandigarh, Punjab',
  'Indore, Madhya Pradesh',
  'Coimbatore, Tamil Nadu',
];

const COMPANY_PREFIXES = [
  'Apex', 'Zenith', 'Nexus', 'Vanguard', 'Paramount', 'Aura', 'Quantum', 'Starlight',
  'Titan', 'Summit', 'Pinnacle', 'Radiant', 'Bluechip', 'Trident', 'Vertex', 'Synergy',
  'Matrix', 'Omega', 'Solaris', 'Falcon', 'Beacon', 'Elevate', 'Kavach', 'Sutra', 'Ananta',
];

const INDUSTRY_DOMAINS = [
  'Technologies', 'Digital Solutions', 'Consulting Group', 'Infotech', 'Cloud Systems',
  'Logistics Pvt Ltd', 'Enterprises', 'Ventures India', 'Software Labs', 'Networks',
  'Financial Services', 'Media & Works', 'Engineering Works', 'Security Systems', 'Retail India',
];

const LINE_ITEM_SERVICES = [
  { desc: 'Cloud Infrastructure Architecture & DevOps', price: 65000, tax: 18 },
  { desc: 'Full-Stack Web Application Engineering', price: 120000, tax: 18 },
  { desc: 'API Security Penetration Testing & Audit', price: 45000, tax: 18 },
  { desc: 'Quarterly GST Accounting & Financial Filing', price: 25000, tax: 18 },
  { desc: 'PostgreSQL Database Performance Tuning', price: 35000, tax: 18 },
  { desc: 'React Component Design System Sprint', price: 50000, tax: 18 },
  { desc: 'Enterprise Single Sign-On (SSO) Integration', price: 40000, tax: 18 },
  { desc: 'Monthly SLA Platform Maintenance & Support', price: 30000, tax: 18 },
  { desc: 'Data Pipeline ETL & Real-Time Sync', price: 75000, tax: 18 },
  { desc: 'Mobile Application Wireframe & UX Prototyping', price: 28000, tax: 18 },
  { desc: 'Zero-Downtime Multi-Region Database Migration', price: 85000, tax: 18 },
  { desc: 'Domain Registrar & SSL Certificate Security Kit', price: 12000, tax: 18 },
  { desc: 'Hardware Server Maintenance (Nil-Rated)', price: 15000, tax: 0 },
  { desc: 'Essential Cloud Backup Storage (5% GST)', price: 8000, tax: 5 },
  { desc: 'Telecom Bandwidth Allocation (12% GST)', price: 18000, tax: 12 },
  { desc: 'Luxury Corporate Hospitality Suite (28% GST)', price: 95000, tax: 28 },
];

function generateClientData(index) {
  const prefix = COMPANY_PREFIXES[index % COMPANY_PREFIXES.length];
  const industry = INDUSTRY_DOMAINS[Math.floor(index / COMPANY_PREFIXES.length) % INDUSTRY_DOMAINS.length];
  const city = INDIAN_CITIES[index % INDIAN_CITIES.length];
  const numSuffix = index >= 50 ? ` ${Math.floor(index / 10) * 10 + (index % 10)}` : '';
  const name = `${prefix} ${industry}${numSuffix}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = `billing@${slug}.in`;
  const phone = `+91 98${String(10000000 + index * 41).slice(0, 8)}`;
  const address = `Plot ${100 + (index % 500)}, Cyber Park, Sector ${12 + (index % 40)}, ${city} - ${560001 + (index % 900)}`;

  return { name, email, phone, address };
}

export async function seedBulkData() {
  console.log('--- Starting Bulk Demo Data Seeder ---');

  // 1. Locate Target User (User ID 4: balaji2000@gmail.com, or active user)
  let [users] = await query("SELECT id, email, name FROM users WHERE email = 'balaji2000@gmail.com'");
  let targetUser = users[0];
  if (!targetUser) {
    [users] = await query('SELECT id, email, name FROM users ORDER BY id ASC LIMIT 1');
    targetUser = users[0];
  }

  if (!targetUser) {
    console.error('No users found in database to attach demo data.');
    process.exit(1);
  }

  const userId = targetUser.id;
  console.log(`Seeding data for User ID ${userId}: ${targetUser.email} (${targetUser.name})`);

  // 2. Seed 200 Clients
  const [existingClients] = await query('SELECT id, email FROM clients WHERE user_id = ?', [userId]);
  const existingEmails = new Set(existingClients.map((c) => c.email.toLowerCase()));
  const allClientRows = [];

  for (let i = 1; i <= 200; i++) {
    const client = generateClientData(i);
    allClientRows.push(client);
    if (!existingEmails.has(client.email.toLowerCase())) {
      await query(
        'INSERT INTO clients (user_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
        [userId, client.name, client.email, client.phone, client.address]
      );
    }
  }

  const [dbClients] = await query('SELECT id, name, email FROM clients WHERE user_id = ? ORDER BY id ASC', [userId]);
  console.log(`Successfully verified ${dbClients.length} clients in database for user ${userId}.`);

  // 3. Seed 100 Invoices
  const [existingInvoices] = await query('SELECT id FROM invoices WHERE user_id = ?', [userId]);
  const currentInvoiceCount = existingInvoices.length;
  const invoicesToCreate = Math.max(0, 100 - currentInvoiceCount);

  console.log(`Current invoices: ${currentInvoiceCount}. Creating ${invoicesToCreate} realistic invoices...`);

  // Status distributions:
  // 1-45: PAID
  // 46-70: ISSUED
  // 71-85: PARTIALLY_PAID
  // 86-95: OVERDUE (due_date in past, status ISSUED or PARTIALLY_PAID)
  // 96-100: DRAFT

  const now = new Date();

  for (let i = 1; i <= invoicesToCreate; i++) {
    const invIndex = currentInvoiceCount + i;
    const client = dbClients[(invIndex - 1) % dbClients.length];
    const invNumber = `INV-2026-${String(invIndex).padStart(4, '0')}`;

    // Status logic
    let targetStatus = 'PAID';
    let isOverdue = false;
    let paymentFraction = 1.0;

    if (invIndex <= 45) {
      targetStatus = 'PAID';
      paymentFraction = 1.0;
    } else if (invIndex <= 70) {
      targetStatus = 'ISSUED';
      paymentFraction = 0.0;
    } else if (invIndex <= 85) {
      targetStatus = 'PARTIALLY_PAID';
      paymentFraction = 0.5;
    } else if (invIndex <= 95) {
      targetStatus = 'ISSUED';
      isOverdue = true;
      paymentFraction = 0.0;
    } else {
      targetStatus = 'DRAFT';
      paymentFraction = 0.0;
    }

    // Dates
    const issueDaysAgo = isOverdue ? 45 + (invIndex % 30) : 5 + (invIndex % 20);
    const dueDaysOffset = isOverdue ? -10 - (invIndex % 15) : 15 + (invIndex % 15);

    const issueDateObj = new Date(now.getTime() - issueDaysAgo * 24 * 60 * 60 * 1000);
    const dueDateObj = new Date(issueDateObj.getTime() + (isOverdue ? 15 : 30) * 24 * 60 * 60 * 1000);

    const issueDate = issueDateObj.toISOString().split('T')[0];
    const dueDate = dueDateObj.toISOString().split('T')[0];

    // Pick 1 to 3 line items
    const itemCount = 1 + (invIndex % 3);
    const rawItems = [];
    for (let k = 0; k < itemCount; k++) {
      const service = LINE_ITEM_SERVICES[(invIndex + k * 4) % LINE_ITEM_SERVICES.length];
      const qty = 1 + ((invIndex + k) % 3);
      rawItems.push({
        description: service.desc,
        quantity: qty,
        unitPrice: service.price,
        taxRate: service.tax,
      });
    }

    const totals = calculateInvoiceTotals(rawItems, 0);
    const totalAmount = parseFloat(totals.totalAmount);
    const amountPaid = targetStatus === 'PAID'
      ? totalAmount
      : targetStatus === 'PARTIALLY_PAID'
      ? Math.round(totalAmount * paymentFraction * 100) / 100
      : 0.0;
    const amountDue = Math.max(0, Math.round((totalAmount - amountPaid) * 100) / 100);

    // Insert invoice
    const [invRes] = await query(
      `INSERT INTO invoices (
        user_id, client_id, invoice_number, status, 
        issue_date, due_date, subtotal, tax_total, 
        total_amount, amount_paid, amount_due, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        client.id,
        invNumber,
        targetStatus,
        issueDate,
        dueDate,
        totals.subtotal,
        totals.taxTotal,
        totalAmount,
        amountPaid,
        amountDue,
        `Standard billing terms. Direct payment via NEFT/RTGS to HDFC Bank or UPI. Thank you for your partnership.`
      ]
    );

    const invoiceId = invRes.insertId;

    // Insert invoice items
    for (const item of totals.processedItems) {
      await query(
        `INSERT INTO invoice_items (
          invoice_id, description, quantity, unit_price, 
          tax_rate, line_subtotal, line_tax, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.description,
          item.quantity,
          item.unitPrice,
          item.taxRate,
          item.lineSubtotal,
          item.lineTax,
          item.lineTotal,
        ]
      );
    }

    // Insert payment record if paid or partially paid
    if (amountPaid > 0) {
      const paymentDate = new Date(issueDateObj.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const methods = ['BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'CHECK'];
      const method = methods[invIndex % methods.length];
      const ref = `TXN-${issueDateObj.getFullYear()}-${String(10000 + invIndex)}`;

      await query(
        `INSERT INTO invoice_payments (
          invoice_id, amount, payment_date, payment_method, reference, notes
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          amountPaid,
          paymentDate,
          method,
          ref,
          targetStatus === 'PAID' ? 'Full settlement verified' : 'Partial milestone payment'
        ]
      );
    }
  }

  // 4. Generate CSV files for testing import/export
  const clientCsvHeaders = 'name,email,phone,address\n';
  const clientCsvRows = allClientRows
    .map((c) => `"${c.name}","${c.email}","${c.phone}","${c.address}"`)
    .join('\n');
  const clientCsvContent = clientCsvHeaders + clientCsvRows;

  const publicDir = path.resolve(__dirname, '../../../client/public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sample_200_clients.csv'), clientCsvContent, 'utf-8');
  console.log(`Generated client/public/sample_200_clients.csv (${allClientRows.length} rows)`);

  // Also generate 100 sample invoices CSV
  const invoiceCsvHeaders = 'client_email,invoice_number,issue_date,due_date,description,quantity,unit_price,tax_rate,notes\n';
  const invoiceCsvRows = [];
  for (let i = 1; i <= 100; i++) {
    const c = allClientRows[(i - 1) % allClientRows.length];
    const s = LINE_ITEM_SERVICES[i % LINE_ITEM_SERVICES.length];
    const invNum = `SAMPLE-INV-${String(i).padStart(4, '0')}`;
    invoiceCsvRows.push(
      `"${c.email}","${invNum}","2026-10-01","2026-10-31","${s.desc}",1,${s.price},${s.tax},"Payment via RTGS/NEFT"`
    );
  }
  const invoiceCsvContent = invoiceCsvHeaders + invoiceCsvRows.join('\n');
  fs.writeFileSync(path.join(publicDir, 'sample_100_invoices.csv'), invoiceCsvContent, 'utf-8');
  console.log(`Generated client/public/sample_100_invoices.csv (100 rows)`);

  console.log('--- Bulk Demo Data Seeding Complete ---');
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedBulkData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
