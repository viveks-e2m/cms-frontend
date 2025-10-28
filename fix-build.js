#!/usr/bin/env node

// Quick fix for CSS build issue
const fs = require('fs');
const path = require('path');

// Function to fix CSS files
function fixCSSFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixCSSFiles(filePath);
    } else if (file.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix common CSS issues that cause build errors
      // 1. Fix unescaped forward slashes in calc() functions
      content = content.replace(/calc\([^)]*\/[^)]*\)/g, (match) => {
        return match.replace(/\//g, ' / ');
      });
      
      // 2. Fix comments with problematic characters
      content = content.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, (match) => {
        return match.replace(/\//g, '\\/');
      });
      
      // 3. Fix URL paths with unescaped slashes
      content = content.replace(/url\([^)]*\)/g, (match) => {
        if (match.includes('/') && !match.includes('http')) {
          return match.replace(/\//g, '\\/');
        }
        return match;
      });
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  });
}

console.log('🔧 Fixing CSS files for build...');
fixCSSFiles('./src');
console.log('✅ CSS files fixed. Try running npm run build again.');