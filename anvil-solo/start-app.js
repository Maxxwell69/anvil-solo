// Simple startup script to see errors
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Anvil Solo...');
console.log('📂 Working directory:', __dirname);
console.log('📄 Main file:', path.join(__dirname, 'dist', 'main', 'main.js'));

const electron = require('electron');
const proc = spawn(electron, [path.join(__dirname, 'dist', 'main', 'main.js')], {
  stdio: 'inherit'
});

proc.on('error', (error) => {
  console.error('❌ Error starting app:', error);
});

proc.on('exit', (code) => {
  console.log(`Process exited with code: ${code}`);
});

console.log('✅ Electron process started');





