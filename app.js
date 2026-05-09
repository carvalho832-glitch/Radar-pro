const CLIENT_ID = '6732948243450624';
const CLIENT_SECRET = 'PCpL3bQs9wONBknKcLkelwUTmrIh7bIv'; 
const REDIRECT_URI = 'https://carvalho832-glitch.github.io/Radar-pro/';
// Mudamos para um proxy que não exige ativação manual
const PROXY = 'https://api.allorigins.win/raw?url=';

const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

if (localStorage.getItem('ml_access_token') === 'undefined' || localStorage.getItem('ml_access_token') === 'null') {
    localStorage.clear();
}

function guardarTokens(dados) {
    if(dados.access_token) {
        localStorage.setItem('ml_access_token', dados.access_token);
        localStorage.setItem('ml_refresh_token', dados.refresh_token);
        const expiraEm = Date.now() + (dados.expires_in * 1000);
        localStorage.setItem('ml_token_expira', expiraEm);
    }
}

async function trocarCodigoInicial(code) {
    container.innerHTML = '<h2 style="text-align:center; padding: 50px;">A ligar motores... 🚀</h2>';
    try {
        const res = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                'grant_type': 'authorization_code',
                'client_id': CLIENT_ID.trim(),
                'client_secret': CLIENT_SECRET.trim(),
                'code': code.trim(),
                'redirect_uri': REDIRECT_URI.trim()
            })
        });
        const dados = await res.json();
        if (dados.access_token) {
            guardarTokens(dados);
            window.history.replaceState({}, document.title, window.location.pathname);
            location.reload(); 
        }
    } catch (e) { autorizarNovamente("Erro na ativação."); }
}

async function renovarTokenAutomatico() {
    const refreshToken = localStorage.getItem('ml_refresh_token');
    if (!refreshToken) return autorizarNovamente();
    try {
        const res = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'client_id': CLIENT_ID.trim(),
                'client_secret': CLIENT_SECRET.trim(),
                'refresh_token': refreshToken.trim()
            })
        });
        const dados = await res.json();
        if (dados.access_token) {
            guardarTokens(dados);
            return dados.access_token;
        }
    } catch (e) { return autorizarNovamente(); }
}

function autorizarNovamente() {
    container.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <p>Conexão necessária para buscar ofertas.</p>
            <a href="https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}" 
               style="display:inline-block; margin-top:20px; background:#ffe600; padding:15px 30px; border-radius:8px; text-decoration:none; color:black; font-weight:bold;">
               LIGAR RADAR PRO
            </a>
        </div>`;
}

campoBusca.addEventListener('input', (e) => {
    clearTimeout(tempoEspera);
    const busca = e.target.value.trim();
    if (busca.length < 3) return;
    tempoEspera = setTimeout(async () => {
        container.innerHTML = '<p style="text-align:center; padding:50px;">Buscando ofertas... ⏳</p>';
        let token = localStorage.getItem('ml_access_token');
        const expira = localStorage.getItem('ml_token_expira');
        if (!token || Date.now() > expira) token = await renovarTokenAutomatico();
        if(token) executarBusca(busca, token);
    }, 800);
});

async function executarBusca(query, token) {
    try {
        const urlFinal = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=15`;
        // Usamos o AllOrigins para evitar o bloqueio de segurança (CORS)
        const res = await fetch(PROXY + encodeURIComponent(urlFinal), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const dados = await res.json();
        
        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:50px;">Nenhum produto encontrado. 🤔</p>';
            return;
        }

        container.innerHTML = '';
        dados.results.forEach(item => {
            const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            container.innerHTML += `
                <div class="card-oferta" style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; margin-bottom: 15px; background: white;">
                    <img src="${item.thumbnail.replace('-I.jpg', '-J.jpg')}" style="width:100%; height:150px; object-fit:contain;">
                    <h3 style="font-size:0.9rem; height:40px; overflow:hidden;">${item.title}</h3>
                    <p style="color:#059669; font-weight:bold; font-size:1.2rem;">${preco}</p>
                    <a href="${item.permalink}" target="_blank" style="display:block; text-align:center; background:#2563eb; color:white; padding:8px; border-radius:5px; text-decoration:none;">Ver Oferta</a>
                </div>`;
        });
    } catch (e) {
        container.innerHTML = '<p style="text-align:center; padding:50px; color:red;">Erro ao carregar dados. Tente pesquisar novamente.</p>';
    }
}

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
if (code) trocarCodigoInicial(code);
else if (!localStorage.getItem('ml_access_token')) autorizarNovamente();
else container.innerHTML = '<p style="text-align:center; padding:50px;">Radar Pro pronto! 🚀</p>';
