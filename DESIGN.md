# Serial commands for HazeL to respond to
`ls` - list all files on the SD card

`dl <filename>` - download `filename` onto computer

`dl <filename1> <filename2> ...` - download all files in list, one by one

`rm <filename>` - delete file permanently from SD card

# Functionality of website
- Connect to serial port that HazeL is on
- After connecting, display a list of all files on the SD card
    * Display these as a table with checkboxes to pick which ones to download
    * Use timestamp in file names to display these more clearly
- Download files into a .csv from browser
    * Option to download multiple files separately or in a .zip

# References

https://github.com/Autodrop3d/serialTerminal.com