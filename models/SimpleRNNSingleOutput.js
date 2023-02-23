const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const fs = require('fs');
const Model = require('./Model');
const draw_roc = require('./../helpers/draw_roc');

// the model uses only one output (to build ROC curve)
class SimpleRNNSingleOutput extends Model {
    constructor(data, name, batch_size, lr, epochs, dropout, threshold) {
        super(data, name, batch_size, lr, epochs, dropout, threshold);
    }

    async create_model() {
        this.x_train = tf.tensor(this.x_train);
        this.x_test = tf.tensor(this.x_test);
        this.y_train = tf.tensor1d(this.y_train, 'int32');
        this.y_test = tf.tensor1d(this.y_test, 'int32');

        if (fs.existsSync(`${__dirname}/../data/${this.name.toLowerCase()}/model.json`)) {
            await this.load_model();
            this.model.compile({
                optimizer: tf.train.adamax(this.lr),
                loss: 'meanSquaredError',
                metrics: ['accuracy']
            });
        } else {
            const model = tf.sequential();
            model.add(tf.layers.simpleRNN({units: 300, inputShape: [this.x_test.shape[1], this.x_test.shape[2]]}));
            model.add(tf.layers.reLU());
            model.add(tf.layers.dropout({rate: this.dropout}));
            model.add(tf.layers.dense({units: 300}));
            model.add(tf.layers.reLU());
            model.add(tf.layers.dropout({rate: this.dropout}));
            model.add(tf.layers.dense({units: 1, activation: 'softmax'}));
            
            model.compile({
                optimizer: tf.train.adamax(this.lr),
                loss: 'meanSquaredError',
                metrics: ['accuracy']
            });

            this.model = model;
        }
    }

    test() {
        
    }

    calculate_roc() { // calculate ROC curve
        let current_threshold = 0;
        const step = 0.1;
        const fpr_array = [];
        const tpr_array = [];

        let predictions = this.model.predict(this.x_test, {batchSize: this.batch_size}).dataSync();
        while (current_threshold <= 1) {
            let current_predictions = predictions.map(p => p >= current_threshold ? 1 : 0);

            let out = tf.math.confusionMatrix(this.y_test, tf.tensor(current_predictions), 2);
            out = out.dataSync();

            const [tn, fp, fn, tp] = out;

            let fpr = fp / (fp + tn);
            let tpr = tp / (tp + fn);

            fpr = Number.isNaN(fpr) ? 0 : fpr;
            tpr = Number.isNaN(tpr) ? 0 : tpr;

            fpr_array.push(fpr);
            tpr_array.push(tpr);

            //console.log('False positive rate (FPR): ', fpr);
            //console.log('True positive rate (TPR): ', tpr);

            current_threshold += step;
        }
        
        draw_roc(fpr_array, tpr_array);
        //draw_roc([1, 0.1523, 0], [1, 0.7485, 0]);
    }
}

module.exports = SimpleRNNSingleOutput;