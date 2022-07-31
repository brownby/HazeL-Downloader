// Variable to store list of files from HazeL
// var fileList = ['220730_212500_meta', '220730_212500_data', '220730_212100_meta', '220730_212100_data'];

document.getElementById('connect').onclick = async function() {
    // Connect serial port
    console.log("Connecting serial port");
    await connectSerial();

    // // Send command to get list of files
    console.log("Sending ls command");
    await sendSerialLine('ls');

    // Begin listening to port
    await listenToPort();

    // console.log(serialResults);
    // Remove last character
    serialResults.slice(0, -1);

    // Create list of files
    fileList = serialResults.split('\n');
    console.log(fileList);

    // Populate table
    createFileList(fileList);
}
document.getElementById('download').onclick = downloadCsvFile;

var table = document.getElementById('fileList');

// Turn list of file (files) into rows in an HTML table
function createFileList(files) {
    for (i in files) {
        let filenameArray = files[i].split('_');

        let year = '20' + filenameArray[0].substr(0, 2);
        let month = filenameArray[0].substr(2, 2).replace(/^0+/, '');
        let day = filenameArray[0].substr(4, 2).replace(/^0+/, '')

        let date = month + '/' + day + '/' + year;

        let time = filenameArray[1].substr(0, 2) + ':' + filenameArray[1].substr(2, 2) + ':' + filenameArray[1].substr(4, 2);

        let type = filenameArray[2][0].toUpperCase() + filenameArray[2].substr(1);

        // Insert row at the end of the table
        let row = table.insertRow(-1);

        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);

        cell1.innerHTML = time;
        cell2.innerHTML = date;
        cell3.innerHTML = type;
    }
    table.style.visibility = 'visible';
}

function downloadData() {
    // Send dl command along with files to download

    // download CSV data from browser
}