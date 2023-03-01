const fs = require('fs');
const clean_fragment = require('./../helpers/clean_fragment');
const parse_oyente_results = require('./parse_oyente_results');

async function generate_dataset(vul_size, unvul_size) {
    parse_oyente_results();

    let counter = 0;
    const reentrancy_folder = __dirname + '/output/reentrancy';
    const unvulnerable_folder = __dirname + '/output/unvulnerable';
    let writeStream = fs.createWriteStream(__dirname + '/output/dataset.txt');

    let reentrancy_files = await fs.promises.readdir(reentrancy_folder);

    (reentrancy_files.length > vul_size) ? reentrancy_files = reentrancy_files.slice(0, vul_size) : null;

    for (let file of reentrancy_files) {
        let contract = await fs.promises.readFile(`${reentrancy_folder}/${file}`);
        contract = clean_fragment(contract.toString());
        writeStream.write(`${++counter} ${file}\n`);
        writeStream.write(contract + '\n');
        writeStream.write('1\n');
        writeStream.write('---------------------------------\n');
    }

    let unvulnerable_files = await fs.promises.readdir(unvulnerable_folder);

    (unvulnerable_files.length > unvul_size) ? unvulnerable_files = unvulnerable_files.slice(0, unvul_size) : null;

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

generate_dataset(25, 25);