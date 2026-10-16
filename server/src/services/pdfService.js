import PDFDocument from 'pdfkit';

/**
 * PDF Invoice Generator Service
 * Streams a professional vector PDF directly to the HTTP response stream.
 */
export class PdfService {
  /**
   * Render invoice to a writable stream (e.g. Express res)
   * @param {Object} invoice - Full invoice entity with items, payments, and client details
   * @param {Object} user - Business owner entity
   * @param {import('stream').Writable} outputStream - Express res or file stream
   */
  static generateInvoicePdf(invoice, user, outputStream) {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Invoice ${invoice.invoice_number}`,
        Author: user.business_name,
        Subject: `Invoice for ${invoice.client_name}`,
      },
    });

    // Pipe PDFKit output directly to response stream
    doc.pipe(outputStream);

    const primaryColor = '#1e3a8a'; // Deep Navy
    const secondaryColor = '#475569'; // Slate
    const textColor = '#0f172a'; // Near black
    const borderColor = '#e2e8f0'; // Light slate border
    const lightBg = '#f8fafc'; // Table header background

    // ==========================================
    // 1. Header & Business Details
    // ==========================================
    doc
      .fontSize(22)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text(user.business_name, 40, 40);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(secondaryColor);

    let businessY = 68;
    if (user.business_address) {
      doc.text(user.business_address, 40, businessY, { width: 220 });
      businessY += 12;
    }
    if (user.email) {
      doc.text(`Email: ${user.email}`, 40, businessY);
      businessY += 12;
    }
    if (user.business_phone) {
      doc.text(`Phone: ${user.business_phone}`, 40, businessY);
    }

    // Right-aligned "INVOICE" Badge & Metadata
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text('INVOICE', 350, 40, { align: 'right', width: 205 });

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(textColor)
      .text(`# ${invoice.invoice_number}`, 350, 70, { align: 'right', width: 205 });

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(secondaryColor)
      .text(`Issue Date: ${invoice.issue_date}`, 350, 86, { align: 'right', width: 205 })
      .text(`Due Date: ${invoice.due_date}`, 350, 100, { align: 'right', width: 205 })
      .text(`Status: ${invoice.status}`, 350, 114, { align: 'right', width: 205 });

    // Horizontal Divider
    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(40, 140)
      .lineTo(555, 140)
      .stroke();

    // ==========================================
    // 2. Bill To & Client Details
    // ==========================================
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text('BILLED TO:', 40, 155);

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(textColor)
      .text(invoice.client_name, 40, 170);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(secondaryColor);

    let clientY = 186;
    if (invoice.client_email) {
      doc.text(invoice.client_email, 40, clientY);
      clientY += 13;
    }
    if (invoice.client_phone) {
      doc.text(invoice.client_phone, 40, clientY);
      clientY += 13;
    }
    if (invoice.client_address) {
      doc.text(invoice.client_address, 40, clientY, { width: 300 });
      clientY += 15;
    }

    // ==========================================
    // 3. Line Items Table
    // ==========================================
    const tableTop = Math.max(clientY + 20, 240);

    // Table Header Background
    doc
      .rect(40, tableTop, 515, 24)
      .fill(lightBg);

    // Table Header Text
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(primaryColor);

    doc.text('DESCRIPTION', 50, tableTop + 7);
    doc.text('QTY', 280, tableTop + 7, { width: 40, align: 'right' });
    doc.text('UNIT PRICE', 330, tableTop + 7, { width: 70, align: 'right' });
    doc.text('TAX %', 410, tableTop + 7, { width: 45, align: 'right' });
    doc.text('TOTAL', 465, tableTop + 7, { width: 80, align: 'right' });

    // Table Rows
    let currentY = tableTop + 30;
    doc.font('Helvetica').fontSize(9).fillColor(textColor);

    invoice.items.forEach((item, idx) => {
      // Check if near page bottom, create new page if needed
      if (currentY > 700) {
        doc.addPage();
        currentY = 40;
      }

      const itemQty = parseFloat(item.quantity).toFixed(2);
      const itemPrice = `$${parseFloat(item.unit_price).toFixed(2)}`;
      const itemTax = `${parseFloat(item.tax_rate).toFixed(1)}%`;
      const itemTotal = `$${parseFloat(item.line_total).toFixed(2)}`;

      doc.text(item.description, 50, currentY, { width: 220 });
      doc.text(itemQty, 280, currentY, { width: 40, align: 'right' });
      doc.text(itemPrice, 330, currentY, { width: 70, align: 'right' });
      doc.text(itemTax, 410, currentY, { width: 45, align: 'right' });
      doc.text(itemTotal, 465, currentY, { width: 80, align: 'right' });

      // Subtle row line
      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(40, currentY + 16)
        .lineTo(555, currentY + 16)
        .stroke();

      currentY += 24;
    });

    // ==========================================
    // 4. Totals Summary Block
    // ==========================================
    currentY += 15;
    if (currentY > 640) {
      doc.addPage();
      currentY = 40;
    }

    const summaryLeft = 340;
    const summaryWidth = 205;

    doc.fontSize(9).font('Helvetica');

    // Subtotal
    doc.fillColor(secondaryColor).text('Subtotal:', summaryLeft, currentY);
    doc
      .fillColor(textColor)
      .text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, summaryLeft, currentY, {
        align: 'right',
        width: summaryWidth,
      });

    // Tax
    currentY += 16;
    doc.fillColor(secondaryColor).text('Total Tax:', summaryLeft, currentY);
    doc
      .fillColor(textColor)
      .text(`$${parseFloat(invoice.tax_total).toFixed(2)}`, summaryLeft, currentY, {
        align: 'right',
        width: summaryWidth,
      });

    // Total Amount
    currentY += 18;
    doc
      .rect(summaryLeft - 10, currentY - 4, summaryWidth + 15, 24)
      .fill(lightBg);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text('Total Amount:', summaryLeft, currentY);
    doc.text(`$${parseFloat(invoice.total_amount).toFixed(2)}`, summaryLeft, currentY, {
      align: 'right',
      width: summaryWidth,
    });

    // Amount Paid & Amount Due
    currentY += 28;
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(secondaryColor)
      .text('Amount Paid:', summaryLeft, currentY);
    doc
      .fillColor(textColor)
      .text(`$${parseFloat(invoice.amount_paid).toFixed(2)}`, summaryLeft, currentY, {
        align: 'right',
        width: summaryWidth,
      });

    currentY += 16;
    const balanceDueNum = parseFloat(invoice.amount_due);
    const balanceColor = balanceDueNum <= 0 ? '#16a34a' : '#dc2626'; // Green if fully paid, red if due
    const balanceLabel = balanceDueNum <= 0 ? 'Balance Due (PAID):' : 'Balance Due:';

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(balanceColor)
      .text(balanceLabel, summaryLeft, currentY);
    doc.text(`$${balanceDueNum.toFixed(2)}`, summaryLeft, currentY, {
      align: 'right',
      width: summaryWidth,
    });

    // ==========================================
    // 5. Payments History (if any) & Notes
    // ==========================================
    let notesY = Math.max(currentY + 30, tableTop + (invoice.items.length * 24) + 60);

    if (invoice.payments && invoice.payments.length > 0 && notesY < 680) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('RECORDED PAYMENTS:', 40, notesY);

      notesY += 14;
      doc.fontSize(8).font('Helvetica').fillColor(secondaryColor);
      invoice.payments.forEach((p) => {
        const payLine = `• ${p.payment_date}: $${parseFloat(p.amount).toFixed(2)} via ${p.payment_method.replace('_', ' ')}${p.reference ? ` (Ref: ${p.reference})` : ''}`;
        doc.text(payLine, 45, notesY, { width: 280 });
        notesY += 12;
      });
      notesY += 8;
    }

    if (invoice.notes && notesY < 740) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('NOTES & TERMS:', 40, notesY);

      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(secondaryColor)
        .text(invoice.notes, 40, notesY + 14, { width: 280 });
    }

    // Page Bottom Watermark
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text(
        'Generated via QuikInvoice Billing Portal — Normalized Relational Financial Records',
        40,
        780,
        { align: 'center', width: 515 }
      );

    // Finalize PDF
    doc.end();
  }
}

export default PdfService;
