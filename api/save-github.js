export const config = {
  runtime: 'edge',
  api: {
    bodyParser: false,
  },
};

export default async function handler(request) {
  try {
    const { data, message, sha } = await request.json();
    
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = 'ordonnances-types.json';
    
    if (!token || !owner || !repo) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'GitHub config not set' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    const body = {
      message: message || 'Update ordonnances-types.json',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
      branch: 'main'
    };
    
    if (sha) {
      body.sha = sha;
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'File updated on GitHub',
        sha: result.content?.sha
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        message: result.message || 'GitHub API error'
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
