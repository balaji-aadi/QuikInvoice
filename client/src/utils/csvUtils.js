/**
 * QuikInvoice — CSV & Excel Data Import / Export Utilities
 * Handles robust parsing, generation, escaping, and browser downloads.
 */

/**
 * Trigger browser file download from string content
 */
export function downloadFile(filename, content, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape a CSV field value
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Robust CSV parser supporting quotes, commas, and newlines
 */
export function parseCsv(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

// ==========================================
// CLIENTS CSV OPERATIONS
// ==========================================

export function exportClientsToCsv(clients = []) {
  const headers = ['Client ID', 'Name', 'Email', 'Phone', 'Address', 'Invoices Count', 'Created At'];
  const rows = clients.map((c) => [
    escapeCsv(c.id),
    escapeCsv(c.name),
    escapeCsv(c.email),
    escapeCsv(c.phone || ''),
    escapeCsv(c.address || ''),
    escapeCsv(c.invoice_count || 0),
    escapeCsv(c.created_at || ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(`quikinvoice_clients_${dateStr}.csv`, csv);
}

export function downloadClientsTemplate() {
  const template = `Name,Email,Phone,Address
"Acme Technologies Pvt Ltd","billing@acmetech.in","+91 98765 43210","Level 4, Cyber City, Hyderabad, Telangana"
"Nexus Digital Agency","accounts@nexusdigital.co","+91 91234 56789","45 Indiranagar 100ft Road, Bangalore, Karnataka"
"Vortex Cloud Systems","finance@vortexcloud.io","+91 99887 76655","Tower B, Sector 62, Noida, Uttar Pradesh"`;

  downloadFile('clients_import_template.csv', template);
}

// ==========================================
// INVOICES CSV OPERATIONS
// ==========================================

export function exportInvoicesToCsv(invoices = []) {
  const headers = [
    'Invoice ID',
    'Invoice Number',
    'Client Name',
    'Client Email',
    'Issue Date',
    'Due Date',
    'Status',
    'Subtotal (INR)',
    'Tax Total (INR)',
    'Total Amount (INR)',
    'Amount Paid (INR)',
    'Amount Due (INR)',
    'Created At',
  ];

  const rows = invoices.map((inv) => [
    escapeCsv(inv.id),
    escapeCsv(inv.invoice_number),
    escapeCsv(inv.client_name || ''),
    escapeCsv(inv.client_email || ''),
    escapeCsv(inv.issue_date),
    escapeCsv(inv.due_date),
    escapeCsv(inv.status),
    escapeCsv(inv.subtotal),
    escapeCsv(inv.tax_total),
    escapeCsv(inv.total_amount),
    escapeCsv(inv.amount_paid),
    escapeCsv(inv.amount_due),
    escapeCsv(inv.created_at || ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(`quikinvoice_invoices_${dateStr}.csv`, csv);
}

export function downloadInvoicesTemplate() {
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  const dueStr = dueDate.toISOString().split('T')[0];

  const template = `Client Email,Issue Date,Due Date,Description,Quantity,Unit Price (INR),Tax Rate (%),Notes
"billing@acmetech.in","${today}","${dueStr}","Cloud Infrastructure & Devops Support",1,45000,18,"Payment requested within 30 days via NEFT/UPI"
"accounts@nexusdigital.co","${today}","${dueStr}","Web Application Development (Milestone 1)",1,125000,18,"Deliverables completed and signed off"`;

  downloadFile('invoices_import_template.csv', template);
}
