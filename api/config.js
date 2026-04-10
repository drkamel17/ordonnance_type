export const runtime = 'edge';

export async function GET() {
  const config = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_KEY: process.env.SUPABASE_KEY || ''
  };
  
  return new Response(`window.ENV = ${JSON.stringify(config)};`, {
    headers: { 'Content-Type': 'application/javascript' }
  });
}
