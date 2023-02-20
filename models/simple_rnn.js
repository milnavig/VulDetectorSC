const tf = require('@tensorflow/tfjs');
const getRandomInt = require('../helpers/generate_random_int');
const train_test_split = require('../helpers/train_test_split');

class SimpleRNN {
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

        [this.x_train, this.x_test, this.y_train, this.y_test] = train_test_split(resampled_vectors, resampled_vals, 0.2);
        this.x_train = tf.tensor(this.x_train);
        this.x_test = tf.tensor(this.x_test);
        this.y_train = tf.oneHot(tf.tensor1d(this.y_train, 'int32'), 2);
        this.y_test = tf.oneHot(tf.tensor1d(this.y_test, 'int32'), 2);
        //this.x_test.print(true);
        
        const model = tf.sequential();
        model.add(tf.layers.simpleRNN({units: 300, inputShape: [this.x_test.shape[1], this.x_test.shape[2]]}));
        model.add(tf.layers.reLU());
        model.add(tf.layers.dropout({rate: this.dropout}));
        model.add(tf.layers.dense({units: 300}));
        model.add(tf.layers.reLU());
        model.add(tf.layers.dropout({rate: this.dropout}));
        model.add(tf.layers.dense({units: 2, activation: 'softmax'}));
        
        model.compile({
            optimizer: tf.train.adamax(this.lr),
            loss: 'meanSquaredError', //categorical_crossentropy
            metrics: ['accuracy']
        });

        this.model = model;
    }

    async train() {
        const history = await this.model.fit(this.x_train, this.y_train, {
            batchSize: this.batch_size,
            epochs: this.epochs,
            //classWeight: this.class_weight
        });
        
        //await this.model.save('http://localhost:3000/save');

        return history;
    }

    async load_model() {
        //this.model = await tf.loadLayersModel('http://localhost:3000/get');
    }

    test() {
        const result = this.model.evaluate(this.x_test, this.y_test, {batchSize: this.batch_size});
        //console.log('Accuracy: ');
        //result[1].print();

        let predictions = this.model.predict(this.x_test, {batchSize: this.batch_size});
        //predictions.print(); // [[0.0031147, 0.9968852], [0.0031492, 0.9968508]]
        predictions = predictions.round().argMax(1);

        let out = tf.math.confusionMatrix(this.y_test.argMax(1), predictions, 2);
        //out.print();
        out = out.dataSync();

        const [tn, fp, fn, tp] = out;
        
        console.log('Accuracy: ', (tp + tn) / (tp + tn + fp + fn));
        console.log('False positive rate(FPR): ', fp / (fp + tn));
        console.log('False negative rate(FNR): ', fn / (fn + tp));
        const recall = tp / (tp + fn);
        console.log('Recall(TPR): ', recall);
        const precision = tp / (tp + fp);
        console.log('Precision: ', precision);
        console.log('F1 score: ', (2 * precision * recall) / (precision + recall));
    }
}

module.exports = SimpleRNN;