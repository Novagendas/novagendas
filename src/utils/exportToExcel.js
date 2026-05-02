import * as XLSX from 'xlsx';

export function exportToExcel(rows, columns, filename) {
  const headerRow = columns.map(c => c.label);
  const dataRows = rows.map(row =>
    columns.map(c => (row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : ''))
  );

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  ws['!cols'] = columns.map(c => ({ wch: Math.max(c.label.length + 4, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filename}_${date}.xlsx`);
}
