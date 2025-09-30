#!/usr/bin/env node

/**
 * Cache clearing utility for development
 * Run with: node scripts/clear-cache.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing development cache...\n');

const pathsToClean = [
  '.next',
  'node_modules/.cache',
  '.turbo',
  'dist',
  'build'
];

let cleanedCount = 0;

pathsToClean.forEach(dir => {
  const fullPath = path.resolve(dir);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Removed: ${dir}`);
      cleanedCount++;
    } catch (error) {
      console.log(`❌ Failed to remove: ${dir} - ${error.message}`);
    }
  } else {
    console.log(`⏭️  Skipped: ${dir} (doesn't exist)`);
  }
});

console.log(`\n🎉 Cache clearing complete! Removed ${cleanedCount} directories.`);
console.log('\n💡 Next steps:');
console.log('   1. Restart your development server: npm run dev');
console.log('   2. Hard refresh your browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)');
console.log('   3. Clear browser cache if issues persist');
