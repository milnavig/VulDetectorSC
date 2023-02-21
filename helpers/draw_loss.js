const { plot } = require('nodeplotlib');

class LossHistory {
    constructor() {}

    // called when training starts
    onTrainBegin(logs) {
        this.losses = {batch: [], epoch: []};
        this.accuracy = {batch: [], epoch: []};
        this.val_loss = {batch: [], epoch: []};
        this.val_acc = {batch: [], epoch: []};
    }

    // called at the end of every batch
    onBatchEnd(batch, logs) {
        this.losses.batch.push(logs.loss);
        this.accuracy.batch.append(logs.acc);
        this.val_loss.batch.append(logs.val_loss);
        this.val_acc.batch.append(logs.val_acc);
    }

    // called at the end of every epoch
    onEpochEnd(epoch, logs) {
        this.losses.epoch.push(logs.loss);
        this.accuracy.epoch.append(logs.acc);
        this.val_loss.epoch.append(logs.val_loss);
        this.val_acc.epoch.append(logs.val_acc);
    }

    // called when training ends
    onTrainEnd(logs) {
        this.loss_plot('batch');
    }

    loss_plot(loss_type) {
        const iters = this.losses[loss_type].length;
        const x_array = new Array(iters).fill(0).map((el, i) => ++i);

        const layout = {
            title: 'Loss History',
            xaxis: { title: loss_type },
            yaxis: { title: 'Loss' }
        };

        const data = [
            {
                x: x_array,
                y: this.losses[loss_type],
                type: 'scatter',
            },
        ];
          
        plot(data, layout);
    }
}

module.exports = LossHistory;