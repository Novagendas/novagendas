import ExcelJS from 'exceljs';

export async function exportToExcel(rows, columns, filename) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Datos');

  // Configure columns
  worksheet.columns = columns.map(c => ({
    header: c.label,
    key: c.key,
    width: Math.max(c.label.length + 4, 14)
  }));

  // Add data rows
  worksheet.addRows(rows);

  // Optional: Header styling
  worksheet.getRow(1).font = { bold: true };

  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  
  const anchor = document.createElement('a');
  anchor.href = url;
  const date = new Date().toISOString().split('T')[0];
  anchor.download = `${filename}_${date}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
