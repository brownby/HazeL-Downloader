var port, textEncoder, writableStreamClosed, writer;
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

        return true;
    } catch (e){
        alert("Serial Connection Failed" + e);
    }
}

// async function listenToPort(serialResults) {
async function listenToPort(endCharacter) {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    let done = false;

    while (true) {
        if (serialResults[serialResults.length - 1] == endCharacter) {
            // Allow the serial port to be closed later.
            console.log('[readLoop] DONE');
            reader.releaseLock();
            connected = false;
            break;
        }

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