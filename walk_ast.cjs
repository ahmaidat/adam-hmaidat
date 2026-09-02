const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('src/components/PassengerApp.tsx', 'utf8');
const sourceFile = ts.createSourceFile('PassengerApp.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function walk(node, depth = 0) {
  if (ts.isJsxElement(node)) {
    const tag = node.openingElement.tagName.getText(sourceFile);
    const start = sourceFile.getLineAndCharacterOfPosition(node.openingElement.getStart(sourceFile));
    const end = sourceFile.getLineAndCharacterOfPosition(node.closingElement.getStart(sourceFile));
    // console.log(`${' '.repeat(depth)}<${tag}> at line ${start.line+1} -> </${tag}> at line ${end.line+1}`);
  } else if (ts.isJsxSelfClosingElement(node)) {
    // const tag = node.tagName.getText(sourceFile);
    // const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    // console.log(`${' '.repeat(depth)}<${tag} /> at line ${start.line+1}`);
  }
  ts.forEachChild(node, child => walk(child, depth + 1));
}

walk(sourceFile);
console.log('Walk finished');
