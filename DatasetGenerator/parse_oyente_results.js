const fs = require('fs');
const path = require('path');

const resultsFolder = __dirname + '/input/oyente-results/'; // results of Oyente tool
//const resultsFolder = 'C:/Users/alexa/Desktop/dissertation/OyenteResultsParser/smartbugs-wild-results/';
const contractsFolder = __dirname + '/input/contracts/'; // contracts
//const contractsFolder = 'C:/Users/alexa/Desktop/dissertation/OyenteResultsParser/smartbugs-wild/';
const reentrancyFolder = __dirname + '/output/reentrancy/'; // list of vulnerable smart-contracts
const unvulnerableFolder = __dirname + '/output/unvulnerable/'; // list of unvulnerable smart-contracts
const file = '/result.log'; // the file where Oyente results are stored

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

function bufferFile(relPath) {
    return fs.readFileSync(path.resolve(__dirname, relPath));
}

function findReentrencyContracts(folders, num = 100) {
    let counter = num;
    for (let folder of folders) {
        if (counter == 0) {
            break;
        }
        let buffer = bufferFile(resultsFolder + folder + file);
        let result = buffer.toString();
        // check if contact has reentrancy vulnerability
        if (result.includes('INFO:symExec:	  Re-Entrancy Vulnerability: 		 True')) {
            fs.copyFile(contractsFolder + folder + '.sol', reentrancyFolder + folder + '.sol', (err) => {
                console.log('File was not found!');
                counter++;
            }); // save contract to reentrency folder
        }
        counter--;
    }
}

function findUnvulnerableContracts(folders, num = 100) {
    let counter = num;
    for (let folder of folders) {
        if (counter == 0) {
            break;
        }
        let buffer = bufferFile(resultsFolder + folder + file);
        let result = buffer.toString();
        if (!result.includes('INFO:symExec:	  Re-Entrancy Vulnerability: 		 True')
            && !result.includes('INFO:symExec:	  Integer Underflow: 			 True')
            && !result.includes('INFO:symExec:	  Integer Overflow: 			 True')
            && !result.includes('INFO:symExec:	  Parity Multisig Bug 2: 		 True')
            && !result.includes('INFO:symExec:	  Callstack Depth Attack Vulnerability:  True')
            && !result.includes('INFO:symExec:	  Transaction-Ordering Dependence (TOD): True')
            && !result.includes('INFO:symExec:	  Timestamp Dependency: 		 True')) {
            
            // save to unvulnerable folder
            fs.copyFile(contractsFolder + folder + '.sol', unvulnerableFolder + folder + '.sol', (err) => {
                console.log('File was not found!');
                counter++;
            });
        }
        counter--;
    }
}

function parse_oyente_results() {
    let folders = getDirectories(resultsFolder);
    findReentrencyContracts(folders); // get all contracts with reentrancy bugs
    findUnvulnerableContracts(folders);
}

module.exports = parse_oyente_results;