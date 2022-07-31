// let csvFileData = [
//     ['Alan Walker', 'Singer'],
//     ['Cristiano Ronaldo', 'Footballer'],
//     ['Saina Nehwal', 'Badminton Player'],
//     ['Arijit Singh', 'Singer'],
//     ['Terence Lewis', 'Dancer']
//  ];

 //create a user-defined function to download CSV file (from browser to user's machine)
 function downloadCsvFile(csvFileData) {

     //define the heading for each row of the data
     let csvContent = 'data:text/csv;charset=utf-8,'
     csvContent += 'Name,Profession\n';

     //merge the data with CSV
     csvFileData.forEach(function(row) {
             csvContent += row.join(',');
             csvContent += "\n";
     });

     // Download
     let anchor = document.getElementById('downloadAnchor')
     anchor.href = encodeURI(csvContent);
     anchor.download = 'test.csv';
     anchor.click();
 }