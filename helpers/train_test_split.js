const getRandomInt = require('./generate_random_int');

function train_test_split(vectors, labels, test_size=0.2) {
    if (vectors.length !== labels.length) {
        throw new Error('Vectors array and labels array have different length');
    }

    let x_train = [];
    let x_test = [];
    let y_train = [];
    let y_test = [];

    let train_dataset_size = Math.floor(vectors.length * (1 - test_size));
    let test_dataset_size = Math.floor(vectors.length * test_size);

    if ((train_dataset_size + test_dataset_size) < vectors.length) {
        train_dataset_size += vectors.length - (train_dataset_size + test_dataset_size);
    }

    for (let i = 0; i < vectors.length; i++) {
        const randomInt = getRandomInt(1, 2);
        switch(randomInt) {
            case 1:
                if (x_train.length < train_dataset_size) {
                    x_train.push(vectors[i]);
                    y_train.push(labels[i]);
                } else {
                    x_test.push(vectors[i]);
                    y_test.push(labels[i]);
                }
                break;
            case 2:
                if (x_test.length < test_dataset_size) {
                    x_test.push(vectors[i]);
                    y_test.push(labels[i]);
                } else {
                    x_train.push(vectors[i]);
                    y_train.push(labels[i]);
                }
                break;
        }
    }

    return [x_train, x_test, y_train, y_test];
}

module.exports = train_test_split;