const readline = require('readline');

function generateCombinations(charset, length, callback,prefix = '') {
    if (length === 0) {
        callback(prefix)
    } else {
        for (let i = 0; i < charset.length; i++) {
            const newPrefix = prefix + charset[i];
            generateCombinations(charset, length - 1,callback, newPrefix);
        }
    }
}

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

const keypressHandler = () => {}; // Adding keypressHandler function definition to avoid undefined error

async function GenerateCombinationnsInRange(min , max,callback){
    const availableCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|:"<>?/~[]\';,./';
    for (let l = min; l <= max; l++) {
        generateCombinations(availableCharacters, l,callback);
    }
}

async function Start(callback) {
    const minLength = parseInt(await questionAsync('Enter the minimum length: ')); // User input for minimum length
    const maxLength = parseInt(await questionAsync('Enter the maximum length: ')); // User input for maximum length

    await GenerateCombinationnsInRange(minLength,maxLength, callback)
}

function callback(string)
{
    console.log(`got: ${string}`)
}

Start(callback)