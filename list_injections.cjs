const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint-output.json', 'utf8'));

data.forEach(file => {
    let lines = [];
    file.messages.forEach(msg => {
        if (msg.ruleId === 'security/detect-object-injection') {
            lines.push(msg.line);
        }
    });
    if (lines.length > 0) {
        console.log(`File: ${file.filePath}`);
        lines.forEach(l => console.log(`Line ${l}`));
    }
});
