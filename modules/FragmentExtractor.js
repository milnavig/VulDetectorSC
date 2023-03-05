const fs = require('fs');
const readline = require('readline');

class FragmentExtractor {
    constructor() {
        this.code_fragments = []; // code fragment
        this.callValueArray = []; // save function W, which use call.value
        this.CFunctionArray = []; // save all functions C, which call function W
        this.withdrawNameArray = []; // save the name of the function W, which call call.value
        this.otherFunctionArray = []; // save functions, which do not use call.value
        this.params = []; // save parameters of function W
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
            for (let func_line of func) {
                if (func_line.includes('.call.value')) {
                    this.callValueArray.push(func);

                    // get first line with parameters and find them
                    let func_parameters = func[0].match(/[(](.*?)[)]/g);
                    func_parameters = func_parameters[0].split(",");

                    for (let func_parameter of func_parameters) {
                        let temp = func_parameter.trim().split(' ');
                        this.params.push(temp[temp.length - 1]); // get name of the parameter
                    }

                    // check if function is callback-function (case `function() payable`)
                    let result_withdraw = func[0].match(/\b([_A-Za-z]\w*)\b(?:(?=\s*\w+\()|(?!\s*\w+))/)[1];

                    if (result_withdraw === 'payable') {
                        this.withdrawNameArray.push(result_withdraw);
                    } else {
                        this.withdrawNameArray.push(result_withdraw + '(');
                    }
                }
            }
        }

        for (let callValue of this.callValueArray) {
            this.code_fragments.push(callValue);
        }

        for (let withdraw of this.withdrawNameArray) {
            if (withdraw.includes('payable')) {
                console.log('There is no C function');
                continue;
            }
            for (let otherFunction of this.otherFunctionArray) {
                for (let line of otherFunction) {
                    let params = line.match(/[(](.*?)[)]/)[0].split(',');

                    if ((params[0] != "") && (params.length == this.params.length)) {
                        this.CFunctionArray.push(otherFunction);
                    }
                }
            }
        }

        for (let CFunction of this.CFunctionArray) {
            this.code_fragments.push(CFunction);
        }

        console.log('Code Fragments: ', this.code_fragments);
        console.log('==============================================================');

        return this.code_fragments;
    }
}

module.exports = FragmentExtractor;