// Variable to store list of files from HazeL
// var fileList = ['220730_212500_meta', '220730_212500_data', '220730_212100_meta', '220730_212100_data'];
var fileList;

document.getElementById('connect').onclick = async function() {
    // Connect serial port
    console.log("Connecting serial port");
    await connectSerial();

    // // Send command to get list of files
    console.log("Sending ls command");
    await sendSerialLine('ls');

    // Begin listening to port, wait for EOT character
    await listenToPort('\x04');

    // console.log(serialResults);
    // Remove EOT character and final newline
    serialResults = serialResults.slice(0, -2);

    // Create list of files
    fileList = serialResults.split('\n');
    console.log(fileList);

    // Populate table
    createFileList(fileList);
};

document.getElementById('download').onclick = async function() {
    // Get list of files to download (by checking checkboxes in table)
    let filesToDownload = [];

    // If select all is checked, upload all the files
    if (document.getElementById('selectAll').checked == true) {
        filesToDownload = fileList;
    }
    // Otherwise, construct filesToDownload based on checkboxes
    else {
        let tableBody = document.getElementById('fileListBody');
        for (let i = 0, row; row = tableBody.rows[i]; i++) {
            if (row.cells[0].firstChild.checked) {
                let fileName = row.cells[0].firstChild.name;
                filesToDownload.push(fileName);
            }
        }
    }
    console.log(filesToDownload);

    if (filesToDownload.length > 0) {
        let cmd = "dl ";

        // Loop through filesToDownload and download each
        for (let i = 0; i < filesToDownload.length; i++) {
            cmd += filesToDownload[i];

            // Send command to download current file
            await sendSerialLine(cmd);

            // Listen to port until EOT char
            await listenToPort('\x04');

            // Remove ETX and EOT characters
            serialResults = serialResults.slice(0, -2);

            // Download CSV
            downloadCsvFile(serialResults, filesToDownload[i]);

            cmd = "dl ";
        }
    }

};

// Turn list of file (files) into rows in an HTML table
function createFileList(files) {
    let table = document.getElementById('fileList');
    let tableHead = document.getElementById('fileListHead');
    let tableBody = document.getElementById('fileListBody');

    for (i in files) {
        let filenameArray = files[i].split('_');

        let year = '20' + filenameArray[0].substr(0, 2);
        let month = filenameArray[0].substr(2, 2).replace(/^0+/, '');
        let day = filenameArray[0].substr(4, 2).replace(/^0+/, '')

        let date = month + '/' + day + '/' + year;

        let time = filenameArray[1].substr(0, 2) + ':' + filenameArray[1].substr(2, 2) + ':' + filenameArray[1].substr(4, 2);

        let type = filenameArray[2][0].toUpperCase() + filenameArray[2].substr(1);

        // Insert row at the end of the table
        let row = tableBody.insertRow(-1);

        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);
        let cell4 = row.insertCell(3);

        let checkbox = document.createElement("INPUT");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("name", files[i]);

        cell1.appendChild(checkbox);
        cell2.innerHTML = time;
        cell3.innerHTML = date;
        cell4.innerHTML = type;
    }

    // Make table visible
    table.style.visibility = 'visible';
    tableHead.style.visibility = 'visible';
    tableBody.style.visibility = 'visible';
}
