
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = async (data: any, sections: any) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Wafer Analysis Report', 20, 20);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
  
  let yPosition = 50;

  // Summary Section
  if (sections.summary && data.summary) {
    doc.setFontSize(16);
    doc.text('Summary', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Total Wafers: ${data.summary.totalWafers}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Average Yield: ${data.summary.averageYield.toFixed(2)}%`, 20, yPosition);
    yPosition += 7;
    doc.text(`Lot Number: ${data.summary.lotNumber}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Device: ${data.summary.device}`, 20, yPosition);
    yPosition += 15;
  }

  // Wafer Maps Table
  if (sections.waferMaps && data.waferMaps) {
    doc.setFontSize(16);
    doc.text('Wafer Map Data', 20, yPosition);
    yPosition += 10;

    const tableData = data.waferMaps.map((wafer: any) => [
      wafer.waferId,
      wafer.slotNo,
      `${wafer.yieldValue.toFixed(2)}%`,
      wafer.passDie.toLocaleString(),
      wafer.failDie.toLocaleString(),
      wafer.totalTestDie.toLocaleString()
    ]);

    autoTable(doc, {
      head: [['Wafer ID', 'Slot No', 'Yield (%)', 'Pass Die', 'Fail Die', 'Total Die']],
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
  }

  // Download the PDF
  doc.save(`wafer-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
};
