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