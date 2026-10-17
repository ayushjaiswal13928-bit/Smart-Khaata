import { Lang } from './types';

export function generateCsvString(rows: (string | number | undefined | null)[][]): string {
  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((cell) => {
            const str = cell !== undefined && cell !== null ? String(cell) : '';
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\n')
  );
}

export async function exportCsvFile(options: {
  filename: string;
  csvString: string;
  title?: string;
  lang?: Lang;
}): Promise<void> {
  const blob = new Blob([options.csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', options.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
