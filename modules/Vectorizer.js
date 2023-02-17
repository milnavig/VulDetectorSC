const w2v = require('word2vec');

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

    add_fragment(fragment) {
        const [tokenized_fragment, backwards_slice] = Vectorizer.tokenize_fragment(fragment);
        this.fragments.push(tokenized_fragment);

    }

    train_model() {
        
    }
}

module.exports = Vectorizer;