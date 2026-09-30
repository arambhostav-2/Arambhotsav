// Server-side email notifications (Brevo). All optional — silently skipped
// when keys are missing so demo mode keeps working.

type NotifyBooking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  event_session: string;
  qty: number;
  amount: number;
  upi_txn_ref?: string | null;
  upi_id?: string;
  upi_name?: string;
};

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.BREVO_API_KEY) { console.warn('notify: BREVO_API_KEY missing'); return; }
  try {
    const from = process.env.BREVO_FROM || 'Garba Nights <arambhostav@gmail.com>';
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: from.replace(/.*<(.+)>.*/, '$1').trim(), name: from.replace(/<.*>/, '').trim() || 'Garba Nights' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) console.error('notify: brevo error', r.status, JSON.stringify(data));
    else console.log('notify: email accepted', data?.messageId);
  } catch (e: unknown) {
    console.error('notify: email failed', to, subject, e);
  }
}

export function adminNotifyEmail() {
  return process.env.ADMIN_NOTIFY_EMAIL || '';
}

function row(b: NotifyBooking) {
  const ref = b.upi_txn_ref ? `<p><b>Customer UPI Ref / UTR:</b> <code>${b.upi_txn_ref}</code></p>` : '';
  return `
    <div style="font-family:Arial,sans-serif;background:#160409;color:#fff7ed;padding:24px;border-radius:16px">
      <p style="font-size:22px">🪔 Garba Nights 2026</p>
      <h2 style="color:#f5c451;margin:8px 0">Booking ${b.id}</h2>
      <p><b>Name:</b> ${b.name}</p>
      <p><b>Phone:</b> ${b.phone}</p>
      <p><b>Email:</b> ${b.email}</p>
      <p><b>Session:</b> ${b.event_session}</p>
      <p><b>Qty:</b> ${b.qty}</p>
      <p><b>Amount:</b> ₹${b.amount}</p>
      ${ref}
      <p style="margin-top:16px">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin"
           style="background:#f5c451;color:#5c0a0a;padding:10px 18px;border-radius:9999px;text-decoration:none;font-weight:bold">Open Admin Dashboard</a>
      </p>
    </div>
  `;
}

/** Customer started a UPI booking (hold created) — admin should watch for the credit. */
export async function notifyAdminUpiPending(b: NotifyBooking) {
  if (!adminNotifyEmail()) return;
  await sendEmail(
    adminNotifyEmail(),
    `🔔 UPI booking started — ${b.id}`,
    `<h2>New UPI booking awaiting payment</h2>${row(b)}
     <p style="color:#888">Check your UPI app / bank for the credit, then confirm in the admin dashboard.</p>`
  );
}

/** Customer entered the payment block — send them payment instructions. */
export async function sendPaymentInstructions(b: NotifyBooking) {
  if (!b.email) return;
  const upi = b.upi_id || process.env.NEXT_PUBLIC_UPI_ID || '';
  const name = b.upi_name || process.env.NEXT_PUBLIC_UPI_NAME || '';
  await sendEmail(
    b.email,
    `💳 Complete your Garba Nights payment — ${b.id}`,
    `<div style="font-family:Arial,sans-serif;background:#160409;color:#fff7ed;padding:24px;border-radius:16px">
      <p style="font-size:22px">🪔 Garba Nights 2026</p>
      <h2 style="color:#f5c451;margin:8px 0">Booking ${b.id}</h2>
      <p><b>Name:</b> ${b.name}</p>
      <p><b>Session:</b> ${b.event_session}</p>
      <p><b>Qty:</b> ${b.qty}</p>
      <p><b>Amount to pay:</b> ₹${b.amount}</p>
      <p><b>UPI ID:</b> <code>${upi}</code></p>
      <p><b>Payee name:</b> ${name}</p>
      <h3 style="color:#f5c451">How to pay</h3>
      <p>1. Open any UPI app (PhonePe, GPay, BHIM, Paytm) and scan the QR on the payment screen <b>live with your camera</b> → pay <b>₹${b.amount}</b>. You can also pay directly to our UPI ID <code>${upi}</code> (${name}).</p>
      <p>2. Paste the transaction ID / UTR shown in your payment app.</p>
      <p>3. Within 3 minutes your ticket is confirmed. ✅</p>
      <p style="color:#fbbf24">Please do not pay via screenshot upload — UPI apps cap screenshot payments at ₹2,000.</p>
      <p style="color:#888">Keep your booking ID safe. Hold releases automatically after 8 minutes if unpaid.</p>
    </div>`
  );
}

/** Customer recorded their UPI transaction ref — admin should verify & confirm. */
export async function notifyAdminUpiPaid(b: NotifyBooking) {
  if (!adminNotifyEmail()) return;
  await sendEmail(
    adminNotifyEmail(),
    `💰 UPI payment reported — ${b.id}`,
    `<h2>Customer says they paid. Verify the credit.</h2>${row(b)}
     <p style="color:#888">Match the ref above with your bank/UPI app credit, then confirm the payment in the admin dashboard.</p>`
  );
}