export async function sendOrderNotification(payload: {
  orderId: string
  buyerName: string
  buyerCompany?: string | null
  buyerWhatsapp?: string | null
  buyerEmail?: string | null
  items: { productName: string; variantName?: string | null; quantity: number; unit: string }[]
}) {
  const apiKey = process.env.RESEND_API_KEY
  const notifyEmail = process.env.NOTIFY_EMAIL

  if (!apiKey || !notifyEmail) {
    console.warn("Resend not configured — skipping email notification")
    return
  }

  const { orderId, buyerName, buyerCompany, buyerWhatsapp, buyerEmail, items } = payload

  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #F0EAE0;">${i.productName}${i.variantName ? ` <span style="color:#E8452A">(${i.variantName})</span>` : ""}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F0EAE0;text-align:right;font-weight:600;">${i.quantity} ${i.unit}</td>
    </tr>`
  ).join("")

  const html = `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#FDFAF6;border:1px solid #E8E0D5;border-radius:12px;overflow:hidden;">
      <div style="background:#1A1208;padding:24px 32px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:28px;font-weight:900;color:#E8452A;letter-spacing:1px;">LYBYTEX</span>
        <span style="color:#A09880;font-size:13px;">New Order Received</span>
      </div>
      <div style="height:5px;background:repeating-linear-gradient(90deg,#C0392B 0,#C0392B 12px,#C9952A 12px,#C9952A 24px,#1A1208 24px,#1A1208 28px,#1A6B3A 28px,#1A6B3A 40px,#1A1208 40px,#1A1208 44px);"></div>
      <div style="padding:28px 32px;">
        <p style="font-size:13px;color:#6B6358;margin:0 0 4px;">Order ID</p>
        <p style="font-size:22px;font-weight:700;color:#1A1208;margin:0 0 20px;">${orderId}</p>

        <p style="font-size:13px;color:#6B6358;margin:0 0 4px;">Buyer</p>
        <p style="font-size:16px;font-weight:600;color:#1A1208;margin:0 0 4px;">${buyerName}${buyerCompany ? ` — ${buyerCompany}` : ""}</p>
        ${buyerEmail ? `<p style="font-size:13px;color:#6B6358;margin:0 0 2px;">✉️ ${buyerEmail}</p>` : ""}
        ${buyerWhatsapp ? `<p style="font-size:13px;color:#6B6358;margin:0 0 20px;">📱 ${buyerWhatsapp}</p>` : "<div style='margin-bottom:20px'></div>"}

        <p style="font-size:13px;color:#6B6358;margin:0 0 8px;">Items Ordered</p>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid #E8E0D5;">
          <thead>
            <tr style="background:#F5EFE6;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B6358;font-weight:600;text-transform:uppercase;">Product</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6B6358;font-weight:600;text-transform:uppercase;">Qty</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="margin-top:24px;padding:16px;background:#FFF8F0;border-radius:8px;border-left:3px solid #E8452A;">
          <p style="margin:0;font-size:13px;color:#6B6358;">💬 Final pricing to be confirmed with the buyer directly.</p>
        </div>
      </div>
      <div style="padding:16px 32px;background:#F5EFE6;text-align:center;">
        <p style="margin:0;font-size:12px;color:#A09880;">LybyTex India · <a href="https://lybytex.com" style="color:#E8452A;text-decoration:none;">lybytex.com</a></p>
      </div>
    </div>
  `

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "LybyTex Orders <onboarding@resend.dev>",
      to: [notifyEmail],
      subject: `New Order ${orderId} — ${buyerName}${buyerCompany ? ` (${buyerCompany})` : ""}`,
      html,
    }),
  })
}