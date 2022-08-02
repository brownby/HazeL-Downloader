// Variable to store list of files from HazeL
var fileList;

document.getElementById('connect').onclick = async function() {
    // Connect serial port
    console.log("Connecting serial port");
    let connected = await connectSerial();

    if (connected) {
        document.getElementById('download').disabled = false;
        this.disabled = true;
    }
    else {
        // Change HazeL image and add error message to speech bubble maybe?

        return;
    }

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

    // Change Hazel image
    document.getElementById('hazelPic').src= "img/hazel2.jpg";

    // Change directions, and add message that connection was successful
    directions = document.getElementById('directions');
    msg = document.createElement('P');
    msg.innerHTML = "You're connected! Now:";
    directions.prepend(msg);

    step1 = document.getElementById('step1');
    step1.innerHTML = "Select all the files you would like to download";

    step2 = document.getElementById('step2');
    step2.innerHTML = "Click the \"Download\" button";

    lineBreak = document.createElement('BR');
    directions.appendChild(lineBreak);

    msg = document.createElement('P');
    msg.innerHTML = "If the file list is empty (and you're sure you have files on your SD card), try refreshing and connecting again (leave your HazeL plugged in!)";
    directions.appendChild(msg);
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

// Select all will check and uncheck boxes
document.getElementById('selectAll').onclick = function() {
    let tableBody = document.getElementById('fileListBody');
    for (let i = 0, row; row = tableBody.rows[i]; i++) {
        if (this.checked) {
            row.cells[0].firstChild.checked = true;
        }
        else {
            row.cells[0].firstChild.checked = false;
        }
    }
}

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

        let type = filenameArray[2];
        if (type == 'data') {
            type = 'Data';
        }
        else {
            type = 'Metadata';
        }

        // Insert row at the end of the table
        let row = tableBody.insertRow(-1);

        let checkbox = document.createElement("INPUT");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("name", files[i]);

        let checkboxTh = document.createElement("TH");
        checkboxTh.setAttribute("scope", "row");
        checkboxTh.setAttribute("class", "thCheckbox");
        checkboxTh.appendChild(checkbox);

        // cell1.appendChild(checkboxTh);
        row.appendChild(checkboxTh);

        // let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);
        let cell4 = row.insertCell(3);

        // Make entirely row clickable to change checkbox
        row.onclick = function() {
            checkbox.checked = !checkbox.checked;
        };

        cell2.innerHTML = time;
        cell3.innerHTML = date;
        cell4.innerHTML = type;
    }

    // Make table visible
    table.style.visibility = 'visible';
    tableHead.style.visibility = 'visible';
    tableBody.style.visibility = 'visible';
}
