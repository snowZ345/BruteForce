const fs = require('fs');  // Import the File System module to perform file operations
const https = require('https');  // Import the HTTPS module to make HTTPS requests
const readline = require('readline');  // Import the ReadLine module to read user input
const { spawn, exec } = require('child_process'); // import the child_process to run multiple threads
const path = require('path'); //path manipulation

const torDownloadUrl = 'https://dist.torproject.org/torbrowser/13.0.14/tor-expert-bundle-windows-x86_64-13.0.14.tar.gz';  // URL to download the Tor expert bundle
const torZipFile = 'tor.zip';  // Name of the zip file containing the Tor expert bundle
const torExtractFolder = './tor';  // Directory to extract the Tor expert bundle to
var debugmode = "d"
var tor_prosses;

//TODO Upload code to github

/**
 * Check if the Tor expert bundle is already installed
 * @returns {boolean} True if the Tor expert bundle is installed, false otherwise
 */
function checkTorInstalled() {
    return fs.existsSync(torExtractFolder);
}

/**
 * Download the Tor expert bundle from the Tor project website
 * @returns {Promise} A promise that resolves when the download is complete
 */
function DownloadTor() {
    console.log(`Downloading TOR from ${torDownloadUrl}...`);

    const file = fs.createWriteStream(path.join(torExtractFolder,torZipFile));

    return new Promise((resolve, reject) => {
        https.get(torDownloadUrl, (response) => {
            response.pipe(file);
            file.on('finish', function() {
                file.close();
                console.log('File downloaded successfully.');
                ExtractTor().then(resolve).catch(reject);
            });
        }).on('error', function(err) {
            fs.unlink(destinationPath); // Delete the file if error occurs
            console.error('Error downloading file:', err);
            reject(err);
        });
    });
}

/**
 * Extract the Tor expert bundle from the zip file
 * @returns {Promise} A promise that resolves when the extraction is complete
 */
async function ExtractTor() {
    console.log(`Extracting ${torZipFile}`);

    const decompress = require("decompress");
    return decompress(path.join(torExtractFolder,torZipFile), "tor")
        .then(() => {
            RemoveTorZip();
        })
        .catch((error) => {
            console.log(error);
            throw error;
        });
}

/**
 * Remove the zip file after extraction
 */
function RemoveTorZip() {
    console.log("Removing zip")
    fs.unlink(path.join(torExtractFolder,torZipFile), (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return;
        }
        console.log('File deleted successfully');
    });
}

/**
 * Install the Tor expert bundle if it's not already installed
 */
async function installTor() {
    try {
        if (!checkTorInstalled()) {
            await new Promise((resolve, reject) => {
                fs.mkdir(torExtractFolder, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        DownloadTor().then(resolve).catch(reject);
                    }
                });
            });
        } else {
            console.log('Tor Expert Bundle is already installed.');
        }
    } catch (error) {
        console.error('Error installing Tor Expert Bundle:', error);
    }
}

/**
 * Ask the user something
 * @returns {Promise<string>} A promise that resolves with the user's input
 */
function questionAsync(query) {
    if (!questionAsync.rl) {
        questionAsync.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    process.stdin.removeListener('keypress', keypressHandler);

    return new Promise((resolve) => {
        questionAsync.rl.question(query, (answer) => {
            process.stdin.on('keypress', keypressHandler);
            resolve(answer);
        });
    });
}

/**
 * await for subprosses message
 */
function waitForMessages(Prosses, messages) {
    return new Promise((resolve, reject) => {
        const outputs = {};

        // Listen for data on stdout
        Prosses.stdout.on('data', (data) => {
            const output = data.toString();
            if (debugmode == "d") {
                console.log(`[DEBUG] ${output}`);
            }
            messages.forEach(message => {
                if (output.includes(message)) {
                    if (!outputs[message]) {
                        outputs[message] = output;
                        resolve(outputs);
                    }
                }
            });
        });

        // Listen for data on stderr
        Prosses.stderr.on('data', (data) => {
            console.error(`subprosses error: ${data}`);
            reject(data.toString());
        });
    });
}


/**
 * closes a subprosses
 */
async function closeSubprocess(Prosses) {
    if (Prosses != null && Prosses.pid) {
        console.log('Closing subprocess...');
        Prosses.kill('SIGTERM'); // Send termination signal to the subprocess

        // Await for the subprocess to close
        await new Promise((resolve) => {
          Prosses.on('close', () => {
            console.log('Subprocess has closed');
            resolve();
          });
        });
    }
}

/**
 * Start the program
 */
async function StartProgram() {
    console.log("Starting Program...");

    console.log("opening tor")
    const torPath = path.join(__dirname, 'tor','tor', 'tor.exe');
    const tor_prosses = spawn(torPath,[],{detached: true});      
    tor_prosses.unref();
    const result = await waitForMessages(tor_prosses, ["Bootstrapped 100%", "Is Tor already running?"]);
    if (result["Bootstrapped 100%"]) {
        console.log("Tor Connected on 9050")
    }else
    {
        console.log("Tor is already running.");
    }
    
      
    var url = await questionAsync("Enter Target Url: ");
    const UserName = await questionAsync("Enter User Name: ");
    const UserNameSelector = await questionAsync("Enter User Name Selector: ");
    const PassSelector = await questionAsync("Enter User Name Selector: ");

    const puppeteer = require('puppeteer');
    const data = {"url":url,"UserName":UserName,"UserNameSelector":UserNameSelector,"PassSelector":PassSelector}
    //TODO Make it use the aloni password Generator
    //TODO break the data to chanks of x retries
    //TODO limit it to x workers
    TryPassword("Pass",puppeteer,data)

}

async function TryPassword(Password, puppeteer,data)
{
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox','--proxy-server=socks5://127.0.0.1:9050',],
        headless: false,
        defaultViewport: null,
      });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36');

    await page.goto(data["url"]);

    //TODO Finish the Try Passowrd
}

/** 
 * Function to create a new thread that listens for esc then clopses the program
 * */ 
function CloseOnEscape() {
    console.log("Press esc to close the program...")
    // Enable listening for keypress events on stdin
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    // Attach the keypress event listener
    process.stdin.on('keypress', keypressHandler);
}

async function closeTorProcess() {
    try {
        await exec('start cmd /c taskkill /f /im tor.exe');
    } catch (error) {
      console.error(`Error executing the command: ${error}`);
    }
  }
  

/**
 * on key pressed
 * @param {*} chunk 
 * @param {*} key 
 */
async function keypressHandler(chunk, key) {
    if (key && key.name === 'escape') {
        console.log('\nExiting program...');
        console.log("closing tor")
        await closeSubprocess(tor_prosses)
        await closeTorProcess().then(() => console.log("Tor process closed"))
        process.exit();
      }
}

/**
 * Run the program
 */
async function run() {
    CloseOnEscape();
    debugmode = await questionAsync("Enter debug mode, \nd = debug\nn = normal\nm = minimal\nanswer: ")
    await installTor();
    await StartProgram();
}

run();