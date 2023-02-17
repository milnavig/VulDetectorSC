const tf = require('@tensorflow/tfjs');
const path = require('path');
const parse_file = require('./helpers/parse_file');
const Vectorizer = require('./modules/Vectorizer');
const print_progress = require('./helpers/print_progress');

const args = require('./helpers/parse_arguments');


async function get_vectors_df(filename, vector_length=300) {
    const fragments = [];
    let count = 0;
    vectorizer = new Vectorizer(vector_length);

    for await (const { fragment, fragment_val } of parse_file(filename)) {
        count++;
        //console.log(fragment);
        print_progress(`Collecting fragments... ${count}`);
        vectorizer.add_fragment(fragment);
        let row = {"fragment": fragment, "val": fragment_val};
        fragments.push(row);
    }

    console.log('Training model...');
    vectorizer.train_model();
}


const { 
    dataset: dataset_filename,
    vector_dim
} = args; // dataset - txt file with smart contracts

async function main() {
    // for await (const data of parse_file(dataset)) {
    //     console.log(data.fragment_val);
    // }

    const base = path.basename(dataset_filename).split('.')[0];
    const vector_filename = base + "_fragment_vectors.pkl";
    const vector_length = vector_dim;

    get_vectors_df(dataset_filename);
}

main();