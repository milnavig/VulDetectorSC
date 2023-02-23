const { plot } = require('nodeplotlib');

function draw_roc(fpr_array, tpr_array) {
    const roc_layout = {
        title: 'ROC',
        xaxis: { title: 'False Positive Rate (FPR)' },
        yaxis: { title: 'True Positive Rate (TPR)' }
    };

    const roc_data = [
        {
            x: fpr_array,
            y: tpr_array,
            type: 'scatter',
        },
        {
            x: [0, 1],
            y: [0, 1],
            type: 'scatter',
            line: {color: 'grey'},
        },
    ];
      
    plot(roc_data, roc_layout);
}

module.exports = draw_roc;