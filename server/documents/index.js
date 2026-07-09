const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  INR: "₹",
  CAD: "CA$",
  AUD: "AU$",
};

const normalizeItems = (items) => {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => ({
      label: escapeHtml(item?.label || "Item"),
      price: Number(item?.price) || 0,
    }))
    .filter((item) => item.price >= 0);
};

export default function pdfTemplate({ name, items, receiptId, taxRate, currency }) {
  const today = new Date();
  const safeName = escapeHtml(name);
  const safeReceiptId = escapeHtml(receiptId);
  const safeItems = normalizeItems(items);
  const symbol = CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.USD;
  const safeTaxRate = Math.max(0, Number(taxRate) || 0);

  const subtotal = safeItems.reduce((sum, item) => sum + item.price, 0);
  const taxAmount = subtotal * (safeTaxRate / 100);
  const total = subtotal + taxAmount;

  const format = (n) => `${symbol}${n.toFixed(2)}`;

  const itemRows = safeItems
    .map(
      (item) => `
              <tr class="item">
                 <td>${item.label}</td>
                 <td>${format(item.price)}</td>
              </tr>`
    )
    .join("");

  return `
    <!doctype html>
    <html>
       <head>
          <meta charset="utf-8">
          <title>Receipt ${safeReceiptId}</title>
          <style>
             * { box-sizing: border-box; }
             body {
                margin: 0;
                font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
                color: #2b2f3a;
                background: #f4f6fb;
             }
             .invoice-box {
                max-width: 720px;
                margin: 24px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 1px 4px rgba(20, 30, 60, 0.08);
             }
             .header {
                background: linear-gradient(135deg, #3383FF, #6a5aff);
                color: #ffffff;
                padding: 32px 40px;
                display: flex;
                justify-content: space-between;
                align-items: center;
             }
             .header .brand {
                font-size: 26px;
                font-weight: 700;
                letter-spacing: -0.01em;
             }
             .header .meta {
                text-align: right;
                font-size: 13px;
                opacity: 0.9;
                line-height: 1.6;
             }
             .body {
                padding: 32px 40px 40px;
             }
             .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 28px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eceff5;
             }
             .info-block .label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: #8892a6;
                margin-bottom: 4px;
             }
             .info-block .value {
                font-size: 15px;
                font-weight: 600;
                color: #2b2f3a;
             }
             table {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
             }
             thead td {
                background: #f4f6fb;
                color: #8892a6;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                padding: 10px 12px;
                font-weight: 600;
             }
             thead td:last-child, td:last-child {
                text-align: right;
             }
             tr.item td {
                padding: 12px;
                border-bottom: 1px solid #f0f2f7;
             }
             .summary {
                margin-top: 20px;
                margin-left: auto;
                width: 260px;
             }
             .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                font-size: 14px;
                color: #5b6274;
             }
             .summary-row.total {
                margin-top: 8px;
                padding-top: 14px;
                border-top: 2px solid #2b2f3a;
                font-size: 20px;
                font-weight: 700;
                color: #2b2f3a;
             }
             .footer {
                text-align: center;
                font-size: 12px;
                color: #a3abbd;
                padding: 20px 0 0;
             }
          </style>
       </head>
       <body>
          <div class="invoice-box">
             <div class="header">
                <div class="brand">Receipt</div>
                <div class="meta">
                   ${today.getMonth() + 1} / ${today.getDate()} / ${today.getFullYear()}<br />
                   #${safeReceiptId}
                </div>
             </div>
             <div class="body">
                <div class="info-row">
                   <div class="info-block">
                      <div class="label">Billed to</div>
                      <div class="value">${safeName}</div>
                   </div>
                </div>
                <table cellpadding="0" cellspacing="0">
                   <thead>
                      <tr>
                         <td>Item</td>
                         <td>Price</td>
                      </tr>
                   </thead>
                   <tbody>
                      ${itemRows}
                   </tbody>
                </table>
                <div class="summary">
                   <div class="summary-row">
                      <span>Subtotal</span>
                      <span>${format(subtotal)}</span>
                   </div>
                   <div class="summary-row">
                      <span>Tax (${safeTaxRate}%)</span>
                      <span>${format(taxAmount)}</span>
                   </div>
                   <div class="summary-row total">
                      <span>Total</span>
                      <span>${format(total)}</span>
                   </div>
                </div>
                <div class="footer">Thank you for your business.</div>
             </div>
          </div>
       </body>
    </html>
    `;
}
