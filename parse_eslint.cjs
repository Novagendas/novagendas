const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint-output.json', 'utf8'));

let count = 0;
data.forEach(file => {
    file.messages.forEach(msg => {
        if (msg.ruleId && msg.ruleId.startsWith('security/')) {
            console.log(`${file.filePath}:${msg.line}:${msg.column} - ${msg.ruleId} - ${msg.message}`);
            count++;
        }
    });
});
console.log(`\nTotal security warnings: ${count}`);
