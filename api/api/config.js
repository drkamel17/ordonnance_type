export const runtime = 'edge';

export async function GET() {
  const config = {
    JSONBIN_API_KEY: process.env.JSONBIN_API_KEY || '',
    JSONBIN_BIN_ID: process.env.JSONBIN_BIN_ID || '69d7eb68856a68218917382a'
  };
  
  return new Response(`window.ENV = ${JSON.stringify(config)};`, {
    headers: { 'Content-Type': 'application/javascript' }
  });
}
