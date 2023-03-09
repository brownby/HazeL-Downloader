var port, writer, reader;

async function connectSerial() {
    try {
        // Prompt user to select any serial port.
        port = await navigator.serial.requestPort();
        await port.open({baudRate: 9600});

        let settings = {dataTerminalReady: true, requestToSend: true};
        await port.setSignals(settings);

        let textEncoder = new TextEncoderStream();
        let writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
        writer = textEncoder.writable.getWriter();

        let textDecoder = new TextDecoderStream();
        let readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();
    } catch (e){
        // Throw exception up to main.js to display error appropriately
        throw e;
    }
}

// Listen to data incoming on serial port, until endCharacter appears
async function listenToPort(endCharacter, timeout) {

    let serialResults = "";

    let start_time = Date.now();

    while (serialResults[serialResults.length - 1] != endCharacter) {
        if (Date.now() - start_time > timeout) {
            // Read timed out
            return false;
        }

        try {
            // Attempt to read data from serial port, with 5 second time out
            let data = await fulfillWithTimeLimit(timeout, reader.read(), false);
            if (!data) {
                // Read timed out
                return false;
            }

            // If read didn't timeout, read the data and append to results string
            const { value, done } = data;
            serialResults += value;
            // console.log(serialResults);
        }
        catch (e) {
            alert("Serial Read Failed: " + e.message);
        }
    }

    // Once endCharacter found, return results string
    return serialResults;
}

async function sendSerialLine(dataToSend) {
    dataToSend += '\n';

    try {
        await writer.write(dataToSend)
    }
    catch (e) {
        alert("Serial Write Failed: " + e.message);
    }
}

// Source: https://medium.com/swlh/set-a-time-limit-on-async-actions-in-javascript-567d7ca018c2
// Using this function to timeout my serial reads for error checking
async function fulfillWithTimeLimit(timeLimit, task, failureValue){
    let timeout;
    const timeoutPromise = new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
            resolve(failureValue);
        }, timeLimit);
    });
    const response = await Promise.race([task, timeoutPromise]);
    if(timeout){ //the code works without this but let's be safe and clean up the timeout
        clearTimeout(timeout);
    }
    return response;
}