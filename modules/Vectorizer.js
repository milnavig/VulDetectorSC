const w2v = require('word2vec');
const fs = require('fs');

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
    constructor(vector_length) {
        this.fragments = [];
        this.vector_length = vector_length;
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
            //console.log(tokens);
        }

        return [tokenized_fragment, backwards_slice];
    }

    save_tokenized_data() {
        return new Promise((resolve, reject) => {
            let writeStream = fs.createWriteStream('./data/tokenized_dataset.txt');

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

    train_model() {
        this.save_tokenized_data().then(() => {
            
            w2v.word2vec( __dirname + '/../data/tokenized_dataset.txt', __dirname + '/../data/vectors.txt', {
                cbow: 1,
                size: this.vector_length,
                //window: 8,
                //negative: 25,
                //hs: 0,
                //sample: 1e-4,
                //threads: 20,
                //iter: 15,
                minCount: 1
            }, () => {
                w2v.loadModel(__dirname + '/../data/vectors.txt', function(err, model) {
                    //console.log(model);
                    
                    let wordVec = model.getVector('library');
                    console.log(wordVec);
                });
            });
        });
    }
}

module.exports = Vectorizer;