import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const getReportTitle = (filter, customDates) => {
    const now = new Date();
    const formats = {
        today: `Daily Sales Ledger - ${now.toLocaleDateString()}`,
        thisWeek: `Weekly Performance Audit - ${now.toLocaleDateString()}`,
        thisMonth: `Monthly Financial Ledger - ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
        thisYear: `Annual Audit Report - ${now.getFullYear()}`,
        custom: `Custom Period Audit (${customDates?.start || 'N/A'} to ${customDates?.end || 'N/A'})`
    };
    return formats[filter] || "General Sales Audit Ledger";
};

export const downloadPDF = (report, filter, customDates) => {
    const exportData = report?.allOrdersForExport || report?.recentOrders || [];
    if (!exportData.length) {
        alert("No data available to export for the selected range.");
        return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    const title = getReportTitle(filter, customDates);

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("NEXTZEN EXECUTIVE LEDGER", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(title, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    doc.setDrawColor(241, 245, 249);
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 40, 268, 25, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Orders: ${report.salesCount}`, 20, 48);
    doc.text(`Net Revenue: INR ${report.totalOrderAmount.toLocaleString()}`, 20, 56);
    doc.text(`Product Sales: INR ${report.productRevenue.toLocaleString()}`, 100, 48);
    doc.text(`Shipping Fees: INR ${report.totalDeliveryFees.toLocaleString()}`, 100, 56);
    doc.text(`Total Coupon Savings: INR ${report.couponDiscount.toLocaleString()}`, 180, 48);
    doc.setFont(undefined, 'normal');

    const tableColumn = [
        "Order ID", 
        "Date", 
        "Customer", 
        "Payment Method",    
        "Payment Status",  
        "Discount", 
        "Delivery", 
        "Total"
    ];

    const tableRows = exportData.map(order => [
        `#${order.orderNumber}`,
        new Date(order.date).toLocaleDateString(),
        order.customer || "Guest User",
        (order.paymentMethod === 'cashOnDelivery' ? 'COD' : order.paymentMethod?.toUpperCase() || 'N/A'),
        order.paymentStatus?.toUpperCase() || 'PAID',
        `INR ${Number(order.discount || 0).toLocaleString()}`,
        `INR ${Number(order.deliveryCharge || 0).toLocaleString()}`,
        `INR ${order.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: 'grid',
        headStyles: { fillColor: [122, 106, 246], fontSize: 8, halign: 'center' },
        styles: { fontSize: 7.5, cellPadding: 2.5, valign: 'middle' },
        columnStyles: {
            0: { fontStyle: 'bold' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right', fontStyle: 'bold' }
        }
    });

    doc.save(`NextZen_${filter}_Full_Report.pdf`);
};



export const downloadExcel = (report, filter) => {
    const exportData = report?.allOrdersForExport || report?.recentOrders || [];
    if (!exportData.length) {
        alert("No data available to export for the selected range.");
        return;
    }

    const dataForExcel = exportData.map(order => ({
        "Order ID": `#${order.orderNumber}`,
        "Transaction Date": new Date(order.date).toLocaleDateString(),
        "Customer Name": order.customer || "Guest User",
        "Payment Method": (order.paymentMethod === 'cashOnDelivery' ? 'COD' : order.paymentMethod?.toUpperCase() || 'N/A'), // 🟢
        "Payment Status": order.paymentStatus?.toUpperCase() || 'PAID', // 🟢
        "Order Status": order.status.toUpperCase(),
        "Coupon Discount (INR)": order.discount || 0,
        "Delivery Fee (INR)": order.deliveryCharge || 0,
        "Total Settlement (INR)": order.amount
    }));

    dataForExcel.push({}); 
    dataForExcel.push({
        "Order ID": "SUMMARY TOTALS",
        "Customer Name": `Count: ${report.salesCount}`,
        "Coupon Discount (INR)": report.couponDiscount,
        "Delivery Fee (INR)": report.totalDeliveryFees,
        "Total Settlement (INR)": report.totalOrderAmount
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales_Audit_Ledger");

    worksheet['!cols'] = [
        { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }
    ];

    XLSX.writeFile(workbook, `NextZen_${filter}_Audit_Sales.xlsx`);
};