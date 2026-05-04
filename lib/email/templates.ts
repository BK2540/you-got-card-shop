import { sendEmail } from "@/lib/email/resend";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
});

const receiptAmount = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
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
      <body style="margin: 0; padding: 0; background: transparent;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: transparent; border-collapse: collapse;">
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

export const sendPasswordResetEmail = async (input: {
  name?: string | null;
  email: string;
  resetUrl: string;
}) => {
  const safeName = escapeHtml(input.name?.trim() || "there");
  const safeResetUrl = escapeHtml(input.resetUrl);
  const subject = "Reset your You Got Card Shop password";

  const html = `
    <!doctype html>
    <html>
      <body style="margin: 0; padding: 0; background: transparent;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: transparent; border-collapse: collapse;">
          <tr>
            <td style="padding: 24px 16px; font-family: Arial, sans-serif; color: #111111;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 2px solid #f45a2a; border-radius: 18px; border-collapse: separate;">
                <tr>
                  <td style="padding: 34px 30px;">
                    <h1 style="margin: 0; font-size: 24px; line-height: 1.25;">Reset your password</h1>
                    <p style="margin: 18px 0 0; font-size: 15px; line-height: 1.5;">Hi ${safeName},</p>
                    <p style="margin: 12px 0 0; font-size: 15px; line-height: 1.5;">
                      We received a request to reset your You Got Card Shop password. This link expires in 1 hour.
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0; border-collapse: collapse;">
                      <tr>
                        <td style="border-radius: 999px; background: #f45a2a;">
                          <a href="${safeResetUrl}" style="display: inline-block; padding: 12px 22px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none;">
                            Reset password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #555555;">
                      If you did not request this, you can ignore this email.
                    </p>
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
    `Hi ${input.name?.trim() || "there"},`,
    "",
    "We received a request to reset your You Got Card Shop password.",
    "This link expires in 1 hour:",
    input.resetUrl,
    "",
    "If you did not request this, you can ignore this email.",
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
  const paidAt = input.paidAt ?? new Date();
  const paidAtLabel = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(paidAt);
  const itemSubtotal = input.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const shippingAmount = Math.max(0, input.total - itemSubtotal);

  const rowsHtml = input.items
    .map((item) => {
      const name = escapeHtml(item.name);
      const lineTotal = receiptAmount.format(item.unitPrice * item.quantity);
      return `<tr>
        <td style="padding: 20px 18px; border-bottom: 1px solid #ff6a2a;">${name}</td>
        <td style="padding: 20px 12px; border-bottom: 1px solid #ff6a2a; text-align: center;">${item.quantity}</td>
        <td style="padding: 20px 12px; border-bottom: 1px solid #ff6a2a; text-align: center;">${receiptAmount.format(item.unitPrice)}</td>
        <td style="padding: 20px 18px; border-bottom: 1px solid #ff6a2a; text-align: right;">${lineTotal}</td>
      </tr>`;
    })
    .join("");

  const linesText = input.items.map((item) => {
    const lineTotal = money.format(item.unitPrice * item.quantity);
    return `${item.name} x${item.quantity} @ ${money.format(item.unitPrice)} = ${lineTotal}`;
  });

  const subject = `Payment confirmed: Order ${input.orderId}`;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @media only screen and (max-width: 520px) {
            .receipt-shell {
              padding: 16px 14px !important;
            }
            .receipt-card {
              min-height: 540px !important;
              padding: 28px 12px !important;
            }
            .receipt-title {
              font-size: 20px !important;
              padding: 0 16px !important;
            }
            .receipt-content {
              padding-top: 72px !important;
            }
            .receipt-heading {
              font-size: 18px !important;
            }
            .receipt-copy {
              font-size: 12px !important;
            }
            .receipt-table-wrap {
              max-width: 100% !important;
            }
            .receipt-table {
              font-size: 10px !important;
            }
            .receipt-table th,
            .receipt-table td {
              padding-left: 8px !important;
              padding-right: 8px !important;
            }
            .receipt-note {
              font-size: 12px !important;
              max-width: 250px !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: transparent;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: transparent; border-collapse: collapse;">
          <tr>
            <td class="receipt-shell" style="padding: 28px 24px; font-family: Arial, sans-serif; color: #000000;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="receipt-card" style="max-width: 1128px; min-height: 740px; margin: 0 auto; background: #ffffff; border-radius: 14px; border-collapse: separate;">
                <tr>
                  <td style="padding: 36px 40px; vertical-align: top;">

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="receipt-content" style="padding-top: 290px; border-collapse: collapse;">
                      <tr>
                        <td align="center">
                          <h2 class="receipt-heading" style="margin: 0; font-size: 24px; line-height: 1.25; font-weight: 700;">
                            Thank You For Your Purchase!
                          </h2>
                          <p class="receipt-copy" style="margin: 24px 0 0; font-size: 14px; line-height: 1.4;">
                            Your payment was successful. Here is your receipt.
                          </p>

                          <table role="presentation" width="570" cellspacing="0" cellpadding="0" class="receipt-table-wrap" style="width: 100%; max-width: 570px; margin: 36px auto 0; border: 1px solid #ff6a2a; border-radius: 16px; border-collapse: separate; overflow: hidden;">
                            <tr>
                              <td style="padding: 0;">
                                <table width="100%" cellspacing="0" cellpadding="0" class="receipt-table" style="border-collapse: collapse; font-size: 14px; color: #000000;">
                                  <thead>
                                    <tr>
                                      <th style="padding: 18px; border-bottom: 1px solid #ff6a2a; text-align: left;">Item</th>
                                      <th style="padding: 18px 12px; border-bottom: 1px solid #ff6a2a; text-align: center;">Quantity</th>
                                      <th style="padding: 18px 12px; border-bottom: 1px solid #ff6a2a; text-align: center;">Unit Price</th>
                                      <th style="padding: 18px; border-bottom: 1px solid #ff6a2a; text-align: right;">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${rowsHtml}
                                    <tr>
                                      <td style="padding: 20px 18px 8px;">Shipping Cost</td>
                                      <td></td>
                                      <td></td>
                                      <td style="padding: 20px 18px 8px; text-align: right;">${receiptAmount.format(shippingAmount)}</td>
                                    </tr>
                                    <tr>
                                      <td style="padding: 12px 18px 20px; font-weight: 700;">Total</td>
                                      <td></td>
                                      <td></td>
                                      <td style="padding: 12px 18px 20px; text-align: right; font-weight: 700;">${receiptAmount.format(input.total)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <p class="receipt-note" style="margin: 36px auto 0; max-width: 560px; font-size: 16px; line-height: 1.4; text-align: center;">
                            Once we get tracking number, we will notify you again via email
                          </p>

                          <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px auto 0; border-collapse: collapse;">
                            <tr>
                              <td style="width: 32px; height: 32px; border-radius: 999px; background: #f45a2a; color: #ffffff; font-size: 12px; font-weight: 700; text-align: center; vertical-align: middle;">
                                logo
                              </td>
                              <td style="padding-left: 12px; font-size: 14px; vertical-align: middle;">
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
    `Payment Confirmed: Order ID ${input.orderId}`,
    "",
    `Thank You For Your Purchase, ${input.customerName?.trim() || "Customer"}!`,
    "Your payment was successful. Here is your receipt.",
    `Paid at: ${paidAtLabel}`,
    "",
    ...linesText,
    `Shipping Cost: ${money.format(shippingAmount)}`,
    "",
    `Total: ${money.format(input.total)}`,
    "",
    "Once we get tracking number, we will notify you again via email",
    "UGC",
  ].join("\n");

  return sendEmail({
    to: input.email,
    subject,
    html,
    text,
  });
};

