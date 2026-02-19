import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (order) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const theme = {
        primary: [15, 23, 42],       // #0F172A
        accent: [122, 106, 246],     // #7a6af6
        slate: [51, 65, 85],         // text color
        muted: [148, 163, 184],      // light text
        border: [226, 232, 240],     // lines
        success: [34, 197, 94],      // green
        danger: [239, 68, 68],       // red (for refunds)
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
    doc.setFontSize(24);
    doc.setTextColor(...theme.primary);
    doc.text("NEXTGEN", margin, cursorY);
    doc.setTextColor(...theme.accent);
    doc.text("CLOTHING.", margin + 44, cursorY);

    doc.setFontSize(9);
    doc.setTextColor(...theme.muted);
    doc.text("ORDER REFERENCE", 195, 20, { align: "right" });

    doc.setFontSize(11);
    doc.setTextColor(...theme.primary);
    const invoiceNum = order.orderNumber || (order._id ? order._id.slice(-8).toUpperCase() : "NA");
    doc.text(`#${invoiceNum}`, 195, 26, { align: "right" });

    doc.setFontSize(8);
    doc.setTextColor(...theme.muted);
    doc.text(`DATE: ${new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}`, 195, 32, { align: "right" });

    const statusLabel = (order.status === 'pending' ? 'PROCESSING' : order.status).toUpperCase();
    const statusColor = order.status === 'delivered' ? theme.success : theme.primary;
    doc.setFillColor(...statusColor);
    doc.roundedRect(165, 36, 30, 6, 0.5, 0.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(statusLabel, 180, 40.2, { align: "center" });

    cursorY += 28;

    // --- ENTITY DETAILS ---
    doc.setDrawColor(...theme.border);
    doc.setLineWidth(0.1);
    doc.line(margin, cursorY, 195, cursorY);
    cursorY += 10;

    const colWidth = 95;
    
    // Left: Customer
    doc.setTextColor(...theme.muted);
    doc.setFontSize(7);
    doc.text("CUSTOMER ENTITY", margin, cursorY);
    doc.setTextColor(...theme.primary);
    doc.setFontSize(9);
    doc.text((order.userId?.name || "Verified Customer").toUpperCase(), margin, cursorY + 5);
    doc.setTextColor(...theme.slate);
    doc.setFontSize(8);
    doc.text(order.userId?.email || "", margin, cursorY + 9);

    // Right: Shipping
    doc.setTextColor(...theme.muted);
    doc.setFontSize(7);
    doc.text("SHIPPING DESTINATION", margin + colWidth, cursorY);
    const addr = order.addressId || {};
    doc.setTextColor(...theme.primary);
    doc.setFontSize(9);
    doc.text((addr.fullName || "Recipient").toUpperCase(), margin + colWidth, cursorY + 5);
    doc.setTextColor(...theme.slate);
    doc.setFontSize(8);
    const addressLines = [
        addr.addressLine,
        `${addr.city}, ${addr.state} - ${addr.pincode}`,
        addr.mobile ? `TEL: +91 ${addr.mobile}` : null
    ].filter(Boolean);
    doc.text(addressLines, margin + colWidth, cursorY + 9);

    cursorY += 30;

    // --- MATHEMATICAL ENGINE ---
    const finalTotalValue = Math.round(Number(order.totalAmount || 0)); 
    const shippingCost = Number(order.deliveryCharge || 0);
    const couponDiscount = Number(order.couponDiscount || 0);
    
    // 1. Gross Subtotal
    const tableSubtotal = order.items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);

    // 2. Refund Calculation
    let totalRefunded = 0;
    let cancelledItemsCount = 0;
    const isShippedOrBeyond = ['shipped', 'out_for_delivery', 'delivered', 'returned'].includes((order.status || '').toLowerCase());

    order.items.forEach(item => {
        if (['Cancelled', 'Returned'].includes(item.status)) {
            let itemCouponShare = 0;
            if (couponDiscount > 0 && tableSubtotal > 0) {
                itemCouponShare = ((Number(item.price) * Number(item.quantity)) / tableSubtotal) * couponDiscount;
            }
            totalRefunded += ((Number(item.price) * Number(item.quantity)) - itemCouponShare);
            cancelledItemsCount++;
        }
    });

    if (cancelledItemsCount === order.items.length && !isShippedOrBeyond) {
        totalRefunded += shippingCost;
    }

    // --- ITEM TABLE ---
    const tableBody = order.items.map((item, index) => {
        const unitPrice = Number(item.price);
        const qty = Number(item.quantity);
        const lineTotal = unitPrice * qty;
        const isVoided = ['Cancelled', 'Returned'].includes(item.status);

        // Append status if returned or cancelled
        let description = `${item.productId?.name || "Archive Asset"}\nSIZE: ${item.size}`;
        if (isVoided) {
            description += `   [${item.status.toUpperCase()}]`;
        }

        return [
            index + 1,
            { content: description, styles: { fontStyle: 'bold', textColor: isVoided ? theme.muted : theme.slate } },
            `INR ${unitPrice.toLocaleString('en-IN')}`,
            qty,
            { content: `INR ${lineTotal.toLocaleString('en-IN')}`, styles: { halign: 'right', textColor: isVoided ? theme.muted : theme.slate } }
        ];
    });

    autoTable(doc, {
        startY: cursorY,
        head: [["#", "DESCRIPTION", "UNIT PRICE", "QTY", "TOTAL"]],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: theme.primary, fontSize: 8, cellPadding: 3, lineWidth: 0 },
        bodyStyles: { fontSize: 8, textColor: theme.slate, cellPadding: 3, lineWidth: 0.1, strokeColor: theme.border },
        columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 3: { halign: 'center' }, 4: { cellWidth: 35, halign: 'right' } },
    });

    // --- SUMMARY SECTION ---
    let finalY = doc.lastAutoTable.finalY + 8;
    const summaryX = 130; 

    const addSummaryRow = (label, value, color = theme.slate, isBold = false) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(...(isBold ? theme.primary : theme.muted));
        doc.text(label, summaryX, finalY);
        doc.setTextColor(...color);
        doc.text(value, 195, finalY, { align: "right" });
        finalY += 5;
    };
    
    // Logical Invoice Flow: Subtotal -> Coupon -> Shipping -> Refund -> Total
    addSummaryRow("Order Subtotal", `INR ${tableSubtotal.toLocaleString('en-IN')}`);
    
    if (couponDiscount > 0) {
        addSummaryRow(
            `Coupon Savings (${order.couponCode || 'PROMO'})`, 
            `- INR ${couponDiscount.toLocaleString('en-IN')}`, 
            theme.accent, 
            true
        );
    }

    addSummaryRow("Logistics & Shipping", shippingCost === 0 ? "FREE" : `INR ${shippingCost.toLocaleString('en-IN')}`);
    
    // 🟢 Display Refunds if any items were cancelled or returned
    if (totalRefunded > 0) {
        addSummaryRow(
            "Processed Refunds / Cancellations", 
            `- INR ${Math.round(totalRefunded).toLocaleString('en-IN')}`, 
            theme.danger, 
            true
        );
    }

    finalY += 2;
    doc.setFillColor(...theme.primary);
    doc.rect(summaryX - 5, finalY, 195 - (summaryX - 5), 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL SETTLEMENT", summaryX, finalY + 6.5);
    doc.text(`INR ${finalTotalValue.toLocaleString('en-IN')}`, 193, finalY + 6.5, { align: "right" });

    const footerY = 270;

    doc.line(margin, footerY - 5, 195, footerY - 5);
    doc.setFontSize(7);
    doc.setTextColor(...theme.muted);
    const payMethod = (order.paymentMethod === 'cashOnDelivery' ? 'CASH ON DELIVERY' : order.paymentMethod === 'wallet' ? 'DIGITAL WALLET' : 'ONLINE / RAZORPAY');
    doc.text(`PAYMENT: ${payMethod} // STATUS: ${(order.paymentStatus || 'PENDING').toUpperCase()}`, margin, footerY);
    doc.text("This is a computer-generated document. No signature required.", 195, footerY, { align: "right" });

    doc.save(`INVOICE_${invoiceNum}.pdf`);
};