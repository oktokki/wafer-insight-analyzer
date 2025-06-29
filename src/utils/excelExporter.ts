
import * as XLSX from 'xlsx';

export const exportToExcel = async (data: any, sections: any) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  if (sections.summary && data.summary) {
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Wafers', data.summary.totalWafers],
      ['Average Yield (%)', data.summary.averageYield.toFixed(2)],
      ['Lot Number', data.summary.lotNumber],
      ['Device', data.summary.device],
      ['Generated Date', new Date().toLocaleDateString()]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }

  // Wafer Maps Sheet
  if (sections.waferMaps && data.waferMaps) {
    const waferData = [
      ['Wafer ID', 'Slot No', 'Yield (%)', 'Pass Die', 'Fail Die', 'Total Die'],
      ...data.waferMaps.map((wafer: any) => [
        wafer.waferId,
        wafer.slotNo,
        wafer.yieldValue.toFixed(2),
        wafer.passDie,
        wafer.failDie,
        wafer.totalTestDie
      ])
    ];
    
    const waferSheet = XLSX.utils.aoa_to_sheet(waferData);
    XLSX.utils.book_append_sheet(workbook, waferSheet, 'Wafer Maps');
  }

  // Integrity Report Sheet
  if (sections.integrityReport && data.integrityReport) {
    const integrityData = [
      ['Check', 'Status'],
      ['Overall Status', data.integrityReport.overallStatus],
      ['Wafer Count Valid', data.integrityReport.waferCountValid ? 'PASS' : 'FAIL'],
      ['Bin1 Count Valid', data.integrityReport.bin1CountValid ? 'PASS' : 'FAIL']
    ];
    
    const integritySheet = XLSX.utils.aoa_to_sheet(integrityData);
    XLSX.utils.book_append_sheet(workbook, integritySheet, 'Integrity Report');
  }

  // Download the Excel file
  XLSX.writeFile(workbook, `wafer-analysis-${new Date().toISOString().split('T')[0]}.xlsx`);
};
