require('dotenv').config();

console.log('🔍 Checking Spotify Environment Variables:');
console.log('SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? 'Set' : 'Not set');
console.log('SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI || 'Not set');

if (process.env.SPOTIFY_REDIRECT_URI) {
  console.log('\n📋 Current Redirect URI:', process.env.SPOTIFY_REDIRECT_URI);
  console.log('💡 Make sure this exact URI is added to your Spotify App settings!');
} else {
  console.log('\n❌ SPOTIFY_REDIRECT_URI is not set!');
  console.log('💡 You need to create a .env file in the backend directory with:');
  console.log('SPOTIFY_REDIRECT_URI=your_redirect_uri_here');
}
