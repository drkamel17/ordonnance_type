export async function POST(request) {
  console.log('=== SUPABASE POST: Debut ===');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Present' : 'MANQUANT');
  console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Present' : 'MANQUANT');
  
  try {
    const { data } = await request.json();
    console.log('Data received:', Object.keys(data).length, 'ordonnances');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Erreur: Supabase config not set');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Supabase config not set' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Tentative de sauvegarde vers Supabase...');
    
    // Mettre à jour les données dans Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/ordonnances?id=eq.default`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        data: data,
        updated_at: new Date().toISOString()
      })
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('=== SUPABASE POST: Succes ===');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Data saved to Supabase'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const error = await response.text();
      console.log('Erreur Supabase:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Supabase error',
        details: error
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.log('=== SUPABASE POST: Erreur ===', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  console.log('=== SUPABASE GET: Debut ===');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Present' : 'MANQUANT');
  console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Present' : 'MANQUANT');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Erreur: Supabase config not set');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Supabase config not set' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Tentative de chargement depuis Supabase...');
    
    // Récupérer les données depuis Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/ordonnances?id=eq.default`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Donnees recues:', result.length, 'lignes');
      if (result.length > 0) {
        console.log('Data:', Object.keys(result[0].data).length, 'ordonnances');
      }
      console.log('=== SUPABASE GET: Succes ===');
      return new Response(JSON.stringify({ 
        success: true, 
        data: result.length > 0 ? result[0].data : {}
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const error = await response.text();
      console.log('Erreur Supabase:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Supabase error',
        details: error
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.log('=== SUPABASE GET: Erreur ===', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
