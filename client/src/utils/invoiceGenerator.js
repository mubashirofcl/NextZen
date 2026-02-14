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
    doc.text("DEPLOYMENT MANIFEST // INVOICE", margin, cursorY);
    
    cursorY += 8;
    doc.setFontSize(26);
    doc.setTextColor(...theme.primary);
    doc.text("NEXTGEN", margin, cursorY);
    doc.setTextColor(...theme.accent);
    doc.text("ARCHIVE.", margin + 48, cursorY);

    doc.setFontSize(10);
    doc.setTextColor(...theme.muted);
    doc.text("REFERENCE ID", 195, 20, { align: "right" });
    
    doc.setFontSize(12);
    doc.setTextColor(...theme.primary);
    const invoiceNum = order.orderNumber?.split('-')[1] || order._id.slice(-6).toUpperCase();
    doc.text(`#${invoiceNum}`, 195, 26, { align: "right" });
    
    doc.setFontSize(9);
    doc.setTextColor(...theme.muted);
    doc.text(`Issued: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`, 195, 33, { align: "right" });

    const statusColor = order.status === 'delivered' ? theme.success : theme.primary;
    doc.setFillColor(...statusColor);
    doc.roundedRect(165, 38, 30, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text((order.status || 'PENDING').toUpperCase(), 180, 42.5, { align: "center" });

    cursorY += 25;

    // --- ADDRESS ---
    doc.setDrawColor(...theme.border);
    doc.setLineWidth(0.5);
    doc.line(margin, cursorY, 195, cursorY);
    cursorY += 10;
    
    doc.setTextColor(...theme.muted);
    doc.setFontSize(7);
    doc.text("BILLED TO ENTITY", margin, cursorY);
    
    cursorY += 5;
    doc.setTextColor(...theme.primary);
    doc.setFontSize(10);
    doc.text((order.userId?.name || "Guest").toUpperCase(), margin, cursorY);
    
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
    doc.text("DEPLOYMENT LOCATION", rightColX, rightColY);
    
    rightColY += 5;
    doc.setTextColor(...theme.primary);
    doc.setFontSize(10);
    const addr = order.addressId || {};
    doc.text((addr.fullName || "Customer").toUpperCase(), rightColX, rightColY);
    
    rightColY += 5;
    doc.setTextColor(...theme.slate);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const addressLines = [
        addr.addressLine, 
        `${addr.city}, ${addr.state}`, 
        `PIN: ${addr.pincode}`, 
        addr.mobile ? `Contact: ${addr.mobile}` : null
    ].filter(Boolean);
    
    doc.text(addressLines, rightColX, rightColY);
    cursorY = Math.max(cursorY, rightColY + (addressLines.length * 5)) + 15;

    // --- MATH ENGINE ---
    const finalPaid = Number(order.totalAmount || 0);
    const discountValue = Number(order.totalDiscount || order.discountAmount || 0);
    const calculatedMarketValue = finalPaid + discountValue;

    // --- TABLE ---
    const tableBody = order.items.map((item, index) => {
        const soldPrice = Number(item.price);
        const qty = Number(item.quantity || 1);
        const productData = (typeof item.productId === 'object') ? item.productId : {};
        
        const possibleMarketPrices = [item.originalPrice, productData.originalPrice, productData.mrp, productData.price];
        const highPrice = Math.max(...possibleMarketPrices.map(p => Number(p) || 0));
        
        const hasDiscount = highPrice > soldPrice;
        const displayMarketPrice = hasDiscount ? highPrice : soldPrice;
        
        let priceDisplay = `INR ${soldPrice.toLocaleString()}`;
        if (hasDiscount) priceDisplay += `\n(List: INR ${displayMarketPrice.toLocaleString()})`;

        const productName = productData.name || "Unknown Asset";
        const variantText = `Spec: ${item.size} ${item.color ? `| ${item.color}` : ''}`;

        return [
            index + 1,
            { content: `${productName}\n${variantText}`, styles: { fontStyle: 'bold', textColor: theme.primary } },
            { content: (item.status || 'Placed').toUpperCase(), styles: { fontSize: 7, textColor: theme.slate } },
            { content: priceDisplay, styles: { fontSize: 8, textColor: hasDiscount ? theme.accent : theme.slate } },
            qty,
            { content: `INR ${(soldPrice * qty).toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold' } }
        ];
    });

    autoTable(doc, {
        startY: cursorY,
        head: [["#", "ASSET DETAILS", "STATUS", "VALUATION", "QTY", "TOTAL"]],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: theme.primary, textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'left', cellPadding: 4 },
        bodyStyles: { fontSize: 9, textColor: theme.slate, valign: 'middle', lineColor: theme.border, cellPadding: 5 },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 60 }, 5: { cellWidth: 35, halign: 'right' } },
        alternateRowStyles: { fillColor: theme.light }
    });

    // --- SUMMARY ---
    let finalY = doc.lastAutoTable.finalY + 10;
    const summaryLabelX = 135;
    const summaryValueX = 195;

    const addRow = (label, value, isBold = false, color = theme.slate) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(...theme.muted);
        doc.text(label, summaryLabelX, finalY);
        doc.setTextColor(...color);
        doc.text(value, summaryValueX, finalY, { align: "right" });
        finalY += 6;
    };

    addRow("Market Valuation", `INR ${calculatedMarketValue.toLocaleString()}`);
    
    if (discountValue > 0) {
        addRow("Total Savings", `- INR ${discountValue.toLocaleString()}`, false, theme.success);
    } else {
        addRow("Discount", `INR 0.00`, false, theme.slate);
    }

    addRow("Delivery Protocols", order.deliveryCharge === 0 ? "Free" : `INR ${order.deliveryCharge}`);
    
    finalY += 2;
    doc.setFillColor(...theme.primary);
    doc.roundedRect(summaryLabelX - 5, finalY, 70, 12, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL DEPLOYMENT", summaryLabelX, finalY + 8);
    doc.text(`INR ${finalPaid.toLocaleString()}`, summaryValueX, finalY + 8, { align: "right" });

    if (discountValue > 0) {
        finalY += 18;
        doc.setTextColor(...theme.success);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bolditalic");
        doc.text(`You saved INR ${discountValue.toLocaleString()} on this archive.`, 195, finalY, { align: "right" });
    }

    // --- FOOTER ---
    const footerY = 275;
    doc.setDrawColor(...theme.border);
    doc.line(margin, footerY - 5, 195, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(...theme.primary);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT PROTOCOL", margin, footerY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...theme.slate);
    const payMethod = (order.paymentMethod || 'COD').toUpperCase();
    doc.text(`${payMethod} // ${(order.paymentStatus || 'Pending').toUpperCase()}`, margin, footerY + 5);
    
    doc.setTextColor(...theme.muted);
    doc.text("NextGen Archive | Authorized Deployment Manifest", 195, footerY + 5, { align: "right" });

    doc.save(`INVOICE_${order.orderNumber}.pdf`);
};