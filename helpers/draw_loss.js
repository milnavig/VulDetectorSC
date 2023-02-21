const { plot } = require('nodeplotlib');

class LossHistory {
    constructor() {}

    // called when training starts
    onTrainBegin(logs) {
        //console.log('Started to train model');
        this.losses = {batch: [], epoch: []};
        this.accuracy = {batch: [], epoch: []};
        this.val_loss = {batch: [], epoch: []};
        this.val_acc = {batch: [], epoch: []};
    }

    // called at the end of every batch
    onBatchEnd(batch, logs) {
        this.losses.batch.push(logs.loss);
        this.accuracy.batch.push(logs.acc);
        this.val_loss.batch.push(logs.val_loss);
        this.val_acc.batch.push(logs.val_acc);
    }

    // called at the end of every epoch
    onEpochEnd(epoch, logs) {
        this.losses.epoch.push(logs.loss);
        this.accuracy.epoch.push(logs.acc);
        this.val_loss.epoch.push(logs.val_loss);
        this.val_acc.epoch.push(logs.val_acc);
    }

    // called when training ends
    onTrainEnd(logs) {
        this.loss_plot('batch');
        this.loss_plot('epoch');
    }

    loss_plot(loss_type) {
        const iters = this.losses[loss_type].length;
        const x_array = new Array(iters).fill(0).map((el, i) => ++i);

        const loss_layout = {
            title: 'Loss History',
            xaxis: { title: loss_type },
            yaxis: { title: 'Loss' }
        };

        const loss_data = [
            {
                x: x_array,
                y: this.losses[loss_type],
                type: 'scatter',
            },
        ];
          
        plot(loss_data, loss_layout);

        const acc_layout = {
            title: 'Accuracy History',
            xaxis: { title: loss_type },
            yaxis: { title: 'Accuracy' }
        };

        const acc_data = [
            {
                x: x_array,
                y: this.accuracy[loss_type],
                type: 'scatter',
            },
        ];
          
        plot(acc_data, acc_layout);
    }
}

module.exports = LossHistory;