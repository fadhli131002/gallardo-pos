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
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes("'http://31.97.51.101")) {
    content = content.replace(/'http:\/\/31\.97\.51\.101/g, "window.API_URL + '");
    changed = true;
  }
  
  if (content.includes("`http://31.97.51.101")) {
    content = content.replace(/`http:\/\/31\.97\.51\.101/g, "`${window.API_URL}");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
