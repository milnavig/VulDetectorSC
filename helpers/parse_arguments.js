// parse arguments from CLI
// Example: npm start -- -D 'train_data/reentrancy_1671.txt' -d 4 -th 0.6

const { Command, Option } = require('commander');
const program = new Command();

function myParseInt(value, dummyPrevious) {
    // parseInt takes a string and a radix
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
      throw new commander.InvalidArgumentError('Not a number.');
    }
    return parsedValue;
}

function myParseFloat(value, dummyPrevious) {
    // parseFloat takes a string and a radix
    const parsedValue = parseFloat(value, 10);
    if (isNaN(parsedValue)) {
      throw new commander.InvalidArgumentError('Not a number.');
    }
    return parsedValue;
}

program
    .name('VulDetector')
    .description('CLI to Smart Contracts Vulnerability Detection App')
    .addOption(new Option('-D, --dataset <path>', 'Dataset')
        .default('train_data/reentrancy_1671.txt')
        .choices(['train_data/reentrancy_1671.txt']))
    .addOption(new Option('-M --model <model>', 'Model')
        .default('BLSTM_Attention')
        .choices(['BLSTM', 'BLSTM_Attention', 'LSTM_Model', 'Simple_RNN', 'Baseline_FC']))
    .addOption(new Option('--lr <number>', 'Learning rate')
        .default(0.002)
        .argParser(myParseFloat))
    .addOption(new Option('-d, --dropout <rate>', 'Dropout rate')
        .default(0.2)
        .argParser(myParseFloat))
    .addOption(new Option('--vector_dim <number>', 'Dimensions of vector')
        .default(300)
        .argParser(myParseInt))
    .addOption(new Option('--epochs <number>', 'Number of epochs')
        .default(10)
        .argParser(myParseInt))
    .addOption(new Option('-b, --batch_size <number>', 'Batch size')
        .default(64)
        .argParser(myParseInt))
    .addOption(new Option('-th, --threshold <number>', 'Threshold')
        .default(0.5)
        .argParser(myParseFloat))

program.parse();
const options = program.opts();

module.exports = options;