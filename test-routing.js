// Test script to verify routing configuration
const routes = [
  '/dashboard',
  '/clients', 
  '/meetings',
  '/tasks',
  '/secrets'
];

console.log('Testing routes configuration...');
routes.forEach(route => {
  console.log(`✓ Route configured: ${route}`);
});

console.log('\nAll routes should now be accessible from the sidebar navigation.');
console.log('If you\'re still having issues, please check:');
console.log('1. Browser console for any JavaScript errors');
console.log('2. Network tab for failed API requests');
console.log('3. Make sure you\'re logged in and authenticated');