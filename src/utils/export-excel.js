import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Helper function to create and download Excel file
const exportToExcel = (data, fileName, sheetName = 'Sheet 1') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Save file
    saveAs(blob, fileName);
};

// Export lending history data
export const exportLendingHistory = (lendings) => {
    // Format data according to the template
    const formattedData = lendings.map((lending, index) => {
        const isReturned = !!lending.restoration;

        return {
            'No': index + 1,
            'Name': lending.name || '-',
            'StuffName': lending.stuff?.name || '-',
            'TotalStuff': lending.total_stuff || 0,
            'DateOfLending': formatDate(lending.date_time || lending.created_at),
            'RestorationStatus': isReturned ? 'Returned' : '-',
            'RestorationTotalGoodStuff': isReturned ? lending.restoration.total_good_stuff : '-',
            'RestorationTotalDefecStuff': isReturned ? lending.restoration.total_defec_stuff : '-',
            'DateOfRestoration': isReturned ? formatDate(lending.restoration.date_time || lending.restoration.created_at) : '-'
        };
    });

    exportToExcel(formattedData, 'lending-history.xlsx', 'Lending History');
};

// Export inbound items data
export const exportInboundItems = (inboundItems) => {
    // Format data according to the template
    const formattedData = inboundItems.map((item, index) => {
        return {
            'No': index + 1,
            'StuffName': item.stuff?.name || '-',
            'TotalItem': item.total || 0,
            'ProofFile': item.proof_file || '-',
            'Date': formatDate(item.date_time || item.created_at)
        };
    });

    exportToExcel(formattedData, 'inbound-items.xlsx', 'Inbound Items');
};

// Export inventory items data
export const exportInventoryItems = (items) => {
    // Format data according to the template
    const formattedData = items.map((item, index) => {
        return {
            'No': index + 1,
            'Title': item.name || '-',
            'Type': item.type || '-',
            'TotalAvail': item.stuff_stock ? item.stuff_stock.total_available : 0,
            'TotalDefec': item.stuff_stock ? item.stuff_stock.total_defec : 0
        };
    });

    exportToExcel(formattedData, 'inventory-items.xlsx', 'Inventory Items');
};

// Helper function to format date
const formatDate = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    const day = date.getDate();
    const month = new Intl.DateTimeFormat('en', { month: 'long' }).format(date);
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
};
