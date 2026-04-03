const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@supabase',
  'realtime-js',
  'dist',
  'module',
  'RealtimeClient.js'
);

try {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const oldCode = `_fetch = (...args) => import('@supabase/node-fetch')`;
    const newCode = `_fetch = (...args) => Promise.resolve({ default: fetch }).then(({ default: fetch }) => fetch(...args))`;
    
    if (content.includes(oldCode)) {
      content = content.replace(oldCode, newCode);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Patched @supabase/realtime-js dynamic import successfully');
    } else {
      console.log('@supabase/realtime-js already patched or different version');
    }
  }
} catch (err) {
  console.warn('Failed to patch @supabase/realtime-js:', err.message);
}
