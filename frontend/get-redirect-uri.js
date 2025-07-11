// Simple script to get the redirect URI and test Spotify credentials
const scheme = '0km-app';
const useProxy = true;

// This is what AuthSession.makeRedirectUri() would return in development
const redirectUri = `exp://fb4hvyo-anonymous-8081.exp.direct`;

console.log('🔗 Your Spotify Redirect URI should be:');
console.log(redirectUri);
console.log('\n📋 Add this exact URI to your Spotify App settings:');
console.log('1. Go to https://developer.spotify.com/dashboard');
console.log('2. Click on your app');
console.log('3. Go to "Edit Settings"');
console.log('4. Add this URI to "Redirect URIs":', redirectUri);
console.log('5. Save changes');
console.log('\n💡 Note: This is the development URI. For production, use: 0km-app://');

console.log('\n🔑 Spotify Credentials Check:');
console.log('Client ID: f805d2782059483e801da7782a7e04c8');
console.log('Client Secret: 06b28132afaf4c0b9c1f3224c268c35b');
console.log(
  'Basic Auth Header:',
  btoa('f805d2782059483e801da7782a7e04c8:06b28132afaf4c0b9c1f3224c268c35b'),
);

console.log('\n🔍 Common Issues:');
console.log('1. Redirect URI mismatch - make sure it matches exactly');
console.log("2. Client secret exposed - check if it's correct in Spotify dashboard");
console.log('3. Authorization code expired - codes expire quickly');
console.log('4. Wrong grant_type - should be "authorization_code"');
