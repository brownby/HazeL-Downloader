# Motivation for HazeL Data Downloader
The most consistent pain point for students when using HazeL is getting data off of their device. Every time a user begins a round of data collection HazeL creates two timestamped files, one for data and one for metadata. These files are stored on an SD card that is embedded inside of the device and difficult to access. The solution for the past two years has been [scripts](https://github.com/brownby/HazeL/tree/hazel-3.0/scripts) that students download and run on their machines. While these technically work, they produce a multitude of headaches, most notably:

1. They are not cross platform. Students with a Windows machine run a PowerShell script, and students with a Mac or Linux machine run a Bash script.
2. Windows permissions issues. Windows machines often disable running PowerShell scripts by default, and sometimes make it hard to download them to begin with.
3. On Mac, students have to navigate a terminal, often for the first time, and use unfamiliar commands like `chmod`.
4. On both platforms, finding serial ports automatically can be an issue. If a student's machine has multiple available serial ports, there is not an easy way to detect which one is their HazeL, and the scripts will produce errors that can only be resolved by the students manually editing them.

For months now, since I discovered the [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API), I've had the idea to create a webpage that will handle this process. No more downloading anything, no more annoying scripts, I just point students to an easy to use website that will talk to their HazeL and grab the data from it. Now it exists!

# Firmware Update - Serial Commands

Before building the website, I had to update the HazeL firmware to accept serial commands. The most up-to-date firmare can be found on the [hazel-3.0 branch](https://github.com/brownby/HazeL/tree/hazel-3.0) of the HazeL Github repo. See [here](https://github.com/brownby/HazeL/compare/main...hazel-3.0) for the full list of commits made since branching from `main`.

HazeL uses the [SdFat library](https://github.com/greiman/SdFat) for all SD card operations.

The following commands were added:

## `ls` - list all files on the SD card

This command was relatively simple to create, as the underlying logic was already in the 2.0 version of the firmware, used to display all the files on the SD card on HazeL's OLED display. I moved the bulk of the logic to its own function, [`getFileList()`](https://github.com/brownby/HazeL/blob/1d3043199f3526f380d992ef00673f9486618fba/src/HazeL.ino#L1859). This function first opens the root directory of the SD card, then counts the number of files on the SD card by opening them one-by-one. It then creates an array of file names, and puts all the files names in there (removing extensions).

The array of files is sorted (using `stdlib`'s `qsort` and a helper function [`cmpstr()`](https://github.com/brownby/HazeL/blob/1d3043199f3526f380d992ef00673f9486618fba/src/HazeL.ino#L1851)) in reverse alphabetical order. Because file names in HazeL always start with the timestamp at which they were created, sorting in reverse alphabetical order is the same as sorting in reverse chronological order. Having newer files at the top is useful for users, as you typically want access to your most recent data.

Finally, `getFileList()` copies the list of files created into a global pointer `fileList`, dynamically allocating the correct amount of memory. Because `getFileList()` can be called in multiple places in the firmware, I also introduced a flag `fileListAlloc`, to avoid memory leaks. I do not call `getFileList()` if `fileList` is already allocated, as I may inadvertently reset `fileList` to point to a new place in memory (e.g. if the `ls` command is received while the `Upload data` menu is open).

HazeL then loops over the array of file names and sends them one by one over serial, ending in an `EOT` character. More on that last detail below.

## `dl <filename1> <filename2> ...` - download all files in list to computer

When the `dl` command is received, HazeL first [parses the command](https://github.com/brownby/HazeL/blob/1d3043199f3526f380d992ef00673f9486618fba/src/HazeL.ino#L262) to generate an array `filesToDownload`.

Once this array is created, HazeL loops through it and uploads each file using the [uploadSerial()](https://github.com/brownby/HazeL/blob/1d3043199f3526f380d992ef00673f9486618fba/src/HazeL.ino#L905) function. This function was already written for previous versions of HazeL, and basically loops through a file and copies into the serial port, 512 bytes at a time (the maximum that can be read at once).

I needed a way to indicate the receiveing side (i.e. the Data Downloader):

1. The end of an individual file, and
2. The end of the entire transmission of multiple files.

I chose to use the control characters `ETX` (or End-of-TeXt, ASCII `0x03`) for the end of an individual file, and `EOT` (or End-Of-Transmission, ASCII `0x04`) for the end of the transmission. With these in place, the Data Downloader would know what characters to look for as dilineators when parsing incoming serial data.

# Functionality of website

## HTML + CSS

The layout of the website is one large [Bootstrap](https://getbootstrap.com/) container, with a top row for the webpage title, and a link to the HazeL Github repo (if someone somehow ends up at this site without knowing what HazeL is). Two simple buttons, `Connect` and `Download` are on the second row, along with a picture of my cat Hazel (HazeL the sensor's namesake) with a speech bubble giving directions to the user. I wanted the website to be as self-contained as possible, so I chose to include directions for the two main steps (`Connect` and `Download`) on the page itself, as opposed to just pointing the students to this page later with external directions.

There is a third row in the container, which holds the `fileList` table, which is invisible by default. It is made visible once the user's HazeL is connected, and successfully sends a list of files after receiving the `ls` command.

Since the Web Serial API is not available on mobile, this site was not designed with mobile platforms in mind.

Very little custom CSS was used in this project, but it can be found in [style.css](css/style.css).

## Javascript

### `serial.js`

The file `serial.js` contains the functions for connecting, reading, and writing to the serial port. This code is based (at this point quite loosely, as I've made significant changes) on [this code](https://github.com/Autodrop3d/serialTerminal.com).
<br></br>
`connectSerial()` - opens the serial port selector pop-up, attempting to open the selected port with a baud rate of 9600 (this number could be anything as the microcontroller on HazeL talks over native USB).If the port is successfully opened, a text encoder stream and text decoder stream are created for writing and reading to the port, respectively. The global objects `writer` and `reader` are set at this point, to be used later in other serial functions.

If there is an error opening a serial port, the resulting exception is thrown by `connectSerial`, to be caught and interpreted in `main.js`.
<br></br>
`listenToPort(endCharacter)` - listens to the `reader` for the open port until `endCharacter` is detected, or until the read times out. If any other error occurs, an alert is raised to the user.

A timeout can occur if:

1. No data is received on the serial port for 5 seconds
2. A stream of data is received for 5 seconds and an `EOT` character does not occur.

The former case is implemented using the helper function `fulfillWithTimeLimit()`, described below. The latter case is implemented by saving the time at which the `while` loop for reading the port is started, and continually checking if 5 seconds has passed.

Text from successful serial reads is continually appended to the `serialResults` string, and when `endCharacter` is received, this string is returned.
<br></br>
`sendSerialLine(dataToSend)` - short and simple, uses the `writer` object to send `dataToSend` over the serial port, with a newline character appended. HazeL uses the newline character to determine the end of a command.
<br></br>
`fulfillWithTimeLimit(timeLimit, task, failureValue)` - this is a handy helper function, borrowed from [here](https://medium.com/swlh/set-a-time-limit-on-async-actions-in-javascript-567d7ca018c2), for setting a maximum amount of time for an `async` function to run. Originally, I was just `await`'ing the `reader.read()` method, but this just made the script hang on this line if the serial port wasn't sending any data. `fulfillWithTimeLimit` works by creating an artifical timeout promise, that will finish in `timeLimit` milliseconds. It then uses [`Promise.race()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race) to race the promise returned by `task` (in this case `reader.read()`) and this timeout promise. `Promise.race()` will resolve as soon as the first promise resolves, and if the timeout promise resolves first, this function returns `failureValue`. In my case, I just return `false` if the timeout finishes first, which allows me to check if the `data` variable in `listenToPort()` is `false` or not to determine if a timeout occurred.
<br></br>
<br></br>
### `csv.js`

A simple file containing just one helper function for having the browser download the data into a `.csv`. It works by concatenating all the data for the file onto the end of a string with the header information `data:text/csv;charset=utf-8`. I did not need to bother with generating column headers or anything, as HazeL does this when creating the files on the SD card. Once all the data is concatenated, a URI is created using Javascript's builtin [`encodeURI()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI) function. This URI is set as the `href` for an hidden anchor tag (created in `index.html`). The `download` attribute is set to the file name, so that it will have the correct file name when downloaded by the browser. Finally, the hidden element is clicked using the `click()` method, initiating the download.
<br></br>
<br></br>
### `main.js`

This is the main Javascript file for the project. The majority of the file is defining the `onclick` functions for the `Connect` and `Download` button, which utilize the helper functions from `serial.js` and `csv.js`. These functions also carry out some simple DOM manipulation to introduce some interactive features for the site, most notably the Hazel picture on the right changing, along with the text in the speech bubble, to convey instructions and error messages to the user.

Despite the fact that the HazeL will accept multiple files from the `dl` command, I ended up choosing to send individual `dl` commands for each file, as it was a little cleaner in the Javascript (in my opinion). Even though constructing the command would be straightforward, my current approach still only requires looping through the table of files once, and avoids having to parse a large string into multiple files.
<br></br>
`createFileList(files)` - this is the most significant DOM manipulation in the project, as an entire table is generated dynamically based on the list of files passed in as `files`. The table in `index.html` is just an empty `<tbody>` tag. This function loops through the `files` array and adds rows for each file, parsing each filename to convert from HazeL's naming convention of `YYMMDD_HHMMSS_<type>.txt`, where `type` is `meta` for metadata or `data` for data, into a more readable table. When adding the checkboxes in the first column of each row, it sets the `name` attribute of each checkbox to the original HazeL-style file name, which makes sending the appropriate `dl` commands in the `Download` button `onclick` function very simple.

Each row is also given an `onclick` function as its created, which checks and unchecks the checkbox in the first column. This makes it much easier to use the table, as you can click anywhere on the row to select or deselect a file, as opposed to having to click directly in the checkbox.
<br></br>
`hazelError(message)` - this is my cute replacement for `alert()`. Instead of an unfriendly pop-up, when an error occurs, a particularly angry picture of Hazel the cat appears, with the contents of the speech bubble changing to `message`. **Note:** `alert()` is still used in some, less common cases, to differentiate from common errors that I expect to crop up and unusual errors.

# References

Very helpful for figuring out how to use the Web Serial API - https://github.com/Autodrop3d/serialTerminal.com

Very helpful for figuring out how to download a CSV form the browser in Javascript - https://www.javatpoint.com/javascript-create-and-download-csv-file

Nifty CSS generator for speech bubbles - https://projects.verou.me/bubbly/

Excellent trick for setting time limits of `async` functions - https://medium.com/swlh/set-a-time-limit-on-async-actions-in-javascript-567d7ca018c2

