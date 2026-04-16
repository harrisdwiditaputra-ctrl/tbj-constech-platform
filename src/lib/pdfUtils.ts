import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { TBJ_LOGO } from '../constants';
import { AIEstimateResponse } from '../types';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateRABPDF = (projectName: string, categories: any[], items: any[]) => {
  const doc = new jsPDF();
  const logoUrl = TBJ_LOGO;

  // Header
  try {
    doc.addImage(logoUrl, 'PNG', 10, 10, 30, 30);
  } catch (e) {
    console.error('Failed to add logo to PDF:', e);
    doc.rect(10, 10, 30, 30, 'S');
    doc.setFontSize(8);
    doc.text('LOGO', 18, 27);
  }
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TBJ CONSTECH', 50, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Construction & Renovation Services', 50, 32);
  doc.text('Jakarta, Indonesia | +62 812-3456-7890', 50, 37);

  doc.line(10, 45, 200, 45);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL OF QUANTITIES (RAB)', 10, 55);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
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
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
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
  const logoUrl = TBJ_LOGO;

  // Header
  try {
    doc.addImage(logoUrl, 'PNG', 10, 10, 30, 30);
  } catch (e) {
    console.error('Failed to add logo to PDF:', e);
    doc.rect(10, 10, 30, 30, 'S');
    doc.setFontSize(8);
    doc.text('LOGO', 18, 27);
  }
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TBJ CONSTECH', 50, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
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

  const tableBody = request.items && request.items.length > 0
    ? request.items.map((it: any) => [it.name, it.quantity, it.unit, '-'])
    : [[request.itemName, request.quantity, request.unit, request.note || '-']];

  doc.autoTable({
    startY: 90,
    head: [['Item Description', 'Quantity', 'Unit', 'Notes']],
    body: tableBody,
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

export const generateAIPDF = (projectName: string, estimation: AIEstimateResponse) => {
  const doc = new jsPDF();
  const logoUrl = TBJ_LOGO;

  // Header
  try {
    doc.addImage(logoUrl, 'PNG', 10, 10, 30, 30);
  } catch (e) {
    console.error('Failed to add logo to PDF:', e);
    doc.rect(10, 10, 30, 30, 'S');
    doc.setFontSize(8);
    doc.text('LOGO', 18, 27);
  }
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TBJ CONSTECH', 50, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AI ESTIMATION SUMMARY', 150, 25);

  doc.line(10, 45, 200, 45);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Project: ${projectName}`, 10, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('AI ANALYSIS:', 10, 72);
  doc.setFont('helvetica', 'normal');
  const splitAnalysis = doc.splitTextToSize(estimation.analysis, 180);
  doc.text(splitAnalysis, 10, 79);

  const startY = 79 + (splitAnalysis.length * 5) + 10;

  const tableData = estimation.items.map(item => [
    item.name,
    item.quantity,
    item.unit,
    `Rp ${item.pricePerUnit.toLocaleString()}`,
    `Rp ${item.totalPrice.toLocaleString()}`
  ]);

  doc.autoTable({
    startY: startY,
    head: [['Item Description', 'Qty', 'Unit', 'Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0] }
  });

  const finalY = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL ESTIMATED COST: Rp ${estimation.totalEstimatedCost.toLocaleString()}`, 10, finalY + 15);

  doc.save(`AI-Estimation-${projectName.replace(/\s+/g, '-')}.pdf`);
};
