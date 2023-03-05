const fs = require('fs');
const readline = require('readline');

class FragmentExtractor {
    constructor() {
        this.code_fragments = []; // code fragment
        this.callValueArray = []; // save function W, which use call.value
        this.CFunctionArray = []; // save all functions C, which call function W
        this.functionNameArray = []; // save the name of the function W, which call call.value
        this.otherFunctionArray = []; // save functions, which do not use call.value
    }

    async split_function(filepath) {
        const function_array = [];
        let flag = -1;

        const fileStream = fs.createReadStream(filepath);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (let line of rl) {
            let text = line.trim();
            
            if ((text.length > 0) && (text !== '\n')) {
                if ((text.split(' ')[0] === 'function') || (text.split(' ')[0] == 'constructor')) {
                    function_array.push([text]);
                    flag += 1;
                } else if ((function_array.length > 0) 
                    && (function_array[flag][0].includes('function') || function_array[flag][0].includes('constructor'))) {
                    function_array[flag].push(text);
                }
            }
        }

        return function_array;
    }

    // search for call.value in functions
    async find_location(filepath) {
        const allFunctionArray = await this.split_function(filepath); // save all functions in array

        for (let func of allFunctionArray) {
            let flag = 0;
            for (let func_line of func) {
                if (func_line.includes('.call.value')) {
                    this.callValueArray.push(func);
                    // get function name
                    let function_name = func[0].match(/\b([_A-Za-z]\w*)\b(?:(?=\s*\w+\()|(?!\s*\w+))/g)[1];

                    this.functionNameArray.push(function_name);
                    flag++;
                }
            }

            if (flag === 0) this.otherFunctionArray.push(func);
        }

        // add functions with call.value to fragment
        for (let callValue of this.callValueArray) {
            this.code_fragments.push(callValue.join('\n'));
        }

        for (let functionName of this.functionNameArray) {
            if (functionName.includes('payable')) {
                console.log('There is no C function');
                continue;
            }

            for (let otherFunction of this.otherFunctionArray) {
                for (let line of otherFunction) {
                    if (line.includes(`${functionName}(`)) {
                        this.CFunctionArray.push(otherFunction);
                        break;
                    }
                }
            }
        }
        
        // add to fragments C function
        for (let CFunction of this.CFunctionArray) {
            this.code_fragments.push(CFunction.join('\n'));
        }

        console.log('Code Fragments: ', this.code_fragments.join('\n'));
        console.log('==============================================================');

        return this.code_fragments.join('\n');
    }
}

module.exports = FragmentExtractor;