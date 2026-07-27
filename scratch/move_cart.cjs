const fs = require('fs');
const file = 'c:/xampp/htdocs/POS-Gallardo/src/pages/POS/POS.jsx';
let content = fs.readFileSync(file, 'utf8');

const cartStartStr = '              {/* Cart Section */}';
const startIndex = content.indexOf(cartStartStr);
if (startIndex === -1) {
    console.error('Cannot find cart start');
    process.exit(1);
}

// Find where pos-cart-section ends.
const searchStr = '                  </div>\n                </div>\n              </div>';
const endIndex = content.indexOf(searchStr, startIndex) + searchStr.length;

if (endIndex === -1 + searchStr.length) {
    console.error('Cannot find cart end');
    process.exit(1);
}

let cartBlock = content.substring(startIndex, endIndex);

// Remove the cart block from original position
content = content.substring(0, startIndex) + content.substring(endIndex);

// Transform cart block to remove the outer wrapper class
// Replace <div className="pos-cart-section"> with nothing, and adjust div closings.
// Actually, it's easier to just keep it and change className="pos-cart-section" to something else if needed, 
// or just wrap it in a flex col.
// Let's just modify the cart container class
cartBlock = cartBlock.replace(
    '              <div className="pos-cart-section">\n                <div className="cart-container">',
    '          {/* Cart Section */}\n          <div className="cart-container glass-card" style={{ width: "100%", boxShadow: "none", backgroundColor: "rgba(255, 255, 255, 0.4)" }}>'
);
// Remove the extra closing div
cartBlock = cartBlock.replace(/              <\/div>\s*$/, '');
// Also remove the original comment at the top
cartBlock = cartBlock.replace('              {/* Cart Section */}\n', '');

// Insert it into the summary container
const summaryTarget = '        {/* Sidebar Summary */}\n        <div className="pos-summary-container">';
const summaryReplacement = `        {/* Sidebar Summary */}\n        <div className="pos-summary-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>\n${cartBlock}`;

content = content.replace(summaryTarget, summaryReplacement);

fs.writeFileSync(file, content);
console.log('Success');
