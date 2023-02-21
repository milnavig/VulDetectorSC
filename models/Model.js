const tf = require('@tensorflow/tfjs');
const getRandomInt = require('../helpers/generate_random_int');
const train_test_split = require('../helpers/train_test_split');
const LossHistory = require('./../helpers/draw_loss');

class Model {
    constructor(data, name, batch_size, lr, epochs, dropout, threshold) {
        this.vectors = data;
        this.name = name;
        this.batch_size = batch_size;
        this.lr = lr;
        this.epochs = epochs;
        this.dropout = dropout;
        this.threshold = threshold;

        this.prepare_dataset();
    }

    prepare_dataset() {
        let negative_samples = this.vectors.filter(({val}) => val === 0);
        let positive_samples = this.vectors.filter(({val}) => val === 1);

        if (negative_samples.length > positive_samples.length) {
            let negative_samples_undersampled = new Array(positive_samples.length)
                .fill(0).map(() => negative_samples[getRandomInt(0, negative_samples.length)]);
            negative_samples = negative_samples_undersampled;
        }

        let resampled = [...negative_samples, ...positive_samples];

        let resampled_vectors = resampled.map(({vector}) => vector);
        let resampled_vals = resampled.map(({val}) => val);

        [this.x_train, this.x_test, this.y_train, this.y_test] = train_test_split(resampled_vectors, resampled_vals, 0.2);
    }

    async train() {
        const loss_history = new LossHistory();
        const history = await this.model.fit(this.x_train, this.y_train, {
            batchSize: this.batch_size,
            epochs: this.epochs,
            callbacks: {
                onTrainBegin: loss_history.onTrainBegin.bind(loss_history),
                onBatchEnd: loss_history.onBatchEnd.bind(loss_history),
                onEpochEnd: loss_history.onEpochEnd.bind(loss_history),
                onTrainEnd: loss_history.onTrainEnd.bind(loss_history),
            },
            //classWeight: this.class_weight
        });

        //loss_history.loss_plot('batch');
        
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

module.exports = Model;