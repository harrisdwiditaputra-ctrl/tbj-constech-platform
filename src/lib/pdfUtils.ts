import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateRABPDF = (projectName: string, categories: any[], items: any[]) => {
  const doc = new jsPDF();
  const logoUrl = 'https://picsum.photos/seed/tbj/200/200'; // Placeholder logo

  // Header
  doc.addImage(logoUrl, 'JPEG', 10, 10, 30, 30);
  doc.setFontSize(22);
  doc.text('TBJ CONSTECH', 50, 25);
  doc.setFontSize(10);
  doc.text('Professional Construction & Renovation Services', 50, 32);
  doc.text('Jakarta, Indonesia | +62 812-3456-7890', 50, 37);

  doc.line(10, 45, 200, 45);

  doc.setFontSize(16);
  doc.text('BILL OF QUANTITIES (RAB)', 10, 55);
  doc.setFontSize(12);
  doc.text(`Project: ${projectName}`, 10, 65);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 72);

  let currentY = 80;

  categories.forEach((cat) => {
    const catItems = items.filter(i => i.categoryId === cat.id);
    if (catItems.length === 0) return;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.name.toUpperCase(), 10, currentY);
    currentY += 5;

    const tableData = catItems.map(item => [
      item.name,
      item.quantity,
      item.unit,
      `Rp ${item.pricePerUnit.toLocaleString()}`,
      `Rp ${item.totalPrice.toLocaleString()}`
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Item Description', 'Qty', 'Unit', 'Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: [0, 0, 0], textColor: [255, 255, 255] },
      margin: { left: 10, right: 10 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  });

  const totalBudget = items.reduce((acc, i) => acc + i.totalPrice, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL ESTIMATED COST: Rp ${totalBudget.toLocaleString()}`, 10, currentY + 10);

  doc.save(`RAB-${projectName.replace(/\s+/g, '-')}.pdf`);
};

export const generatePOPDF = (request: any, vendor: any) => {
  const doc = new jsPDF();
  const logoUrl = 'https://picsum.photos/seed/tbj/200/200';

  // Header
  doc.addImage(logoUrl, 'JPEG', 10, 10, 30, 30);
  doc.setFontSize(22);
  doc.text('TBJ CONSTECH', 50, 25);
  doc.setFontSize(10);
  doc.text('PURCHASE ORDER', 160, 25);
  doc.text(`PO-${request.id.substring(0, 8).toUpperCase()}`, 160, 32);

  doc.line(10, 45, 200, 45);

  // Vendor Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VENDOR:', 10, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(vendor.name, 10, 62);
  doc.text(vendor.address || 'Alamat tidak tersedia', 10, 69);
  doc.text(`WA: ${vendor.whatsapp}`, 10, 76);

  // Project Info
  doc.setFont('helvetica', 'bold');
  doc.text('SHIP TO:', 120, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(request.projectName, 120, 62);
  doc.text('Lokasi Proyek TBJ', 120, 69);

  doc.autoTable({
    startY: 90,
    head: [['Item Description', 'Quantity', 'Unit', 'Notes']],
    body: [[request.itemName, request.quantity, request.unit, request.note || '-']],
    theme: 'striped',
    headStyles: { fillColor: [0, 0, 0] }
  });

  const finalY = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(10);
  doc.text('Authorized Signature:', 10, finalY + 30);
  doc.line(10, finalY + 50, 60, finalY + 50);
  doc.text('TBJ Management', 10, finalY + 55);

  doc.save(`PO-${request.id.substring(0, 8).toUpperCase()}.pdf`);
};
