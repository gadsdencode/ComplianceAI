
// Verification script to debug build issues
import fs from 'fs';
import path from 'path';

console.log('Verifying build files...');

// Check if dist directory exists
if (!fs.existsSync('dist')) {
  console.error('Error: dist directory does not exist!');
  process.exit(1);
}

// Check if server directory exists
if (!fs.existsSync('dist/server')) {
  console.error('Error: dist/server directory does not exist!');
  process.exit(1);
}

// Check if index.js exists
if (!fs.existsSync('dist/server/index.js')) {
  console.error('Error: dist/server/index.js file does not exist!');
  
  // Show what is in the dist directory
  console.log('Contents of dist directory:');
  console.log(fs.readdirSync('dist'));
  
  if (fs.existsSync('dist/server')) {
    console.log('Contents of dist/server directory:');
    console.log(fs.readdirSync('dist/server'));
  }
  
  process.exit(1);
}

console.log('index.js content:');
console.log(fs.readFileSync('dist/server/index.js', 'utf8').slice(0, 500) + '...');

console.log('Build verification completed successfully!');
