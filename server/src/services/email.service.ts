import nodemailer, { Transporter } from 'nodemailer';
import { ENV } from '../config/env';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  if (ENV.SMTP_USER && ENV.SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_PORT === 465,
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        },
      });
      console.log(`📧 Nodemailer SMTP transporter configured for ${ENV.SMTP_USER}`);
      return transporter;
    } catch (err) {
      console.error('Failed to initialize SMTP transporter:', err);
      return null;
    }
  }

  return null;
}

export async function sendLoginAlert(params: {
  email: string;
  name: string;
  ip?: string;
  userAgent?: string;
  authProvider: 'google' | 'local';
}): Promise<{ sent: boolean; reason?: string }> {
  const { email, name, ip, userAgent, authProvider } = params;
  const transport = getTransporter();
  const time = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const providerLabel = authProvider === 'google' ? 'Google (Gmail OAuth 2.0)' : 'Standard Email & Password';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F6F1E7; margin: 0; padding: 24px; color: #1E293B; }
          .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2D9CC; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #2D5A27; padding: 24px 28px; color: #FFFFFF; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
          .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
          .body { padding: 28px; font-size: 14px; line-height: 1.6; }
          .badge { display: inline-block; padding: 4px 10px; background: #E8F5E9; color: #2D5A27; border-radius: 6px; font-weight: 600; font-size: 12px; }
          .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #FAF7F2; border-radius: 8px; overflow: hidden; border: 1px solid #E2D9CC; }
          .details-table td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #E2D9CC; }
          .details-table td:first-child { color: #64748B; font-weight: 500; width: 35%; }
          .details-table td:last-child { font-weight: 600; color: #1E293B; }
          .footer { padding: 20px 28px; background: #FAF7F2; border-top: 1px solid #E2D9CC; font-size: 12px; color: #64748B; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PocketPaisa Security Notification</h1>
            <p>New sign-in detected on your account</p>
          </div>
          <div class="body">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your PocketPaisa account was successfully accessed using <span class="badge">${providerLabel}</span>.</p>
            
            <table class="details-table">
              <tr>
                <td>Account:</td>
                <td>${email}</td>
              </tr>
              <tr>
                <td>Timestamp:</td>
                <td>${time}</td>
              </tr>
              <tr>
                <td>IP Address:</td>
                <td>${ip || '127.0.0.1 (Local Session)'}</td>
              </tr>
              <tr>
                <td>Device / Browser:</td>
                <td>${userAgent ? userAgent.substring(0, 70) + '...' : 'Web Browser'}</td>
              </tr>
            </table>

            <p style="font-size: 13px; color: #64748B;">
              If this was you, you can safely disregard this message. If you did not initiate this sign-in, please change your password immediately or revoke unauthorized session tokens.
            </p>
          </div>
          <div class="footer">
            Sent by <strong>PocketPaisa Automated Security Engine</strong>.<br>
            Disciplined personal finance companion for students and professionals.
          </div>
        </div>
      </body>
    </html>
  `;

  if (!transport) {
    console.log(`\n================== 📬 EMAIL SECURITY NOTIFICATION (SIMULATED) ==================`);
    console.log(`TO: ${email}`);
    console.log(`SUBJECT: 🔐 Security Alert: Successful sign-in to PocketPaisa`);
    console.log(`METHOD: ${providerLabel}`);
    console.log(`TIME: ${time}`);
    console.log(`NOTE: To receive real emails in your inbox, set SMTP_USER & SMTP_PASS in server/.env`);
    console.log(`=================================================================================\n`);
    return { sent: true, reason: 'simulated_local' };
  }

  try {
    const info = await transport.sendMail({
      from: ENV.SMTP_FROM,
      to: email,
      subject: `🔐 Security Alert: Successful sign-in to PocketPaisa (${providerLabel})`,
      html: htmlContent,
    });
    console.log(`✅ Real Gmail notification sent to ${email} (MessageId: ${info.messageId})`);
    return { sent: true };
  } catch (err) {
    console.error(`❌ Failed to dispatch email to ${email}:`, err);
    return { sent: false, reason: (err as Error).message };
  }
}

export async function sendDepositReceiptEmail(params: {
  email: string;
  name: string;
  vaultName: string;
  amount: number;
  referenceId: string;
  paymentMethod: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const { email, name, vaultName, amount, referenceId, paymentMethod } = params;
  const transport = getTransporter();
  const time = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; background-color: #F6F1E7; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background: #FFF; border-radius: 12px; padding: 28px; border: 1px solid #E2D9CC;">
          <h2 style="color: #2D5A27; margin: 0 0 10px 0;">Deposit Receipt: ₹${amount.toLocaleString('en-IN')} Credited</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your goal vault <strong>${vaultName}</strong> has been credited with <strong>₹${amount.toLocaleString('en-IN')}</strong> via ${paymentMethod}.</p>
          <p><strong>Reference ID:</strong> <code>${referenceId}</code><br><strong>Date:</strong> ${time}</p>
          <p style="font-size: 12px; color: #64748B;">Official RBI-compliant gateway digital payment receipt.</p>
        </div>
      </body>
    </html>
  `;

  if (!transport) {
    console.log(`\n================== 🧾 DEPOSIT RECEIPT EMAIL (SIMULATED) ==================`);
    console.log(`TO: ${email}`);
    console.log(`AMOUNT: ₹${amount} to ${vaultName}`);
    console.log(`REF: ${referenceId}`);
    console.log(`==========================================================================\n`);
    return { sent: true, reason: 'simulated_local' };
  }

  try {
    await transport.sendMail({
      from: ENV.SMTP_FROM,
      to: email,
      subject: `🧾 Official Receipt: ₹${amount} Deposited into ${vaultName} [${referenceId}]`,
      html: htmlContent,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: (err as Error).message };
  }
}
