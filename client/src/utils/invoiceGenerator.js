import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (order) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const theme = {
        primary: [15, 23, 42],
        accent: [122, 106, 246],
        slate: [51, 65, 85],
        text: [51, 65, 85],
        muted: [148, 163, 184],
        border: [226, 232, 240],
        success: [34, 197, 94],
        light: [248, 250, 252]
    };

    const margin = 15;
    let cursorY = 20;

    // --- HEADER ---
    doc.setFontSize(8);
    doc.setTextColor(...theme.accent);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL INVOICE // DEPLOYMENT MANIFEST", margin, cursorY);
    
    cursorY += 8;
    doc.setFontSize(26);
    doc.setTextColor(...theme.primary);
    doc.text("NEXTGEN", margin, cursorY);
    doc.setTextColor(...theme.accent);
    doc.text("ARCHIVE.", margin + 48, cursorY);

    doc.setFontSize(10);
    doc.setTextColor(...theme.muted);
    doc.text("ORDER REFERENCE", 195, 20, { align: "right" });
    
    doc.setFontSize(12);
    doc.setTextColor(...theme.primary);
    const invoiceNum = order.orderNumber || order._id.slice(-8).toUpperCase();
    doc.text(`#${invoiceNum}`, 195, 26, { align: "right" });
    
    doc.setFontSize(9);
    doc.setTextColor(...theme.muted);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 195, 33, { align: "right" });

    // Status Badge
    const statusLabel = (order.status === 'pending' ? 'PROCESSING' : order.status).toUpperCase();
    const statusColor = order.status === 'delivered' ? theme.success : theme.primary;
    doc.setFillColor(...statusColor);
    doc.roundedRect(155, 38, 40, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(statusLabel, 175, 42.5, { align: "center" });

    cursorY += 25;

    // --- ADDRESS SECTION ---
    doc.setDrawColor(...theme.border);
    doc.setLineWidth(0.5);
    doc.line(margin, cursorY, 195, cursorY);
    cursorY += 10;
    
    doc.setTextColor(...theme.muted);
    doc.setFontSize(7);
    doc.text("CUSTOMER ENTITY", margin, cursorY);
    
    cursorY += 5;
    doc.setTextColor(...theme.primary);
    doc.setFontSize(10);
    doc.text((order.userId?.name || "Verified Customer").toUpperCase(), margin, cursorY);
    
    cursorY += 5;
    doc.setTextColor(...theme.slate);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(order.userId?.email || "", margin, cursorY);

    let rightColY = cursorY - 10;
    const rightColX = 110;
    doc.setTextColor(...theme.muted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("SHIPPING DESTINATION", rightColX, rightColY);
    
    rightColY += 5;
    doc.setTextColor(...theme.primary);
    doc.setFontSize(10);
    const addr = order.addressId || {};
    doc.text((addr.fullName || "Recipient").toUpperCase(), rightColX, rightColY);
    
    rightColY += 5;
    doc.setTextColor(...theme.slate);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const addressLines = [
        addr.addressLine, 
        `${addr.city}, ${addr.state}`, 
        `PIN: ${addr.pincode}`, 
        addr.mobile ? `Tel: +91 ${addr.mobile}` : null
    ].filter(Boolean);
    
    doc.text(addressLines, rightColX, rightColY);
    cursorY = Math.max(cursorY, rightColY + (addressLines.length * 5)) + 10;

    // --- ACCURATE MATH ENGINE ---
    const totalAmount = Number(order.totalAmount || 0);
    const deliveryCharge = Number(order.deliveryCharge || 0);
    const totalDiscount = Number(order.totalDiscount || 0);
    
    // Reverse calculating subtotal and tax assuming 18% GST (standard for your code)
    const taxRate = 0.18;
    const subTotalExclTax = (totalAmount - deliveryCharge) / (1 + taxRate);
    const calculatedTax = (totalAmount - deliveryCharge) - subTotalExclTax;

    // --- ITEMS TABLE ---
    const tableBody = order.items.map((item, index) => {
        const itemTotal = Number(item.totalAmount || (item.price * item.quantity));
        const unitPrice = Number(item.price);
        
        return [
            index + 1,
            { 
                content: `${item.productId?.name || "Archive Asset"}\nSize: ${item.size}`, 
                styles: { fontStyle: 'bold' } 
            },
            `INR ${unitPrice.toLocaleString()}`,
            item.quantity,
            { content: `INR ${itemTotal.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold' } }
        ];
    });

    autoTable(doc, {
        startY: cursorY,
        head: [["#", "DESCRIPTION", "UNIT PRICE", "QTY", "TOTAL"]],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: theme.primary, textColor: 255, fontSize: 8, cellPadding: 4 },
        bodyStyles: { fontSize: 9, textColor: theme.slate, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 3: { halign: 'center' }, 4: { cellWidth: 40, halign: 'right' } },
    });

    // --- SUMMARY SECTION ---
    let finalY = doc.lastAutoTable.finalY + 10;
    const summaryLabelX = 130;
    const summaryValueX = 195;

    const addRow = (label, value, color = theme.slate, isBold = false) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(...theme.muted);
        doc.text(label, summaryLabelX, finalY);
        doc.setTextColor(...color);
        doc.text(value, summaryValueX, finalY, { align: "right" });
        finalY += 6;
    };

    addRow("Subtotal (Excl. Tax)", `INR ${Math.round(subTotalExclTax).toLocaleString()}`);
    addRow("Estimated GST (18%)", `INR ${Math.round(calculatedTax).toLocaleString()}`);
    
    if (totalDiscount > 0) {
        addRow("Archive Savings", `- INR ${totalDiscount.toLocaleString()}`, theme.success, true);
    }

    addRow("Shipping & Handling", deliveryCharge === 0 ? "FREE" : `INR ${deliveryCharge.toLocaleString()}`);
    
    finalY += 2;
    doc.setFillColor(...theme.primary);
    doc.roundedRect(summaryLabelX - 5, finalY, 70, 12, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL SETTLEMENT", summaryLabelX, finalY + 8);
    doc.text(`INR ${totalAmount.toLocaleString()}`, summaryValueX, finalY + 8, { align: "right" });

    // --- FOOTER ---
    const footerY = 275;
    doc.setDrawColor(...theme.border);
    doc.line(margin, footerY - 5, 195, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(...theme.primary);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT INFORMATION", margin, footerY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...theme.slate);
    const payMethod = (order.paymentMethod === 'cashOnDelivery' ? 'Cash on Delivery' : 'Online / Razorpay').toUpperCase();
    doc.text(`${payMethod} // STATUS: ${(order.paymentStatus || 'Pending').toUpperCase()}`, margin, footerY + 5);
    
    doc.setTextColor(...theme.muted);
    doc.text("This is a computer-generated document. No signature required.", 195, footerY + 5, { align: "right" });

    doc.save(`INVOICE_${invoiceNum}.pdf`);
};