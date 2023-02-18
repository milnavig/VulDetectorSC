const tf = require('@tensorflow/tfjs');
const getRandomInt = require('../helpers/generate_random_int');
const train_test_split = require('../helpers/train_test_split');

class RNN {
    constructor(data, name="", batch_size, lr, epochs, dropout, threshold) {
        this.vectors = data;
        this.name = name;
        this.batch_size = batch_size;
        this.lr = lr;
        this.epochs = epochs;
        this.dropout = dropout;
        this.threshold = threshold;

        let negative_samples = data.filter(({val}) => val === 0);
        let positive_samples = data.filter(({val}) => val === 1);

        if (negative_samples.length > positive_samples.length) {
            let negative_samples_undersampled = new Array(positive_samples.length)
                .fill(0).map(() => negative_samples[getRandomInt(0, negative_samples.length)]);
            negative_samples = negative_samples_undersampled;
        }

        let resampled = [...negative_samples, ...positive_samples];

        let resampled_vectors = resampled.map(({vector}) => vector);
        let resampled_vals = resampled.map(({val}) => val);

        let [x_train, x_test, y_train, y_test] = train_test_split(resampled_vectors, resampled_vals, 0.2);

        const model = tf.sequential();
        model.add(tf.layers.simpleRNN({units: 8, returnSequences: true}));
        model.add(tf.layers.reLU());
        model.add(tf.layers.dropout({rate: this.dropout}));
        model.add(tf.layers.dense({units: 300}));
        model.add(tf.layers.reLU());
        model.add(tf.layers.dropout({rate: this.dropout}));
        model.add(tf.layers.dense({units: 2, activation: 'softmax'}));
        
        model.compile({
            optimizer: tf.train.adamax(this.lr),
            loss: 'categorical_crossentropy'
        });

        this.model = model;
    }
}