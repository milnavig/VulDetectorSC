const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Чтение JSON-файла
const jsonData = fs.readFileSync('./../data/reentrancy_50x50_vectorized.json');
let data = JSON.parse(jsonData);
data = data.map(row => JSON.stringify(row.vector))

console.log(data)

// Создание объекта CSV-писателя
const csvWriter = createCsvWriter({
  path: './../data/reentrancy_50x50_vectorized.csv',
  header: [
    { id: 'vector', title: 'Vector' },
    { id: 'val', title: 'Value' }
  ]
});

// Преобразование данных и запись в CSV-файл
csvWriter.writeRecords(data)
  .then(() => console.log('Write to CSV file completed successfullyо'))
  .catch(err => console.error('Error writing to CSV file:', err));