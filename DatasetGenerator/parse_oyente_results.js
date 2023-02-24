const fs = require('fs');
const path = require('path');

const resultsFolder = __dirname + '/input/oyente-results/'; // results of Oyente tool
const contractsFolder = __dirname + '/input/contracts/'; // contracts
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

function findReentrencyContracts(folders) {
    for (let folder of folders) {
        let buffer = bufferFile(resultsFolder + folder + file);
        let result = buffer.toString();
        // check if contact has reentrancy vulnerability
        if (result.includes('INFO:symExec:	  Re-Entrancy Vulnerability: 		 True')) {
            fs.copyFile(contractsFolder + folder + '.sol', reentrancyFolder + folder + '.sol', (err) => {
                console.log('File was not found!');
            }); // save contract to reentrency folder
        }
    }
}

function findUnvulnerableContracts(folders) {
    for (let folder of folders) {
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
            });
        }
    }
}

function parse_oyente_results() {
    let folders = getDirectories(resultsFolder);
    findReentrencyContracts(folders); // get all contracts with reentrancy bugs
    findUnvulnerableContracts(folders);
}

module.exports = parse_oyente_results;