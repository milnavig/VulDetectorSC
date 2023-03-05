const fs = require('fs');
const readline = require('readline');

async function* parse_file(filename) {
    let fragment = [];
    let fragment_val = 0;

    const fileStream = fs.createReadStream(filename);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        //console.log(`Line from file: ${line}`);

        const stripped_line = line.trim(); // remove spaces at the beginning and at the end of the string
        if (!stripped_line) { // if the line is empty
            continue;
        } else if (fragment.length && stripped_line.includes("-".repeat(33))) { // delimiter
            yield { fragment, fragment_val };
            fragment = [];
        } else if (Number.isInteger(Number(stripped_line.split()[0]))) {
            if (fragment.length) {
                if (Number.isInteger(Number(stripped_line))) {
                    fragment_val = Number(stripped_line);
                } else {
                    fragment.push(stripped_line);
                }
            }
        } else {
            fragment.push(stripped_line);
        }
    }
}

module.exports = parse_file;