const CLIENT_ID = '6732948243450624';
const CLIENT_SECRET = 'PCpL3bQs9wONBknKcLkelwUTmrIh7bIv'; 
const REDIRECT_URI = 'https://carvalho832-glitch.github.io/Radar-pro/';

const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

function guardarTokens(dados) {
    if (dados && dados.access_token) {
        localStorage.setItem('ml_access_token', dados.access_token);
        localStorage.setItem('ml_refresh_token', dados.refresh_token);
        localStorage.setItem('ml_token_expira', Date.now() + (dados.expires_in * 1000));
        return true;
    }
    return false;
}

async function trocarCodigoInicial(code) {
    container.innerHTML = '<h2>Conectando... 🚀</h2>';
    try {
        const res = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                'grant_type': 'authorization_code',
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
                'code': code,
                'redirect_uri': REDIRECT_URI
            })
        });
        const dados = await res.json();
        if (guardarTokens(dados)) {
            window.history.replaceState({}, document.title, window.location.pathname);
            location.reload();
        }
    } catch (e) { autorizarNovamente("Erro na ativação."); }
}

function autorizarNovamente(msg = "") {
    container.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <p style="color:red;">${msg}</p>
            <a href="https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}" 
               style="background:#ffe600; padding:15px; border-radius:10px; text-decoration:none; color:black; font-weight:bold;">
               CONECTAR RADAR
            </a>
        </div>`;
}

campoBusca.addEventListener('input', (e) => {
    clearTimeout(tempoEspera);
    const busca = e.target.value.trim();
    if (busca.length < 3) return;
    
    tempoEspera = setTimeout(() => {
        container.innerHTML = '<p>Buscando... ⏳</p>';
        const token = localStorage.getItem('ml_access_token');
        if (token) executarBusca(busca, token);
        else autorizarNovamente();
    }, 1000);
});

async function executarBusca(query, token) {
    // Usamos uma URL de busca mais simples para evitar erros
    const apiURL = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=10`;
    
    try {
        // Tentativa de busca usando AllOrigins
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(apiURL)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const dados = await res.json();

        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = `<p>Nenhum resultado para "${query}". Tente um termo simples como "Fone".</p>`;
            return;
        }

        container.innerHTML = ''; 
        dados.results.forEach(item => {
            const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            container.innerHTML += `
                <div style="border:1px solid #eee; padding:10px; margin-bottom:10px; background:white; border-radius:8px;">
                    <img src="${item.thumbnail}" style="width:80px; float:left; margin-right:10px;">
                    <h3 style="font-size:0.8rem;">${item.title}</h3>
                    <p style="color:green; font-weight:bold;">${preco}</p>
                    <a href="${item.permalink}" target="_blank" style="font-size:0.7rem;">Ver no ML</a>
                    <div style="clear:both;"></div>
                </div>`;
        });
    } catch (e) {
        container.innerHTML = `<p style="color:red;">Erro de busca. Tente recarregar a página.</p>`;
    }
}

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
if (code) trocarCodigoInicial(code);
else if (!localStorage.getItem('ml_access_token')) autorizarNovamente();
else container.innerHTML = '<p>Pronto para buscar! 🔍</p>';
