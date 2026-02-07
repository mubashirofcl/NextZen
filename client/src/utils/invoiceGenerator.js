import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (order) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    // Theme Configuration
    const brandColor = [122, 106, 246]; // Your #7a6af6
    const darkText = [15, 23, 42];      // Your #0F172A
    const mutedText = [100, 116, 139];   // text-slate-500
    const borderColor = [226, 232, 240]; // border-slate-200

    // --- 1. BRANDING & HEADER ---
    // Brand Identity (Top Left)
    doc.setTextColor(...brandColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("NEXTGEN", 20, 25);
    doc.setTextColor(...darkText);
    doc.text("ARCHIVE.", 62, 25);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedText);
    doc.text("Official Deployment Manifest", 20, 31);

    // Document Title (Top Right)
    doc.setTextColor(...brandColor);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 190, 25, { align: "right" });
    
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    doc.text(new Date(order.createdAt).toLocaleDateString('en-US', { 
        month: 'long', day: 'numeric', year: 'numeric' 
    }), 190, 31, { align: "right" });

    // --- 2. INFORMATION GRID (To & From) ---
    doc.setDrawColor(...borderColor);
    doc.line(20, 45, 190, 45); // Separator

    // Business info (Left)
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("STORE ORIGIN", 20, 55);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedText);
    doc.text(["Archive HQ Terminal", "Silicon Valley, CA", "+1 234 567 890"], 20, 62);

    // Shipping info (Right)
    doc.setTextColor(...darkText);
    doc.setFont("helvetica", "bold");
    doc.text("SHIPPING TO:", 130, 55);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedText);
    const addr = order.addressId;
    doc.text([
        addr.fullName.toUpperCase(),
        addr.addressLine,
        `${addr.city}, ${addr.state}`,
        `PINCODE: ${addr.pincode}`
    ], 130, 62);

    // --- 3. ITEMS TABLE ---
    const tableColumn = ["ASSET DESCRIPTION", "UNIT PRICE", "QTY", "TOTAL"];
    const tableRows = order.items.map(item => [
        { content: item.productId?.name?.toUpperCase() || "ARCHIVE ASSET", styles: { fontStyle: 'bold' } },
        `INR ${item.price.toLocaleString()}`,
        item.quantity,
        { content: `INR ${item.totalAmount.toLocaleString()}`, styles: { halign: 'right' } }
    ]);

    autoTable(doc, {
        startY: 90,
        head: [tableColumn],
        body: tableRows,
        theme: 'plain',
        headStyles: { 
            fillColor: brandColor, 
            textColor: 255, 
            fontSize: 8,
            cellPadding: 4
        },
        bodyStyles: { 
            fontSize: 9,
            textColor: darkText,
            cellPadding: 6
        },
        columnStyles: {
            0: { cellWidth: 90 },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' }
        },
        margin: { left: 20, right: 20 },
        // Custom draw for horizontal lines only (matching the image)
        didDrawCell: (data) => {
            if (data.section === 'body') {
                doc.setDrawColor(...borderColor);
                doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
            }
        }
    });

    // --- 4. FINANCIAL SUMMARY ---
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(9);
    doc.setTextColor(...mutedText);
    doc.text("SUBTOTAL :", 150, finalY + 5, { align: "right" });
    doc.text("TAX VAT 0% :", 150, finalY + 12, { align: "right" });
    doc.text("DISCOUNT :", 150, finalY + 19, { align: "right" });

    doc.setTextColor(...darkText);
    doc.setFont("helvetica", "bold");
    doc.text(`INR ${order.totalMarketPrice.toLocaleString()}`, 190, finalY + 5, { align: "right" });
    doc.text("INR 0.00", 190, finalY + 12, { align: "right" });
    doc.setTextColor(34, 197, 94); // Green for discount
    doc.text(`- INR ${order.totalDiscount.toLocaleString()}`, 190, finalY + 19, { align: "right" });

    // Total Banner (matches the blue box in your image)
    doc.setFillColor(...brandColor);
    doc.rect(125, finalY + 25, 65, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("TOTAL DUE :", 130, finalY + 32.5);
    doc.text(`INR ${order.totalAmount.toLocaleString()}`, 185, finalY + 32.5, { align: "right" });

    // --- 5. FOOTER & TERMS ---
    doc.setTextColor(...brandColor);
    doc.setFontSize(12);
    doc.text("Thank you for your Business", 20, finalY + 55);

    doc.setDrawColor(...borderColor);
    doc.line(20, finalY + 65, 190, finalY + 65);

    // Bottom Details
    doc.setFontSize(8);
    doc.setTextColor(...darkText);
    doc.text("Questions?", 20, finalY + 75);
    doc.text("Payment Info:", 80, finalY + 75);
    doc.text("Terms & Conditions:", 135, finalY + 75);

    doc.setTextColor(...mutedText);
    doc.setFont("helvetica", "normal");
    doc.text(["Email: support@archive.com", "Web: nextgen-archive.com"], 20, finalY + 82);
    doc.text([`Method: ${order.paymentMethod.toUpperCase()}`, "Status: Verified"], 80, finalY + 82);
    doc.text("System generated manifest.\nNon-refundable after deployment.", 135, finalY + 82);

    // Save
    doc.save(`INVOICE_${order.orderNumber}.pdf`);
};