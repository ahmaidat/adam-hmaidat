import fs from 'fs';

const file = './src/components/DriverApp.tsx';
const content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

let braceStack = [];
let parenStack = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Clean all comments
  line = line.split('//')[0];
  
  // Clean string literals to avoid counting characters within strings
  let cleanLine = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === "'" && !inDoubleQuote && !inTemplateLiteral) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote && !inTemplateLiteral) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inTemplateLiteral = !inTemplateLiteral;
    } else if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral) {
      cleanLine += char;
    }
  }
  
  // Now count on clean line
  for (let j = 0; j < cleanLine.length; j++) {
    const char = cleanLine[j];
    if (char === '{') {
      braceStack.push({ lineNum: i + 1, content: line.trim() });
    } else if (char === '}') {
      if (braceStack.length > 0) {
        braceStack.pop();
      } else {
        console.log(`EXTRA CLOSE BRACE on line ${i + 1}: ${line.trim()}`);
      }
    } else if (char === '(') {
      parenStack.push({ lineNum: i + 1, content: line.trim() });
    } else if (char === ')') {
      if (parenStack.length > 0) {
        parenStack.pop();
      } else {
        console.log(`EXTRA CLOSE PAREN on line ${i + 1}: ${line.trim()}`);
      }
    }
  }
}

console.log('--- FINAL REPORT ---');
console.log('Unclosed braces remaining:', braceStack.length);
braceStack.forEach(b => console.log(`Brace opened at line ${b.lineNum}: ${b.content}`));

console.log('Unclosed parens remaining:', parenStack.length);
parenStack.forEach(p => console.log(`Paren opened at line ${p.lineNum}: ${p.content}`));
