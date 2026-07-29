const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  if (file.endsWith('.jsx') || file.endsWith('.js')) {
    content = content.replace(/,\s*fontFamily:\s*['"][^'"]+['"]/g, '');
    content = content.replace(/fontFamily:\s*['"][^'"]+['"],\s*/g, '');
    content = content.replace(/fontFamily:\s*['"][^'"]+['"]/g, '');
    // Replace inline monospace usage to use className="font-mono-num" instead, but here we just strip fontFamily
  } else if (file.endsWith('.css')) {
    // We only want to keep 'var(--font-mono-ui)', 'var(--font-mono-num)', 'var(--font-sans)', 'inherit'
    // Let's match all font-family and check if they're variables. If not, strip them.
    content = content.replace(/font-family:\s*([^;]+);?/g, (match, p1) => {
      if (p1.includes('var(') || p1.includes('inherit')) {
        return match;
      }
      return '';
    });
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
  }
});
console.log('Modified files:', count);
