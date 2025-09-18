import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Create workbook and add worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  // Save file
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};