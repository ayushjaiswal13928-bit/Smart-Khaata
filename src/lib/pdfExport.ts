export interface SummaryCardData {
  label: string;
  value: string;
  color?: string;
}

export interface TableRowData {
  cells: (string | number)[];
}

export interface PrintFinancialReportOptions {
  title: string;
  subtitle?: string;
  lang: 'hi' | 'en';
  summaryCards: SummaryCardData[];
  tableHeaders: string[];
  tableRows: TableRowData[];
  footerNotes?: string;
}

export function printFinancialReport(options: PrintFinancialReportOptions): void {
  const isHi = options.lang === 'hi';
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(isHi ? 'कृपया पॉपअप अनुमति दें।' : 'Please allow popups to print report.');
    return;
  }

  const todayStr = new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const cardsHtml = options.summaryCards
    .map(
      (c) => `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;flex:1;min-width:140px;">
        <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${c.label}</div>
        <div style="font-size:16px;font-weight:bold;color:${c.color || '#0f172a'};font-family:monospace;">${c.value}</div>
      </div>
    `
    )
    .join('');

  const headersHtml = options.tableHeaders
    .map((h) => `<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #cbd5e1;font-size:11px;color:#334155;">${h}</th>`)
    .join('');

  const rowsHtml = options.tableRows
    .map(
      (r, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};border-bottom:1px solid #f1f5f9;">
        ${r.cells.map((cell) => `<td style="padding:7px 10px;font-size:11px;color:#1e293b;">${cell}</td>`).join('')}
      </tr>
    `
    )
    .join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="${options.lang}">
    <head>
      <meta charset="utf-8">
      <title>${options.title}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 24px; color: #0f172a; }
        @media print {
          body { margin: 0; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <div style="border-bottom:2px solid #10b981;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h1 style="margin:0;font-size:20px;color:#065f46;">🌾 ${options.title}</h1>
          ${options.subtitle ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">${options.subtitle}</p>` : ''}
        </div>
        <div style="text-align:right;font-size:11px;color:#64748b;">
          <div><b>दिनांक:</b> ${todayStr}</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
        ${cardsHtml}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f1f5f9;">
            ${headersHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${options.footerNotes ? `<div style="font-size:10px;color:#94a3b8;border-top:1px dashed #cbd5e1;padding-top:12px;">${options.footerNotes}</div>` : ''}

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

export function printElement(element: HTMLElement | null): void {
  if (!element) {
    window.print();
    return;
  }
  window.print();
}

export async function exportElementToPdf(element: HTMLElement | null, filename: string): Promise<void> {
  // Triggers browser print with save as PDF
  printElement(element);
}

export function downloadPrintableHtml(options: {
  title: string;
  subtitle?: string;
  lang: 'hi' | 'en';
  season?: string;
  summaryCards: SummaryCardData[];
  tableHeaders: string[];
  tableRows: TableRowData[];
  footerNotes?: string;
}): void {
  const isHi = options.lang === 'hi';
  const todayStr = new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const cardsHtml = options.summaryCards
    .map(
      (c) => `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;flex:1;min-width:140px;">
        <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${c.label}</div>
        <div style="font-size:16px;font-weight:bold;color:${c.color || '#0f172a'};font-family:monospace;">${c.value}</div>
      </div>
    `
    )
    .join('');

  const headersHtml = options.tableHeaders
    .map((h) => `<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #cbd5e1;font-size:11px;color:#334155;">${h}</th>`)
    .join('');

  const rowsHtml = options.tableRows
    .map(
      (r, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};border-bottom:1px solid #f1f5f9;">
        ${r.cells.map((cell) => `<td style="padding:7px 10px;font-size:11px;color:#1e293b;">${cell}</td>`).join('')}
      </tr>
    `
    )
    .join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="${options.lang}">
    <head>
      <meta charset="utf-8">
      <title>${options.title}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 30px; color: #0f172a; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div style="border-bottom:2px solid #10b981;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h1 style="margin:0;font-size:22px;color:#065f46;">🌾 ${options.title}</h1>
          ${options.subtitle ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">${options.subtitle}</p>` : ''}
        </div>
        <div style="text-align:right;font-size:11px;color:#64748b;">
          <div><b>दिनांक:</b> ${todayStr}</div>
          ${options.season ? `<div><b>सत्र:</b> ${options.season}</div>` : ''}
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
        ${cardsHtml}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f1f5f9;">
            ${headersHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${options.footerNotes ? `<div style="font-size:11px;color:#94a3b8;border-top:1px dashed #cbd5e1;padding-top:12px;">${options.footerNotes}</div>` : ''}
    </body>
    </html>
  `;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${options.title.replace(/[/\\?%*:|"<> ]/g, '-')}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
