const fs = require('fs');
const content = fs.readFileSync('prisma/professors/data/Professeurs_IDs_Password.csv', 'utf8');
const lines = content.split('\n');
console.log('Line 2 raw:', JSON.stringify(lines[1]));
process.exit(0);
