import React from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '../ui/button';
import { Download, FileText } from 'lucide-react';
import type { InvoiceWithDetails } from '../../services/invoiceApi';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PDFGeneratorProps {
  invoice: InvoiceWithDetails;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
  onGenerated?: (blob: Blob) => void;
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({
  invoice,
  companyInfo = {
    name: 'Gold Shop Company',
    address: '123 Main Street, City, State 12345',
    phone: '(555) 123-4567',
    email: 'info@goldshop.com',
  },
  onGenerated,
}) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Helper function to add text with automatic line wrapping
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const lines = doc.splitTextToSize(text, options.maxWidth || pageWidth - 40);
      doc.text(lines, x, y, options);
      return y + (lines.length * (options.lineHeight || 6));
    };

    // Header - Company Info
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    yPosition = addText(companyInfo.name, 20, yPosition);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(companyInfo.address, 20, yPosition + 5);
    yPosition = addText(`Phone: ${companyInfo.phone}`, 20, yPosition + 3);
    yPosition = addText(`Email: ${companyInfo.email}`, 20, yPosition + 3);

    // Invoice Title and Number
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - 20, 30, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - 20, 45, { align: 'right' });
    doc.text(`Date: ${format(new Date(invoice.created_at), 'MMM dd, yyyy')}`, pageWidth - 20, 55, { align: 'right' });
    
    // Status
    const statusColor = invoice.status === 'paid' ? [0, 128, 0] as [number, number, number] : 
                       invoice.status === 'partially_paid' ? [255, 165, 0] as [number, number, number] : [255, 0, 0] as [number, number, number];
    doc.setTextColor(...statusColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 20, 65, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black

    yPosition = Math.max(yPosition, 80);

    // Customer Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Bill To:', 20, yPosition);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (invoice.customer) {
      yPosition = addText(invoice.customer.name, 20, yPosition + 5);
      if (invoice.customer.phone) {
        yPosition = addText(`Phone: ${invoice.customer.phone}`, 20, yPosition + 3);
      }
      if (invoice.customer.email) {
        yPosition = addText(`Email: ${invoice.customer.email}`, 20, yPosition + 3);
      }
      if (invoice.customer.address) {
        yPosition = addText(invoice.customer.address, 20, yPosition + 3, { maxWidth: 100 });
      }
    }

    yPosition += 15;

    // Pricing Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Pricing Details:', 20, yPosition);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const pricingDetails = [
      `Gold Price: $${invoice.gold_price_per_gram?.toFixed(2) || '0.00'}/gram`,
      `Labor Cost: ${invoice.labor_cost_percentage}%`,
      `Profit Margin: ${invoice.profit_percentage}%`,
      `VAT: ${invoice.vat_percentage}%`
    ];
    
    pricingDetails.forEach((detail, index) => {
      doc.text(detail, 20 + (index * 45), yPosition + 10);
    });

    yPosition += 25;

    // Items Table
    const tableColumns = [
      { header: 'Item', dataKey: 'item' },
      { header: 'Qty', dataKey: 'quantity' },
      { header: 'Weight (g)', dataKey: 'weight' },
      { header: 'Total Weight (g)', dataKey: 'totalWeight' },
      { header: 'Unit Price', dataKey: 'unitPrice' },
      { header: 'Total', dataKey: 'total' }
    ];

    const tableRows = invoice.invoice_items.map(item => ({
      item: item.inventory_item?.name || 'Unknown Item',
      quantity: item.quantity.toString(),
      weight: item.weight_grams.toFixed(3),
      totalWeight: (item.weight_grams * item.quantity).toFixed(3),
      unitPrice: `$${item.unit_price.toFixed(2)}`,
      total: `$${item.total_price.toFixed(2)}`
    }));

    doc.autoTable({
      startY: yPosition,
      head: [tableColumns.map(col => col.header)],
      body: tableRows.map(row => tableColumns.map(col => row[col.dataKey as keyof typeof row])),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Get the final Y position after the table
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Totals
    const totalsX = pageWidth - 80;
    const totalWeight = invoice.invoice_items.reduce(
      (sum, item) => sum + (item.weight_grams * item.quantity), 
      0
    );

    doc.setFontSize(10);
    doc.text(`Total Weight: ${totalWeight.toFixed(3)}g`, totalsX, yPosition);
    yPosition += 8;
    
    doc.text(`Subtotal: $${invoice.total_amount.toFixed(2)}`, totalsX, yPosition);
    yPosition += 8;

    // Draw line above grand total
    doc.line(totalsX - 5, yPosition, pageWidth - 15, yPosition);
    yPosition += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: $${invoice.total_amount.toFixed(2)}`, totalsX, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 128, 0);
    doc.text(`Paid: $${invoice.paid_amount.toFixed(2)}`, totalsX, yPosition);
    yPosition += 8;

    if (invoice.remaining_amount > 0) {
      doc.setTextColor(255, 0, 0);
      doc.text(`Remaining: $${invoice.remaining_amount.toFixed(2)}`, totalsX, yPosition);
    }
    doc.setTextColor(0, 0, 0); // Reset to black

    // Payment History (if any)
    if (invoice.payments && invoice.payments.length > 0) {
      yPosition += 20;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('Payment History:', 20, yPosition);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      invoice.payments.forEach((payment) => {
        yPosition += 8;
        const paymentText = `${format(new Date(payment.payment_date), 'MMM dd, yyyy')} - $${payment.amount.toFixed(2)} (${payment.payment_method})`;
        yPosition = addText(paymentText, 25, yPosition);
      });
    }

    // Footer
    yPosition = pageHeight - 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
    doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth / 2, yPosition + 8, { align: 'center' });

    // Generate and handle the PDF
    const pdfBlob = doc.output('blob');
    onGenerated?.(pdfBlob);

    // Download the PDF
    doc.save(`invoice-${invoice.invoice_number}.pdf`);
  };

  return (
    <Button 
      onClick={generatePDF} 
      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <Download className="h-4 w-4" />
      Generate PDF
    </Button>
  );
};