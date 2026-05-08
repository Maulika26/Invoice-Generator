import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDFServer from '@/lib/InvoicePDFServer';
import { createElement } from 'react';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return Response.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch invoice with client
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*, clients(*)')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (invError || !invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const client = invoice.clients;

    if (!client?.email) {
      return Response.json({ error: 'Client does not have an email address' }, { status: 400 });
    }

    // Fetch invoice items
    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at');

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const currency = profile?.currency || 'INR';

    let logoSrc = null;
    const isSvg = profile?.company_logo_url?.toLowerCase().includes('.svg');

    if (profile?.company_logo_url && !isSvg) {
      try {
        console.log('Fetching logo from:', profile.company_logo_url);
        const logoRes = await fetch(profile.company_logo_url);
        if (logoRes.ok) {
          const arrayBuffer = await logoRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = logoRes.headers.get('content-type') || 'image/png';
          const format = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
          
          logoSrc = { data: buffer, format };
          console.log('Logo fetched successfully. Format:', format);
        } else {
          console.error('Failed to fetch logo. Status:', logoRes.status);
        }
      } catch (err) {
        console.error('Failed to pre-fetch logo:', err);
      }
    }

    // Generate PDF buffer server-side
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePDFServer, {
        invoice,
        items: items || [],
        client,
        profile,
        currency,
        logoSrc,
      })
    );

    const fileName = `${invoice.invoice_number || 'invoice'}.pdf`;

    // Determine sender info
    const senderName = profile?.company_name || 'InvoiceFlow';
    const senderEmail = process.env.GMAIL_USER;

    // Format amounts for email body
    const formatAmount = (amount) => {
      const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', JPY: '¥', AED: 'AED ', SGD: 'S$' };
      const sym = symbols[currency] || '₹';
      return `${sym}${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const dueDateStr = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    // Configure Gmail SMTP transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: client.email,
      subject: `Invoice ${invoice.invoice_number} from ${senderName}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1d2e;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">Invoice</h1>
            <p style="color: #5f6580; margin: 8px 0 0; font-size: 14px;">${invoice.invoice_number}</p>
          </div>

          <div style="background: #f8f9fc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 15px;">Hi <strong>${client.name}</strong>,</p>
            <p style="margin: 0; color: #5f6580; font-size: 14px; line-height: 1.6;">
              Please find attached your invoice <strong>${invoice.invoice_number}</strong> 
              dated <strong>${invoiceDate}</strong> 
              for a total of <strong>${formatAmount(invoice.total)}</strong>.
              ${dueDateStr ? `<br/>Payment is due by <strong>${dueDateStr}</strong>.` : ''}
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #5f6580; font-size: 13px;">Subtotal</td>
              <td style="padding: 8px 0; text-align: right; font-size: 13px;">${formatAmount(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5f6580; font-size: 13px;">Tax</td>
              <td style="padding: 8px 0; text-align: right; font-size: 13px;">${formatAmount(invoice.tax_total)}</td>
            </tr>
            <tr style="border-top: 2px solid #1a1d2e;">
              <td style="padding: 12px 0; font-weight: 700; font-size: 16px;">Total</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 16px; color: #4f46e5;">${formatAmount(invoice.total)}</td>
            </tr>
          </table>

          ${invoice.notes ? `
            <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">Notes</p>
              <p style="margin: 0; font-size: 13px; color: #78350f;">${invoice.notes}</p>
            </div>
          ` : ''}

          <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e2e5ef;">
            <p style="margin: 0; color: #8b90a5; font-size: 12px;">
              Sent by <strong>${senderName}</strong>
              ${profile?.company_email ? ` · ${profile.company_email}` : ''}
              ${profile?.company_phone ? ` · ${profile.company_phone}` : ''}
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    });

    // Update invoice status to "sent" (only if currently draft)
    if (invoice.status === 'draft') {
      await supabase
        .from('invoices')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', invoiceId);
    }

    return Response.json({ 
      success: true, 
      message: `Invoice sent to ${client.email}`,
    });

  } catch (error) {
    console.error('Send invoice error:', error);
    return Response.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
