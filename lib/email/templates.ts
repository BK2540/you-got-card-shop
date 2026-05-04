import { sendEmail } from "@/lib/email/resend";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
});

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const sendRegistrationEmail = async (input: {
  name: string;
  email: string;
}) => {
  const safeName = escapeHtml(input.name.trim() || "there");
  const subject = "Welcome to You Got Card Shop";

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @media only screen and (max-width: 520px) {
            .welcome-shell {
              padding: 16px 14px !important;
            }
            .welcome-card {
              min-height: 540px !important;
              padding: 36px 26px !important;
              border-color: #ffffff !important;
            }
            .welcome-title {
              font-size: 20px !important;
            }
            .welcome-content {
              padding-top: 104px !important;
            }
            .welcome-heading {
              font-size: 14px !important;
            }
            .welcome-copy {
              max-width: 230px !important;
              font-size: 13px !important;
              line-height: 1.25 !important;
            }
            .welcome-thanks {
              padding-top: 90px !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: #1f1f1f;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #1f1f1f; border-collapse: collapse;">
          <tr>
            <td class="welcome-shell" style="padding: 16px 12px; font-family: Arial, sans-serif; color: #111111;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="welcome-card" style="max-width: 1128px; min-height: 580px; margin: 0 auto; background: #ffffff; border: 2px solid #2f80ed; border-radius: 18px; border-collapse: separate;">
                <tr>
                  <td style="padding: 36px 42px; vertical-align: top;">
                    <h1 class="welcome-title" style="margin: 0; font-size: 20px; line-height: 1.2; font-weight: 700;">
                      Welcome, ${safeName}
                    </h1>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="welcome-content" style="padding-top: 58px; border-collapse: collapse;">
                      <tr>
                        <td align="center">
                          <h2 class="welcome-heading" style="margin: 0; font-size: 20px; line-height: 1.25; font-weight: 700;">
                            Your account is now active at UGC!
                          </h2>
                          <p class="welcome-copy" style="max-width: 460px; margin: 18px auto 0; font-size: 14px; line-height: 1.45;">
                            You can now browse cards, checkout, and track your future orders.
                          </p>

                          <div class="welcome-thanks" style="padding-top: 88px; font-size: 14px;">
                            Thank you for joining us
                          </div>

                          <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 18px auto 0; border-collapse: collapse;">
                            <tr>
                              <td style="width: 32px; height: 32px; border-radius: 999px; background: #f45a2a; color: #ffffff; font-size: 12px; font-weight: 700; text-align: center; vertical-align: middle;">
                                logo
                              </td>
                              <td style="padding-left: 10px; font-size: 14px; vertical-align: middle;">
                                UGC
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = [
    `Welcome, ${input.name.trim() || "there"}`,
    "",
    "Your account is now active at UGC!",
    "You can now browse cards, checkout, and track your future orders.",
    "",
    "Thank you for joining us",
    "UGC",
  ].join("\n");

  return sendEmail({
    to: input.email,
    subject,
    html,
    text,
  });
};

export const sendOrderReceiptEmail = async (input: {
  email: string;
  customerName?: string | null;
  orderId: string;
  paidAt?: Date;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}) => {
  const safeName = escapeHtml(input.customerName?.trim() || "Customer");
  const paidAt = input.paidAt ?? new Date();
  const paidAtLabel = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(paidAt);

  const rowsHtml = input.items
    .map((item) => {
      const name = escapeHtml(item.name);
      const lineTotal = money.format(item.unitPrice * item.quantity);
      return `<tr>
        <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${name}</td>
        <td style="padding: 8px 6px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 6px; border-bottom: 1px solid #eee; text-align: right;">${money.format(item.unitPrice)}</td>
        <td style="padding: 8px 6px; border-bottom: 1px solid #eee; text-align: right;">${lineTotal}</td>
      </tr>`;
    })
    .join("");

  const linesText = input.items.map((item) => {
    const lineTotal = money.format(item.unitPrice * item.quantity);
    return `${item.name} x${item.quantity} @ ${money.format(item.unitPrice)} = ${lineTotal}`;
  });

  const subject = `Payment confirmed: Order ${input.orderId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin-bottom: 8px;">Thanks, ${safeName}!</h2>
      <p style="margin-top: 0;">
        Your payment was successful. Here is your receipt.
      </p>
      <p style="margin: 0;">
        <strong>Order ID:</strong> ${escapeHtml(input.orderId)}<br />
        <strong>Paid at:</strong> ${escapeHtml(paidAtLabel)}
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px 6px; border-bottom: 2px solid #ddd;">Item</th>
            <th style="text-align: center; padding: 8px 6px; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="text-align: right; padding: 8px 6px; border-bottom: 2px solid #ddd;">Unit Price</th>
            <th style="text-align: right; padding: 8px 6px; border-bottom: 2px solid #ddd;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <p style="font-size: 18px; margin-top: 16px;">
        <strong>Total: ${money.format(input.total)}</strong>
      </p>
      <p>We appreciate your order.</p>
    </div>
  `;

  const text = [
    `Thanks, ${input.customerName?.trim() || "Customer"}!`,
    "",
    "Your payment was successful. Here is your receipt.",
    `Order ID: ${input.orderId}`,
    `Paid at: ${paidAtLabel}`,
    "",
    ...linesText,
    "",
    `Total: ${money.format(input.total)}`,
    "",
    "We appreciate your order.",
  ].join("\n");

  return sendEmail({
    to: input.email,
    subject,
    html,
    text,
  });
};
