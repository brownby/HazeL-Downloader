 //create a user-defined function to download CSV file (from browser to user's machine)
 function downloadCsvFile(csvFileData, fileName) {

     //define the heading for each row of the data
     let csvContent = 'data:text/csv;charset=utf-8,';

     csvContent += csvFileData;

     // Download
     let anchor = document.getElementById('downloadAnchor')
     anchor.href = encodeURI(csvContent);
     anchor.download = fileName;
     anchor.click();
 }