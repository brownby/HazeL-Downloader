// Main script for Hazel Data Downloader - see README.md and DESIGN.md for details

document.getElementById('connect').onclick = async function() {
    // Connect serial port
    try {
        await connectSerial();
    }
    catch (e) {
        if (e.message == "No port selected by the user.") {
            // Error gets thrown when user cancels, just let this be so user can close pop-up without issue
        }
        else if (e.message == "Failed to open serial port.") {
            hazelError("ERROR: Serial port failed to open. It may be open in other software (such as the Arduino IDE), or you may have selected the wrong port. Refresh and try again, or try unplugging your HazeL and plugging it back in.");
        }
        else {
            hazelError("Serial Connection Failed: " + e.message);
        }
        // Regardless of message, stop execution
        return;
    }

    // Send command to get list of files
    await sendSerialLine('ls');

    // Begin listening to port, wait for EOT character
    let serialResults = await listenToPort('\x04');

    if (!serialResults) {
        // Serial read timed out, likely because user accidentally connected to a device that is not a HazeL, so it didn't respond to commands
        hazelError("Serial read timed out, try refreshing and make sure to select the correct serial port!");
        return;
    }
    else if (serialResults.length == 0) {
        hazelError("No files found! Double check your SD card or try refreshing the page");
        return;
    }

    // Disable connect button and enable download button
    this.disabled = true;
    document.getElementById('download').disabled = false;

    // Remove EOT character and final newline
    serialResults = serialResults.slice(0, -2);

    // Create list of files
    let fileList = serialResults.split('\n');

    // Populate table
    createFileList(fileList);

    // Change Hazel image
    document.getElementById('hazelPic').src= "img/hazel2.jpg";

    // Remove error message if present
    if (document.getElementById('error') !== null) {
        document.getElementById('error').remove();
    }

    // Change instructions in speech bubble, and add message that connection was successful
    instructions = document.getElementById('instructions');
    msg = document.createElement('P');
    msg.innerHTML = "You're connected! Now:";
    instructions.prepend(msg);

    // The steps might have been removed by error messages, make sure to add them back
    step1 = document.getElementById('step1');
    if (step1 === null) {
        step1 = document.createElement('LI');
        step1.id = 'step1';
        step1.innerHTML = "Select all the files you would like to download";
        instructions.appendChild(step1);
    }
    else {
        step1.innerHTML = "Select all the files you would like to download";
    }

    step2 = document.getElementById('step2');
    if (step2 === null) {
        step2 = document.createElement('LI');
        step2.id = 'step2';
        step2.innerHTML = "Click the \"Download\" button";
        instructions.appendChild(step2);
    }
    else {
        step2.innerHTML = "Click the \"Download\" button";
    }

    document.getElementById('step3').remove();
};

document.getElementById('download').onclick = async function() {
    // Verify port is connected
    if (!port) {
        hazelError("Connect to a serial port before attempting to download!");
    }

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

    if (filesToDownload.length > 0) {
        let cmd = "dl ";

        // Loop through filesToDownload and download each
        for (let i = 0; i < filesToDownload.length; i++) {
            cmd += filesToDownload[i];

            // Send command to download current file
            await sendSerialLine(cmd);

            // Listen to port until EOT char
            let serialResults = await listenToPort('\x04');

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
    // Don't create table if there are no files
    if (files.length == 0) {
        return;
    }

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

// Show Hazel error pic, with error message in speech bubble
function hazelError(message) {
    // Change to error pic
    document.getElementById('hazelPic').src= "img/hazel3.jpg";

    // Remove all HTML in speech bubble
    instructions = document.getElementById('instructions');
    instructions.replaceChildren();

    // Add message
    msg = document.createElement('P');
    msg.innerHTML = message;
    msg.id = 'error';
    instructions.appendChild(msg);
}