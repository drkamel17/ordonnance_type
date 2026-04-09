// Gestion des ordonnances types - ord_type.js

// === Configuration ===
let jsonBinConfig = {
    binId: '69d7eb68856a68218917382a',
    apiKey: ''
};

// Configuration GitHub (optionnel - pour ecrire directement sur GitHub)
let GITHUB_CONFIG = {
    token: '',
    owner: '',  
    repo: '',   
    path: 'ordonnances-types.json',
    branch: 'main'
};

// Charger la config depuis le serveur
async function loadConfig() {
    try {
        const response = await fetch('/api/config.js');
        const script = await response.text();
        const match = script.match(/window\.ENV\s*=\s*(\{[^}]+\})/);
        if (match) {
            const env = JSON.parse(match[1]);
            console.log('Config chargee:', env);
            
            jsonBinConfig = {
                binId: env.JSONBIN_BIN_ID || jsonBinConfig.binId,
                apiKey: env.JSONBIN_API_KEY || ''
            };
            // Charger aussi la config GitHub
            if (env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO) {
                GITHUB_CONFIG.token = env.GITHUB_TOKEN;
                GITHUB_CONFIG.owner = env.GITHUB_OWNER;
                GITHUB_CONFIG.repo = env.GITHUB_REPO;
                console.log('GitHub config:', GITHUB_CONFIG);
            } else {
                console.log('GitHub config NON configuree');
            }
        }
    } catch (err) {
        console.log('Config non chargee:', err);
    }
}

// Fonction pour obtenir la config
function getJSONBinConfig() {
    return jsonBinConfig;
}

// Variables globales
let ordonnanceEnEdition = null;
let medicamentsTemp = [];
let listeMedicaments = [];
let data = {};

// === Initialisation ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📌 Initialisation de ord_type.html');
    
    // Charger la config du serveur
    await loadConfig();
    
    // Charger la liste des médicaments
    await chargerListeMedicaments();
    
    // Charger les ordonnances
    await chargerOrdonnancesTypes();
    
    // Initialiser les événements
    initialiserEvenements();
    
    // Mettre à jour les statistiques
    mettreAJourStats();
});

// === Chargement de la liste des médicaments ===
async function chargerListeMedicaments() {
    try {
        const response = await fetch('medicaments.json');
        listeMedicaments = await response.json();
        console.log(`📋 ${listeMedicaments.length} médicaments chargés`);
        
        // Créer la datalist
        creerDatalistMedicaments();
    } catch (error) {
        console.error('Erreur lors du chargement de la liste des médicaments:', error);
    }
}

function creerDatalistMedicaments() {
    let datalist = document.getElementById('liste-medicaments');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'liste-medicaments';
        document.body.appendChild(datalist);
    }
    
    datalist.innerHTML = listeMedicaments
        .map(med => `<option value="${med.replace(/"/g, '&quot;')}">`)
        .join('');
}

// === Gestion des événements ===
function initialiserEvenements() {
    // Boutons principaux
    document.getElementById('btn-nouvelle-ordonnance').addEventListener('click', nouvelleOrdonnance);
    document.getElementById('btn-enregistrer').addEventListener('click', enregistrerOrdonnance);
    document.getElementById('btn-annuler').addEventListener('click', annulerEdition);
    document.getElementById('btn-ajouter-medicament').addEventListener('click', ajouterMedicamentForm);
    document.getElementById('btn-exporter').addEventListener('click', exporterOrdonnances);
    document.getElementById('btn-importer').addEventListener('click', () => document.getElementById('input-import').click());
    document.getElementById('btn-fermer').addEventListener('click', () => window.close());
    document.getElementById('btn-actualiser').addEventListener('click', actualiserDepuisJSONBin);
    document.getElementById('btn-telecharger').addEventListener('click', telechargerFichierJSON);
    
    // Import
    document.getElementById('input-import').addEventListener('change', importerOrdonnances);
    
    // Recherche
    document.getElementById('search-ordonnances').addEventListener('input', filtrerOrdonnances);
}

// === Chargement des données ===
async function chargerOrdonnancesTypesDepuisFichier() {
    // Essayer d'abord JSONBin.io (source principale)
    try {
        const jsonBinData = await chargerDepuisJSONBin();
        if (jsonBinData && Object.keys(jsonBinData).length > 0) {
            console.log('✅ Charge depuis JSONBin.io:', Object.keys(jsonBinData).length, 'ordonnances');
            return jsonBinData;
        }
    } catch (e) {
        console.log('JSONBin.io non accessible');
    }
    
    // Fallback: fichier local
    try {
        const response = await fetch('./ordonnances-types.json');
        if (response.ok) {
            const data = await response.json();
            if (data && Object.keys(data).length > 0) {
                console.log('✅ Charge depuis fichier local:', Object.keys(data).length, 'ordonnances');
                return data;
            }
        }
    } catch (e) {
        console.log('Fichier local non accessible');
    }
    
    return {};
}

// === Chargement depuis JSONBin.io (pour le bouton actualiser) ===
async function chargerDepuisJSONBin() {
    const config = getJSONBinConfig();
    
    if (!config.apiKey) {
        console.log('API Key non configuree');
        return JSON.parse(localStorage.getItem('ordonnancesTypes') || '{}');
    }
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}/latest`, {
            headers: {
                'X-Master-Key': config.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error('Erreur HTTP: ' + response.status);
        }
        
        const result = await response.json();
        return result.record || {};
    } catch (error) {
        console.error('Erreur chargement JSONBin.io:', error);
        return JSON.parse(localStorage.getItem('ordonnancesTypes') || '{}');
    }
}

async function chargerOrdonnancesTypes() {
    // Charger uniquement depuis le fichier JSON
    data = await chargerOrdonnancesTypesDepuisFichier();
    
    // Sauvegarder dans localStorage pour compatibilite
    if (Object.keys(data).length > 0) {
        localStorage.setItem('ordonnancesTypesPourOrd', JSON.stringify(data));
        localStorage.setItem('ordonnancesTypes', JSON.stringify(data));
    }
    
    afficherOrdonnances(data);
    mettreAJourStats();
}

// === Affichage ===
function afficherOrdonnances(data) {
    const container = document.getElementById('liste-ordonnances');
    const noms = Object.keys(data).sort();
    
    if (noms.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p>Aucune ordonnance type enregistrée</p>
                <p style="font-size: 0.9rem;">Cliquez sur "Nouvelle ordonnance" pour commencer</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = noms.map(nom => {
        const medicaments = data[nom];
        return `
            <div class="ordonnance-item" data-nom="${nom}">
                <div class="ordonnance-header">
                    <span class="ordonnance-nom">${nom}</span>
                    <span style="color: #6c757d; font-size: 0.85rem;">${medicaments.length} médicament(s)</span>
                </div>
                <div class="ordonnance-medicaments">
                    ${medicaments.map(med => `
                        <div class="medicament-ligne">
                            <span><strong>${med.medicament}</strong></span>
                            <span>${med.posologie}</span>
                            <span>Qté: ${med.quantite}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="ordonnance-actions">
                    <button class="btn btn-secondary btn-editer" data-nom="${nom}">✏️ Modifier</button>
                    <button class="btn btn-danger btn-supprimer" data-nom="${nom}">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Ajouter les événements après avoir inséré le HTML
    container.querySelectorAll('.btn-editer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const nom = e.target.dataset.nom;
            editerOrdonnance(nom);
        });
    });
    
    container.querySelectorAll('.btn-supprimer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const nom = e.target.dataset.nom;
            supprimerOrdonnance(nom);
        });
    });
}

function mettreAJourStats() {
    const totalOrdonnances = Object.keys(data).length;
    document.getElementById('stat-total').textContent = totalOrdonnances;
}

// === Gestion du formulaire ===
function nouvelleOrdonnance() {
    ordonnanceEnEdition = null;
    medicamentsTemp = [];
    
    document.getElementById('nom-ordonnance').value = '';
    document.getElementById('medicaments-container').innerHTML = '';
    
    document.getElementById('nom-ordonnance').focus();
    cacherMessage();
}

function ajouterMedicamentForm() {
    const index = medicamentsTemp.length;
    const container = document.getElementById('medicaments-container');
    
    const div = document.createElement('div');
    div.className = 'medicament-form';
    div.dataset.index = index;
    div.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Médicament</label>
                <input type="text" class="input-medicament" placeholder="Nom du médicament" list="liste-medicaments">
            </div>
            <div class="form-group">
                <label>Posologie</label>
                <input type="text" class="input-posologie" placeholder="Ex: 1 comprimé matin et soir">
            </div>
            <div class="form-group">
                <label>Quantité</label>
                <input type="text" class="input-quantite" placeholder="Ex: 10">
            </div>
            <button class="btn btn-danger btn-suppr-med">✕</button>
        </div>
    `;
    
    // Ajouter l'événement avec addEventListener
    const btnSuppr = div.querySelector('.btn-suppr-med');
    btnSuppr.addEventListener('click', () => supprimerMedicamentForm(index));
    
    container.appendChild(div);
    medicamentsTemp.push({ medicament: '', posologie: '', quantite: '' });
}

function supprimerMedicamentForm(index) {
    const container = document.getElementById('medicaments-container');
    const element = container.querySelector(`[data-index="${index}"]`);
    if (element) {
        element.remove();
    }
    // Réindexer
    const forms = container.querySelectorAll('.medicament-form');
    forms.forEach((form, i) => {
        form.dataset.index = i;
        const btn = form.querySelector('.btn-suppr-med');
        // Supprimer l'ancien listener et en ajouter un nouveau
        btn.replaceWith(btn.cloneNode(true));
        const newBtn = form.querySelector('.btn-suppr-med');
        newBtn.addEventListener('click', () => supprimerMedicamentForm(i));
    });
}

function editerOrdonnance(nom) {
    const ordonnance = data[nom];
    if (!ordonnance) return;
    
    ordonnanceEnEdition = nom;
    medicamentsTemp = [...ordonnance];
    
    document.getElementById('nom-ordonnance').value = nom;
    
    // Afficher les médicaments
    const container = document.getElementById('medicaments-container');
    container.innerHTML = '';
    
    ordonnance.forEach((med, index) => {
        const div = document.createElement('div');
        div.className = 'medicament-form';
        div.dataset.index = index;
        div.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Médicament</label>
                    <input type="text" class="input-medicament" value="${med.medicament}" placeholder="Nom du médicament">
                </div>
                <div class="form-group">
                    <label>Posologie</label>
                    <input type="text" class="input-posologie" value="${med.posologie}" placeholder="Ex: 1 comprimé matin et soir">
                </div>
                <div class="form-group">
                    <label>Quantité</label>
                    <input type="text" class="input-quantite" value="${med.quantite}" placeholder="Ex: 10">
                </div>
                <button class="btn btn-danger btn-suppr-med">✕</button>
            </div>
        `;
        
        // Ajouter l'événement avec addEventListener
        const btnSuppr = div.querySelector('.btn-suppr-med');
        btnSuppr.addEventListener('click', () => supprimerMedicamentForm(index));
        
        container.appendChild(div);
    });
    
    cacherMessage();
}

async function enregistrerOrdonnance() {
    const nom = document.getElementById('nom-ordonnance').value.trim();
    
    if (!nom) {
        afficherMessage('Veuillez saisir un nom pour l\'ordonnance.', 'error');
        return;
    }
    
    // Récupérer les médicaments
    const container = document.getElementById('medicaments-container');
    const forms = container.querySelectorAll('.medicament-form');
    const medicaments = [];
    
    for (const form of forms) {
        const medicament = form.querySelector('.input-medicament').value.trim();
        const posologie = form.querySelector('.input-posologie').value.trim();
        const quantite = form.querySelector('.input-quantite').value.trim();
        
        if (!medicament || !posologie || !quantite) {
            afficherMessage('Veuillez remplir tous les champs pour chaque médicament.', 'error');
            return;
        }
        
        medicaments.push({ medicament, posologie, quantite });
    }
    
    if (medicaments.length === 0) {
        afficherMessage('Veuillez ajouter au moins un médicament.', 'error');
        return;
    }
    
    // Supprimer l'ancienne entrée si modification
    if (ordonnanceEnEdition && ordonnanceEnEdition !== nom) {
        delete data[ordonnanceEnEdition];
    }
    
    // Ajouter/Mise à jour
    data[nom] = medicaments;
    
    // Sauvegarder vers JSONBin.io
    await sauvegarderVersFichier(data);
    
    // Afficher
    afficherOrdonnances(data);
    mettreAJourStats();
    
    // Réinitialiser
    nouvelleOrdonnance();
    
    afficherMessage(`Ordonnance "${nom}" enregistrée avec succès !`, 'success');
}

function annulerEdition() {
    nouvelleOrdonnance();
    cacherMessage();
}

async function supprimerOrdonnance(nom) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'ordonnance "${nom}" ?`)) {
        return;
    }
    
    delete data[nom];
    
    // Sauvegarder vers JSONBin.io
    await sauvegarderVersFichier(data);
    
    afficherOrdonnances(data);
    mettreAJourStats();
    
    if (ordonnanceEnEdition === nom) {
        nouvelleOrdonnance();
    }
    
    afficherMessage(`Ordonnance "${nom}" supprimée.`, 'success');
}

// === Export/Import ===
async function exporterOrdonnances() {
    if (Object.keys(data).length === 0) {
        afficherMessage('Aucune ordonnance à exporter.', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    try {
        // Utiliser l'API downloads pour afficher la boîte de dialogue "Enregistrer sous"
        await browser.downloads.download({
            url: url,
            filename: 'ordonnances-types.json',
            saveAs: true  // Affiche la boîte de dialogue
        });
        
        afficherMessage(`${Object.keys(data).length} ordonnance(s) exportée(s).`, 'success');
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        // Fallback sur la méthode standard si l'API n'est pas disponible
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ordonnances-types.json';
        link.click();
        afficherMessage(`${Object.keys(data).length} ordonnance(s) exportée(s).`, 'success');
    }
}

async function importerOrdonnances(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (typeof imported !== 'object' || Array.isArray(imported)) {
                afficherMessage('Format de fichier invalide.', 'error');
                return;
            }
            
            // Demander confirmation pour remplacer ou fusionner
            const action = confirm('Voulez-vous REMPLACER toutes les donnees existantes ?\n\nOK = Remplacer tout\nAnnuler = Fusionner avec les donnees existantes');
            
            if (action) {
                data = imported; // Remplacer
            } else {
                data = { ...data, ...imported }; // Fusionner
            }
            
            // Fusionner
            const nbAjoutes = Object.keys(imported).length;
            
            // Sauvegarder vers JSONBin.io
            await sauvegarderVersFichier(data);
            
            // TELECHARGER le fichier JSON pour remplacer le local
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'ordonnances-types.json';
            link.click();
            URL.revokeObjectURL(url);
            
            afficherOrdonnances(data);
            mettreAJourStats();
            
            if (action) {
                afficherMessage(`${nbAjoutes} ordonnance(s) importee(s) - Fichier telecharge !`, 'success');
            } else {
                afficherMessage(`${nbAjoutes} nouvelle(s) ordonnance(s) ajoutee(s) - Fusion !`, 'success');
            }
            event.target.value = '';
        } catch (error) {
            afficherMessage('Erreur lors de l\'import : ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// === Recherche ===
function filtrerOrdonnances(event) {
    const recherche = event.target.value.toLowerCase();
    const items = document.querySelectorAll('.ordonnance-item');
    
    items.forEach(item => {
        const nom = item.dataset.nom.toLowerCase();
        const visible = nom.includes(recherche);
        item.style.display = visible ? 'block' : 'none';
    });
}

// === Messages ===
function afficherMessage(message, type) {
    const container = document.getElementById('message');
    container.textContent = message;
    container.className = `message ${type}`;
    container.style.display = 'block';
    
    setTimeout(() => {
        container.style.display = 'none';
    }, 5000);
}

function cacherMessage() {
    const container = document.getElementById('message');
    container.style.display = 'none';
}

// === Sauvegarde vers JSONBin.io ===
function showSyncIndicator(message) {
    const indicator = document.getElementById('sync-indicator');
    const msgElement = document.getElementById('sync-message');
    msgElement.innerHTML = message;
    indicator.classList.add('show');
    setTimeout(() => indicator.classList.remove('show'), 5000);
}

async function sauvegarderVersFichier(data) {
    const config = getJSONBinConfig();
    
    // Sauvegarder dans localStorage (pour compatibilité)
    localStorage.setItem('ordonnancesTypes', JSON.stringify(data));
    
    // Sauvegarder sur JSONBin.io
    if (config.apiKey) {
        try {
            await fetch(`https://api.jsonbin.io/v3/b/${config.binId}`, {
                method: 'PUT',
                headers: {
                    'X-Master-Key': config.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.log('JSONBin.io save failed:', e);
        }
    }
    
    // Sauvegarder sur GitHub (si configure)
    if (GITHUB_CONFIG.token && GITHUB_CONFIG.owner && GITHUB_CONFIG.repo) {
        console.log('Sauvegarde GitHub:', GITHUB_CONFIG);
        try {
            const response = await fetch('/api/save-github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: data,
                    message: 'Update ordonnances-types.json via app'
                })
            });
            
            const result = await response.json();
            console.log('GitHub response:', result);
            
            if (result.success) {
                showSyncIndicator('✅ Sauvegarde sur GitHub reussie !');
                afficherMessage('Fichier mis a jour sur GitHub !', 'success');
                return;
            } else {
                console.log('GitHub save failed:', result.message);
            }
        } catch (e) {
            console.log('GitHub save error:', e);
        }
    } else {
        console.log('GitHub non configure - token:', GITHUB_CONFIG.token ? 'OK' : 'MANQUE');
    }
    
    // Fallback: telechargement
    if (config.apiKey) {
        showSyncIndicator('✅ Sauvegarde JSONBin.io reussie !');
        afficherMessage('Ordonnance sauvegardee sur le cloud !', 'success');
    } else {
        showSyncIndicator('💾 Sauvegarde locale effectuee.');
    }
}

// === Actualiser depuis JSONBin.io ===
async function actualiserDepuisJSONBin() {
    try {
        const nouvelleData = await chargerDepuisJSONBin();
        
        if (Object.keys(nouvelleData).length > 0) {
            data = nouvelleData;
            localStorage.setItem('ordonnancesTypes', JSON.stringify(data));
            afficherOrdonnances(data);
            mettreAJourStats();
            
            showSyncIndicator('✅ Donnees actualisees depuis JSONBin.io !');
            afficherMessage('Donnees actualisees depuis le cloud !', 'success');
        } else {
            showSyncIndicator('⚠️Aucune donnee sur JSONBin.io.');
        }
    } catch (error) {
        console.error('Erreur actualisation:', error);
        showSyncIndicator('❌ Erreur lors de l\'actualisation.');
    }
}

// === Telecharger fichier JSON ===
function telechargerFichierJSON() {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ordonnances-types.json';
    link.click();
    URL.revokeObjectURL(url);
    
    showSyncIndicator('📥 Fichier ordonnances-types.json telecharge !');
    afficherMessage('Fichier JSON telecharge !', 'success');
}
