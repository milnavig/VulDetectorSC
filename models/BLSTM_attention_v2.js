const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

/**
 * A custom layer used to obtain the last time step of an RNN sequential
 * output.
 */
class GetLastTimestepLayer extends tf.layers.Layer {
    constructor(config) {
      super(config || {});
      this.supportMasking = true;
    }
  
    computeOutputShape(inputShape) {
      const outputShape = inputShape.slice();
      outputShape.splice(outputShape.length - 2, 1);
      return outputShape;
    }
  
    call(input) {
      if (Array.isArray(input)) {
        input = input[0];
      }
      const inputRank = input.shape.length;
      tf.util.assert(inputRank === 3, `Invalid input rank: ${inputRank}`);
      return input.gather([input.shape[1] - 1], 1).squeeze([1]);
    }
  
    static get className() {
      return 'GetLastTimestepLayer';
    }
}

tf.serialization.registerClass(GetLastTimestepLayer);

// Bidirectional LSTM neural network with attention
class BLSTM_Attention_v2 extends Model {
    constructor(data, name, batch_size, lr, epochs, dropout, threshold) {
        super(data, name, batch_size, lr, epochs, dropout, threshold);
    }

    async create_model() {
        this.x_train = tf.tensor(this.x_train);
        this.x_test = tf.tensor(this.x_test);
        this.y_train = tf.oneHot(tf.tensor1d(this.y_train, 'int32'), 2);
        this.y_test = tf.oneHot(tf.tensor1d(this.y_test, 'int32'), 2);

        if (fs.existsSync(`${__dirname}/../data/${this.name.toLowerCase()}/model.json`)) {
            await this.load_model();
            model.compile({
                loss: 'categoricalCrossentropy',
                optimizer: 'adam'
            });
        } else {
            const inputVocabSize = [this.x_test.shape[1], this.x_test.shape[2]];
            const outputVocabSize = [this.x_test.shape[1], this.x_test.shape[2]];
            const inputLength = this.x_test.shape[1];
            const outputLength = 100;

            const embeddingDims = 64;
            const lstmUnits = 64;

            const encoderInput = tf.input({shape: [inputLength]});
            const decoderInput = tf.input({shape: [outputLength]});

            let encoder = tf.layers.embedding({
                inputDim: inputVocabSize,
                outputDim: embeddingDims,
                inputLength,
                maskZero: true
            }).apply(encoderInput);

            encoder = tf.layers.lstm({
                units: lstmUnits,
                returnSequences: true
            }).apply(encoder);

            const encoderLast = new GetLastTimestepLayer({
                name: 'encoderLast'
            }).apply(encoder);

            let decoder = tf.layers.embedding({
                inputDim: outputVocabSize,
                outputDim: embeddingDims,
                inputLength: outputLength,
                maskZero: true
            }).apply(decoderInput);

            decoder = tf.layers.lstm({
                units: lstmUnits,
                returnSequences: true
            }).apply(decoder, {initialState: [encoderLast, encoderLast]});

            let attention = tf.layers.dot({axes: [2, 2]}).apply([decoder, encoder]);
            attention = tf.layers.activation({
                activation: 'softmax',
                name: 'attention'
            }).apply(attention);

            const context = tf.layers.dot({
                axes: [2, 1],
                name: 'context'
            }).apply([attention, encoder]);

            const decoderCombinedContext = tf.layers.concatenate().apply([context, decoder]);

            let output = tf.layers.timeDistributed({
                layer: tf.layers.dense({
                    units: lstmUnits,
                    activation: 'tanh'
                })
            }).apply(decoderCombinedContext);
            output = tf.layers.timeDistributed({
                layer: tf.layers.dense({
                    units: outputVocabSize,
                    activation: 'softmax'
                })
            }).apply(output);

            const model = tf.model({
                inputs: [encoderInput, decoderInput],
                outputs: output
            });
            model.compile({
                loss: 'categoricalCrossentropy',
                optimizer: 'adam'
            });
            this.model = model;
        }
    }
}

module.exports = BLSTM_Attention_v2;