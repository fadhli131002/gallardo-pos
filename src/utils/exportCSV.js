export const exportToCSV = (data, headers, filename) => {
  if (!data || !data.length) {
    return;
  }

  // Escape CSV strings and handle commas
  const escapeCsvField = (field) => {
    if (field === null || field === undefined) return '""';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.map(header => escapeCsvField(header)).join(','));
  
  // Add data rows
  for (const row of data) {
    csvRows.push(row.map(value => escapeCsvField(value)).join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
