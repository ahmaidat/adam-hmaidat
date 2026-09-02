const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('src/components/PassengerApp.tsx', 'utf8');
const sourceFile = ts.createSourceFile('PassengerApp.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

const diagnostics = sourceFile.parseDiagnostics || [];
console.log('Parse diagnostics count:', diagnostics.length);
for (const diag of diagnostics.slice(0, 10)) {
  const pos = sourceFile.getLineAndCharacterOfPosition(diag.start);
  console.log('Line ' + (pos.line + 1) + ', Col ' + (pos.character + 1) + ': ' + diag.messageText);
}
