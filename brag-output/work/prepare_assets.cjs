const fs = require('fs');
const path = require('path');

const logoBuf = fs.readFileSync(path.join(__dirname, '../../public/logo.png'));
const logoB64 = 'data:image/png;base64,' + logoBuf.toString('base64');

fs.writeFileSync(
  path.join(__dirname, 'logo_b64.js'),
  'window.LOGO_B64 = ' + JSON.stringify(logoB64) + ';'
);

console.log('Saved logo_b64.js successfully');
