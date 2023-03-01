const w2v = require('word2vec');
const fs = require('fs');
const print_progress = require('./../helpers/print_progress');

// Sets for operators
const operators3 = ['<<=', '>>='];
const operators2 = [
    '->', '++', '--',
    '!~', '<<', '>>', '<=', '>=',
    '==', '!=', '&&', '||', '+=',
    '-=', '*=', '/=', '%=', '&=', '^=', '|='
];
const operators1 = [
    '(', ')', '[', ']', '.',
    '+', '-', '*', '&', '/',
    '%', '<', '>', '^', '|',
    '=', ',', '?', ':', ';',
    '{', '}'
];

// vectorize the fragments
class Vectorizer {
    constructor(vector_length, dataset_name) {
        this.fragments = [];
        this.vector_length = vector_length;
        this.dataset_name = dataset_name;
        this.forward_slices = 0;
        this.backward_slices = 0;
    }

    static tokenize_line(line) {
        let tokens = [], word = [];
   
        for (let i = 0; i < line.length;) {
            if (line[i] == ' ') { // Ignore spaces and combine previously collected chars to form words
                tokens.push(word.join(''));
                tokens.push(line[i]);
                word = [];
                i += 1;
            } else if (operators3.includes(line.slice(i, i + 3))) { // Check operators and append to final list
                tokens.push(word.join(''));
                tokens.push(line.slice(i, i + 3));
                word = [];
                i += 3;
            } else if (operators2.includes(line.slice(i, i + 2))) {
                tokens.push(word.join(''));
                tokens.push(line.slice(i, i + 2));
                word = [];
                i += 2;
            } else if (operators1.includes(line[i])) {
                tokens.push(word.join(''));
                tokens.push(line[i]);
                word = [];
                i += 1;
            } else { // Character appended to word list
                word.push(line[i]);
                i += 1;
            }
        }

        tokens.push(word.join('')); // if only one word in line

        // Filter out irrelevant strings
        return tokens.filter((el) => el !== '' && el !== ' ');
    }

    static tokenize_fragment(fragment) {
        const tokenized_fragment = [];
        const re = /function(\d)+/;
        let backwards_slice = false;
        for (let line of fragment) {
            const tokens = Vectorizer.tokenize_line(line);
            tokenized_fragment.push(tokens);
            // tokenized_fragment.concat(tokens) // more correct !!!
        }

        return [tokenized_fragment, backwards_slice];
    }

    save_tokenized_data() {
        return new Promise((resolve, reject) => {
            let writeStream = fs.createWriteStream(`./data/${this.dataset_name}_tokenized_dataset.txt`);

            for (let fragment of this.fragments) {
                for (let line of fragment) {
                    writeStream.write(line.join(' '));
                    writeStream.write(' ');
                }
                writeStream.write('\n');            
            }
            writeStream.end();

            // the finish event is emitted when all data has been flushed from the stream
            writeStream.on('finish', () => {
                console.log('Wrote all tokenized dataset to file');
                resolve();
            });
            writeStream.on("error", reject);
        });
    }

    add_fragment(fragment) {
        const [tokenized_fragment, backwards_slice] = Vectorizer.tokenize_fragment(fragment);
        this.fragments.push(tokenized_fragment);
    }

    vectorize(fragment) {
        const [tokenized_fragment, backwards_slice] = Vectorizer.tokenize_fragment(fragment);
        let tokenized_fragment_flat = tokenized_fragment.flat();
        const vectors = [];

        for (let i = 0; i < Math.min(tokenized_fragment_flat.length, 100); i++) {
            vectors.push(this.embeddings.getVector(tokenized_fragment_flat[i])?.values 
                ?? new Float32Array(this.vector_length).fill(0));
        }
        return vectors;
    }

    vectorize_fragments(fragments_with_labels) {
        const vectors = [];
        let count = 0;
        for (let {fragment, val} of fragments_with_labels) {
            print_progress(`Processing fragments... ${++count}`);
            const vector = this.vectorize(fragment);
            const row = {"vector": vector, "val": val};
            vectors.push(row);
        }
        console.log('\n');
        return vectors;
    }

    train_model() {
        return new Promise((resolve, reject) => {
            const load_model = () => {
                w2v.loadModel(__dirname + `/../data/${this.dataset_name}_vectors.txt`, (err, model) => {
                    this.embeddings = model;
                    resolve();
                });
            }
    
            if (!fs.existsSync(__dirname + `/../data/${this.dataset_name}_vectors.txt`)) {
                this.save_tokenized_data().then(() => {
                    w2v.word2vec(__dirname + `/../data/${this.dataset_name}_tokenized_dataset.txt`, 
                        __dirname + `/../data/${this.dataset_name}_vectors.txt`, {
                        cbow: 1,
                        size: this.vector_length,
                        //window: 8,
                        //negative: 25,
                        //hs: 0,
                        //sample: 1e-4,
                        //threads: 20,
                        //iter: 15,
                        minCount: 1
                    }, load_model);
                });
            } else {
                load_model();
            }
        });
    }
}

module.exports = Vectorizer;