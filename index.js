const path = require('path');
const parse_file = require('./helpers/parse_file');
const print_progress = require('./helpers/print_progress');
const args = require('./helpers/parse_arguments');

const Vectorizer = require('./modules/Vectorizer');
const SimpleRNN = require('./models/SimpleRNN');
const LSTM = require('./models/LSTM');
const BLSTM = require('./models/BLSTM');
const SimpleRNNSingleOutput = require('./models/SimpleRNNSingleOutput');

async function get_vectors_data(filename, vector_length=300) {
    const fragments = [];
    let count = 0;
    vectorizer = new Vectorizer(vector_length);

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


const { 
    dataset: dataset_filename,
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
    const vector_filename = base + "_fragment_vectors.pkl";
    const vector_length = vector_dim;

    const vectors = await get_vectors_data(dataset_filename, vector_length);

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