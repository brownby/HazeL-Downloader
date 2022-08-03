// Function for downloading a CSV into a file called filename
 function downloadCsvFile(csvFileData, fileName) {

    // CSV header content
    let csvContent = 'data:text/csv;charset=utf-8,';

    // HazeL data and metadata files already have column headers, no need to add them
    csvContent += csvFileData;

    // Download the file
    let anchor = document.getElementById('downloadAnchor')
    anchor.href = encodeURI(csvContent);
    anchor.download = fileName;
    anchor.click();
 }