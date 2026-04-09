export const runtime = 'edge';

export async function GET(request) {
  return new Response(JSON.stringify({
    message: 'API is working',
    routes: ['/api/config.js', '/api/save-github']
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
