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
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin-bottom: 8px;">Welcome, ${safeName}!</h2>
      <p style="margin-top: 0;">
        Your account is now active at <strong>You Got Card Shop</strong>.
      </p>
      <p>
        You can now browse cards, checkout, and track your future orders.
      </p>
      <p>Thank you for joining us.</p>
    </div>
  `;

  const text = [
    `Welcome, ${input.name.trim() || "there"}!`,
    "",
    "Your account is now active at You Got Card Shop.",
    "You can now browse cards, checkout, and track your future orders.",
    "",
    "Thank you for joining us.",
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
