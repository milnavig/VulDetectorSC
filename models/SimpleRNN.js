const Model = require('./Model');
const tf = require('@tensorflow/tfjs');

class SimpleRNN extends Model {
    constructor(data, name, batch_size, lr, epochs, dropout, threshold) {
        super(data, name, batch_size, lr, epochs, dropout, threshold);
        
        this.create_model();
    }

    create_model() {
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
}

module.exports = SimpleRNN;