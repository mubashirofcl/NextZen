import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Generates a descriptive title based on the active UI filter
 * @param {string} filter - The active filter (today, thisWeek, etc.)
 * @param {object} customDates - Object containing start and end dates
 */
const getReportTitle = (filter, customDates) => {
    const now = new Date();
    const formats = {
        today: `Daily Sales - ${now.toLocaleDateString()}`,
        thisWeek: `Weekly Performance - Week of ${now.toLocaleDateString()}`,
        thisMonth: `Monthly Ledger - ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
        thisYear: `Annual Audit - ${now.getFullYear()}`,
        custom: `Custom Period (${customDates?.start || 'N/A'} to ${customDates?.end || 'N/A'})`
    };
    return formats[filter] || "General Sales Report";
};

/**
 * PDF Utility
 * Exports all orders within the selected range
 */
export const downloadPDF = (report, filter, customDates) => {
    // 🟢 Use allOrdersForExport to ensure no data is missing
    const exportData = report?.allOrdersForExport || report?.recentOrders || [];
    if (!exportData.length) {
        alert("No data available to export for the selected range.");
        return;
    }

    const doc = new jsPDF();
    const title = getReportTitle(filter, customDates);

    // Branding Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("NEXTZEN EXECUTIVE LEDGER", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(title, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

    // Summary Metrics Section (Financial Overview)
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(14, 42, 182, 22, 'F');
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Orders: ${report.salesCount}`, 20, 50);
    doc.text(`Gross Revenue: INR ${report.totalOrderAmount.toLocaleString()}`, 20, 57);
    doc.setFont(undefined, 'normal');

    // Table Data Setup
    const tableColumn = ["Receipt #", "Customer", "Amount Paid", "Date", "Status"];
    const tableRows = exportData.map(order => [
        `#${order.orderNumber}`,
        order.customer || "Guest User",
        `INR ${order.amount.toLocaleString()}`,
        new Date(order.date).toLocaleDateString(),
        order.status.toUpperCase()
    ]);

    // 🟢 Fixed: Calling autoTable directly on the doc instance
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'grid',
        headStyles: { 
            fillColor: [122, 106, 246], // NEXTZEN Purple
            fontSize: 9, 
            halign: 'center' 
        },
        styles: { 
            fontSize: 8, 
            cellPadding: 3,
            valign: 'middle' 
        },
        columnStyles: {
            2: { halign: 'right' }, // Amount Paid
            4: { halign: 'center' } // Status
        },
        margin: { top: 70 }
    });

    doc.save(`NextZen_${filter}_Full_Report.pdf`);
};

/**
 * Excel Utility
 * Exports all orders within the selected range to .xlsx
 */
export const downloadExcel = (report, filter) => {
    // 🟢 Use allOrdersForExport to ensure no data is missing
    const exportData = report?.allOrdersForExport || report?.recentOrders || [];
    if (!exportData.length) {
        alert("No data available to export for the selected range.");
        return;
    }

    // Map raw data to user-friendly Excel headers
    const dataForExcel = exportData.map(order => ({
        "Receipt Number": `#${order.orderNumber}`,
        "Customer Name": order.customer || "Guest User",
        "Net Amount (INR)": order.amount,
        "Transaction Date": new Date(order.date).toLocaleDateString(),
        "Order Status": order.status.toUpperCase()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales_Full_Ledger");

    // Professional column widths
    worksheet['!cols'] = [
        { wch: 20 }, // Receipt Number
        { wch: 25 }, // Customer Name
        { wch: 18 }, // Net Amount
        { wch: 18 }, // Transaction Date
        { wch: 15 }  // Order Status
    ];

    XLSX.writeFile(workbook, `NextZen_${filter}_Sales_Data.xlsx`);
};