// Simple script to get the redirect URI
const scheme = '0km-app';
const useProxy = true;

// This is what AuthSession.makeRedirectUri({ scheme: '0km-app', useProxy: true }) would return
const redirectUri = `exp://fb4hvyo-anonymous-8081.exp.direct`;

console.log('🔗 Your Spotify Redirect URI should be:');
console.log(redirectUri);
console.log('\n📋 Add this exact URI to your Spotify App settings:');
console.log('1. Go to https://developer.spotify.com/dashboard');
console.log('2. Click on your app');
console.log('3. Go to "Edit Settings"');
console.log('4. Add this URI to "Redirect URIs":', redirectUri);
console.log('5. Save changes');
