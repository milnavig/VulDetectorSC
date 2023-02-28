const fs = require('fs');
const clean_fragment = require('./clean_fragment');
const parse_oyente_results = require('./parse_oyente_results');

async function generate_dataset() {
    parse_oyente_results();

    let counter = 0;
    const reentrancy_folder = __dirname + '/output/reentrancy';
    const unvulnerable_folder = __dirname + '/output/unvulnerable';
    let writeStream = fs.createWriteStream(__dirname + '/output/dataset.txt');

    const reentrancy_files = await fs.promises.readdir(reentrancy_folder);

    for (let file of reentrancy_files) {
        let contract = await fs.promises.readFile(`${reentrancy_folder}/${file}`);
        contract = clean_fragment(contract.toString());
        writeStream.write(`${++counter} ${file}\n`);
        writeStream.write(contract + '\n');
        writeStream.write('1\n');
        writeStream.write('---------------------------------\n');
    }

    const unvulnerable_files = await fs.promises.readdir(unvulnerable_folder);

    for (let file of unvulnerable_files) {
        let contract = await fs.promises.readFile(`${unvulnerable_folder}/${file}`);
        contract = clean_fragment(contract.toString());
        writeStream.write(`${++counter} ${file}\n`);
        writeStream.write(contract + '\n');
        writeStream.write('0\n');
        writeStream.write('---------------------------------\n');
    }

    writeStream.end();

    writeStream.on('finish', () => {
        console.log('The dataset.txt file was created');
    });
}

generate_dataset();