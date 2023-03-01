const path = require('path');
const fs = require('fs');
const parse_file = require('./helpers/parse_file');
const print_progress = require('./helpers/print_progress');
const clean_fragment = require('./helpers/clean_fragment');
const args = require('./helpers/parse_arguments');

const Vectorizer = require('./modules/Vectorizer');
const SimpleRNN = require('./models/SimpleRNN');
const LSTM = require('./models/LSTM');
const BLSTM = require('./models/BLSTM');
const SimpleRNNSingleOutput = require('./models/SimpleRNNSingleOutput');

let vectorizer; // instance of Vectorizer class

async function get_vectors_data(filename, vector_length=300) {
    const fragments = [];
    let count = 0;
    const dataset_name = path.basename(dataset_filename).split('.')[0];
    vectorizer = new Vectorizer(vector_length, dataset_name);

    for await (const { fragment, fragment_val } of parse_file(filename)) {
        count++;
        print_progress(`Collecting fragments... ${count}`);
        vectorizer.add_fragment(fragment);
        let row = {"fragment": fragment, "val": fragment_val};
        fragments.push(row);
    }
    console.log();
    console.log('Training model...');
    await vectorizer.train_model();

    return vectorizer.vectorize_fragments(fragments);
}

function check_contract(contract_filename, model) {
    if (fs.existsSync(`${__dirname}/samples/${contract_filename}`)) {
        let contract = fs.readFileSync(`${__dirname}/samples/${contract_filename}`);
        let fragment = clean_fragment(contract);
        let fragment_vector = vectorizer.vectorize(fragment);
        model.test_fragment(fragment_vector);
    }
}

const { 
    dataset: dataset_filename,
    contract: contract_filename,
    vector_dim, 
    batch_size, 
    lr, 
    epochs, 
    dropout, 
    threshold
} = args; // dataset - txt file with smart contracts

async function main() {
    let model;

    const base = path.basename(dataset_filename).split('.')[0];
    const vector_filename = base + "_vectorized.json";
    const vector_length = vector_dim;
    let vectors;

    if (fs.existsSync(`${__dirname}/data/${vector_filename}`)) {
        const data = fs.readFileSync(`${__dirname}/data/${vector_filename}`);
        vectors = JSON.parse(data);
    } else {
        vectors = await get_vectors_data(dataset_filename, vector_length);
        const vectors_json = JSON.stringify(vectors, (key, value) => {
            return ArrayBuffer.isView(value) ? Array.from(value) : value;
        });
        fs.open(`${__dirname}/data/${vector_filename}`, 'a', (err, fd) => {
            if (err) {
                console.log('Can`t open file');
            } else {
                fs.write(fd, vectors_json, (err, writtenbytes) => {
                    if (err) {
                        console.log('Can`t write to file');
                    }
                });
            }
        });
    }

    if (args.model === 'Simple_RNN') {
        model = new SimpleRNN(
            vectors, 
            args.model, 
            batch_size, 
            lr, 
            epochs, 
            dropout, 
            threshold
        );
    } else if (args.model === 'LSTM_Model') {
        model = new LSTM(
            vectors, 
            args.model, 
            batch_size, 
            lr, 
            epochs, 
            dropout, 
            threshold
        );
    } else if (args.model === 'BLSTM_Model') {
        model = new BLSTM(
            vectors, 
            args.model, 
            batch_size, 
            lr, 
            epochs, 
            dropout, 
            threshold
        );
    } else if (args.model === 'SimpleRNNSingleOutput_Model') {
        model = new SimpleRNNSingleOutput(
            vectors, 
            args.model, 
            batch_size, 
            lr, 
            epochs, 
            dropout, 
            threshold
        );
    }

    await model.create_model();
    await model.train();
    model.test();
    //model?.calculate_roc(); // draw ROC curve for the model
    
}

main();