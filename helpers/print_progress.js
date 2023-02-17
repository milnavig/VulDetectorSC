function printProgress(text){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(text);
}

module.exports = printProgress;