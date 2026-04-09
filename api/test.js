export default async function handler(request) {
  return new Response(JSON.stringify({
    status: 'OK',
    message: 'API is working',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
