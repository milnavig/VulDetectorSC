## How to launch

```
npm i
npm start
```
This project currently supports 3 models:
+ Simple RNN
+ LSTM
+ BLSTM

To run Simple RNN model:
```
npm start -- -D 'train_data/reentrancy_1671.txt' -M 'Simple_RNN' -d 0.2 -th 0.5
```
To run LSTM model:
```
npm start -- -D 'train_data/reentrancy_1671.txt' -M 'LSTM_Model' -d 0.2 -th 0.5
```
To run BLSTM model:
```
npm start -- -D 'train_data/reentrancy_1671.txt' -M 'BLSTM_Model' -d 0.2 -th 0.5
```

## CLI arguments: 
1. `-D` or `--dataset` to send dataset;
2. `-M` or `--model` to set model;
3. `--lr` to set learning rate;
4. `-d` or `--dropout` to set dropout;
5. `--vector_dim` to set vector dimensions;
6. `--epochs` to set number of epochs;
7. `-b` or `--batch_size` to set batch size;
8. `-th` or `--threshold` to set threshold.