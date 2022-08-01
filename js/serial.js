var port
var textEncoder, writableStreamClosed, writer;
var textDecoder, readableStreamClosed, reader;
var connected = false;
var serialResults = "";

async function connectSerial() {
    try {
        // Prompt user to select any serial port.
        port = await navigator.serial.requestPort();
        await port.open({baudRate: 9600});

        let settings = {dataTerminalReady: true, requestToSend: true};
        await port.setSignals(settings);

        textEncoder = new TextEncoderStream();
        writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
        writer = textEncoder.writable.getWriter();

        textDecoder = new TextDecoderStream();
        readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();

        return true;
    } catch (e){
        alert("Serial Connection Failed" + e);
    }
}

// Listen to data incoming on serial port, until endCharacter appears
async function listenToPort(endCharacter) {
    // textDecoder = new TextDecoderStream();
    // readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    // reader = textDecoder.readable.getReader();
    serialResults = "";

    while (serialResults[serialResults.length - 1] != endCharacter) {
        const { value, done } = await reader.read();

        // value is a string.
        serialResults += value;
        // console.log(serialResults);
    }
    console.log(serialResults);
}

async function sendSerialLine(dataToSend) {
    dataToSend += '\n';
    await writer.write(dataToSend)
}