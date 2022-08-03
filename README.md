# HazeL Data Downloader - [hazeldownload.com](https://hazeldownload.com/)

The HazeL Data Downloader is a software tool to accompany the [HazeL](https://github.com/brownby/HazeL/tree/hazel-3.0) particulate matter sensor.

## Brief Background on HazeL

I designed HazeL in the Spring of 2021 to serve as an educational tool for ESE6, Harvard's introductory environmental engineering course. In previous years, students performed field experiments using expensive particulate matter sensors (>$2000 each) that they borrowed from the lab. With students remote, this was no longer an option, so we had to get creative. I, along with a few coworkers, designed and assembled ~30 HazeLs (at around $100 apiece) and shipped them across the world. The instructors for the course found it so useful that they continued to use HazeL when students were back on campus, and plan to continue using it for the foreseeable future.

For more technical details on HazeL, check out the [HazeL Github repo](https://github.com/brownby/HazeL/tree/hazel-3.0).

# Using the Data Downloader

**The Data Downloader will only work on browsers that are compatible with the [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API).** At the time of writing this README, this includes:

- Google Chrome &ge;89
- Microsoft Edge &ge;89
- Opera &ge;75

Hopefully more browsers will be compatible in the future, but for now it's just those three :)

You will also need a HazeL with the latest firmware installed (which can be found [here](https://github.com/brownby/HazeL/tree/hazel-3.0)). This new firmware adds the ability for HazeL to respond to simple commands over serial, which is what enables the Data Downloader to operate.

All pre-requisites aside, let's get into how to use the tool. Navigate to [hazeldownload.com](https://hazeldownload.com/) and follow the steps below (or the steps that Hazel the cat shouts at you on the website).

## Step 1 - Connect your HazeL

First and foremost, plug your HazeL into your machine via a USB Type-A to USB Micro-B cable. The HazeL will run through its normal initialization, wait until it reaches the main menu to continue.

Click the blue `Connect` button. This will open a pop-up, informing you that hazeldownload.com would like to connect to a serial port, and listing the available ports. The exact port number will change: on Windows it will be `COMx`, where `x` is some number; on Mac, it will likely be under `/dev/tty.usbmodemx` or `/dev/tty.usbserialx`. Regardless of the port number, the port name will likely have `Arduino MKR WiFi 1010` in it, as this is the microcontroller board that the HazeL uses.

Once you have found the correct port, select it and click the `Connect` button in the pop-up.

## Step 2 - Select your files

If you've successfully connected to your HazeL, a table should appear on the page entitled **File List**. This table lists all the files on the HazeL's SD card.

The convention that HazeL uses for naming files is to name them with a UTC timestamp, separating date and time by underscores, followed by `_data` or `_meta`, e.g. `221301_180857_data.txt`. This table displays these timestamps in a little more of a human readable format. The most recent files are listed at the top, as these are often the ones that users want to download.

To select or deselect a file, click anywhere on the row or in the checkbox in the first column. You can select all the files by clicking `Select All`.

## Step 3 - Download!

Once you've selected all the files you want, click the `Download` button, and they will be downloaded as `.csv`'s one-by-one by your browser.

### Important notes!

**You may need to give the webpage permission to download multiple files**.

Depending on the size of the files, there may be a slight delay before the file is downloaded (serial ports are slow!). As long as the display on your HazeL reads:

```
Uploading
<file_name>
via serial port
```
Then the data is being downloaded!

# Errors

If at any point you see the following face:

<img src="img/hazel3.jpg" style="width: 200px; height: 200px; object-fit: cover;">

It means you've encountered an error of some kind.

The most common errors (and solutions) are:

### `Serial port failed to open`

This error may occur for a number of reasons. Most commonly, it means that the serial port for your HazeL is already open by another program. This could be the Arduino IDE, or even another tab where you already opened the Downloader and connected. The easiest way to close the port is to unplug your HazeL and plug it back in.

It may also occur if you are trying to connect to the wrong port - make sure that the port you are connecting to actually corresponds to your HazeL.

### `Serial read timed out`

This error will usually occur after you've successfully connected to a port, but before you see the list of files. It likely means that the wrong port was selected. When you connect to a port, the Downloader sends the `ls` command to your HazeL, and expects in return a list of files, followed by an [`EOT` character](https://en.wikipedia.org/wiki/End-of-Transmission_character). If instead, it receives no data, or a stream of data that does not end in an `EOT`, it will time out after 5 seconds. Usually this happens because the device you connected to doesn't care about `ls`

### `No files found!`

The error occurs if the Data Downloader received an empty list of files from your HazeL. You can verify that there are actually any files on your SD card by selecting `Upload data` in the HazeL main menu.

If a list of files pops up on the HazeL's display, try refreshing your page, and make sure to connect to the correct port.

If no files show up, that means your SD card is empty. Go collect some data!
