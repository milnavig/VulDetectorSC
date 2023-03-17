const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const fs = require('fs');
const Model = require('./Model');


function dot_product(x, kernel) {
    // Wrapper for dot product operation, in order to be compatible with both Theano and Tensorflow
    /*
        Args:
            x (): input
            kernel (): weights
        Returns:
    */
    if (tf.getBackend() === 'tensorflow') {
        return tf.squeeze(tf.dot(x, tf.expandDims(kernel)), -1);
    } else {
        return tf.dot(x, kernel);
    }
}

class AttentionWithContext extends tf.layers.Layer {
    /*
    Attention operation, with a context/query vector, for temporal data.
    Supports Masking.
    follows these equations:
    (1) u_t = tanh(W h_t + b)
    (2) \alpha_t = \frac{exp(u^T u)}{\sum_t(exp(u_t^T u))}, this is the attention weight
    (3) v_t = \alpha_t * h_t, v in time t
    # Input shape
        3D tensor with shape: `(samples, steps, features)`.
    # Output shape
        3D tensor with shape: `(samples, steps, features)`.
    */

    constructor (config) {
        super(config);

        this.supports_masking = true;
        this.init = tf.initializers.glorotNormal();

        this.W_regularizer = tf.regularizers.l1();
        this.u_regularizer = tf.regularizers.l1();
        this.b_regularizer = tf.regularizers.l1();

        this.W_constraint = tf.constraints.maxNorm();
        this.u_constraint = tf.constraints.maxNorm();
        this.b_constraint = tf.constraints.maxNorm();

        this.bias = bias;
    }

    build(inputShape) {
        if (inputShape !== 3) {
            throw new Error('input shape is not equal to 3!');
        }

        this.W = this.addWeight(`${this.name}_W`, // Name of the new weight variable
            [input_shape[input_shape.length - 1], input_shape[input_shape.length - 1]], // The shape of the weight
            'float32', // The dtype of the weight
            this.init, // An initializer instance
            this.W_regularizer, // A regularizer instance
            true, // Whether the weight should be trained via backprop or not 
            this.W_constraint); // An optional trainable
        
        if (this.bias) {
            this.b = this.addWeight(`${this.name}_b`,            
                [input_shape[input_shape.length - 1]],
                'float32', // The dtype of the weight
                undefined,
                this.b_regularizer,
                undefined,
                this.b_constraint);
        }

        this.u = this.addWeight(`${this.name}_u`,
            [input_shape[input_shape.length - 1]],
            'float32', // The dtype of the weight
            this.init, // An initializer instance
            this.u_regularizer,
            undefined,
            this.u_constraint);

        super.build(input_shape);
    }

    computeMask(input) {
        // do not pass the mask to the next layers
        return null;
    }

    call(x, kwargs) {
        let uit = dot_product(x, this.W);
        
        if (this.bias) {
            uit += this.b;
        }

        uit = tf.tanh(uit);
        let ait = dot_product(uit, this.u);

        let a = tf.exp(ait);
        
        a /= tf.cast(tf.sum(a, 1, true), 'float32');

        a = tf.expandDims(a);
        let weighted_input = x * a;

        return weighted_input;
    }

    computeOutputShape(input_shape) {
        return [input_shape[0], input_shape[1], input_shape[2]];
    }
}

class Addition extends tf.layers.Layer {
    /*
    This layer is supposed to add of all activation weight.
    We split this from AttentionWithContext to help us getting the activation weights
    follows this equation:
    (1) v = \sum_t(\alpha_t * h_t)

    # Input shape
        3D tensor with shape: `(samples, steps, features)`.
    # Output shape
        2D tensor with shape: `(samples, features)`.
    */
    constructor (config) {
        super(config);
    }

    build(input_shape) {
        this.output_dim = input_shape[input_shape.length - 1];
        super.build(input_shape);
    }

    call(x, kwargs) {
        return tf.sum(x, 1);
    }

    computeOutputShape(input_shape) {
        return [input_shape[0], this.output_dim];
    }
}

// Bidirectional LSTM neural network with attention
class BLSTM_Attention extends Model {
    constructor(data, name, batch_size, lr, epochs, dropout, threshold) {
        super(data, name, batch_size, lr, epochs, dropout, threshold);
    }

    async create_model() {
        this.x_train = tf.tensor(this.x_train);
        this.x_test = tf.tensor(this.x_test);
        this.y_train = tf.oneHot(tf.tensor1d(this.y_train, 'int32'), 2);
        this.y_test = tf.oneHot(tf.tensor1d(this.y_test, 'int32'), 2);
        //this.x_test.print(true);

        if (fs.existsSync(`${__dirname}/../data/${this.name.toLowerCase()}/model.json`)) {
            await this.load_model();
            this.model.compile({
                optimizer: tf.train.adamax(this.lr),
                loss: 'meanSquaredError', //categorical_crossentropy
                metrics: ['accuracy']
            });
        } else {
            const model = tf.sequential();

            model.add(tf.layers.bidirectional({
                layer: tf.layers.lstm({units: 300, inputShape: [this.x_test.shape[1], this.x_test.shape[2]]}),
                inputShape: [this.x_test.shape[1], this.x_test.shape[2]]
            }));
            model.add(new AttentionWithContext());
            model.add(new Addition());
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
}

module.exports = BLSTM_Attention;