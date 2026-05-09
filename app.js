// CONFIGURAÇÕES GERAIS
const CLIENT_ID = '6732948243450624';
const CLIENT_SECRET = 'PCpL3bQs9wONBknKcKkelwUTmrlh7blv';
const REDIRECT_URI = 'https://carvalho832-glitch.github.io/Radar-pro/';
const PROXY = 'https://cors-anywhere.herokuapp.com/';

const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

// 1. FUNÇÃO PARA SALVAR OS TOKENS NO TELEMÓVEL
function guardarTokens(dados) {
    localStorage.setItem('ml_access_token', dados.access_token);
    localStorage.setItem('ml_refresh_token', dados.refresh_token);
    // Guarda também quando expira (agora + 6 horas)
    const expiraEm = Date.now() + (dados.expires_in * 1000);
    localStorage.setItem('ml_token_expira', expiraEm);
}

// 2. MOTOR DE TROCA: CÓDIGO TG -> ACCESS TOKEN
async function trocarCodigoInicial(code) {
    container.innerHTML = '<h2>A ligar motores... 🚀</h2>';
    try {
        const res = await fetch(PROXY + 'https://api.mercadolibre.com/oauth/token', {
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
        if (dados.access_token) {
            guardarTokens(dados);
            window.history.replaceState({}, document.title, window.location.pathname);
            location.reload(); // Recarrega para ativar a busca
        }
    } catch (e) { console.error("Erro na troca inicial", e); }
}

// 3. MOTOR DE RENOVAÇÃO: USA O REFRESH TOKEN PARA PEGAR UM NOVO ACCESS TOKEN
async function renovarTokenAutomatico() {
    const refreshToken = localStorage.getItem('ml_refresh_token');
    if (!refreshToken) return autorizarNovamente();

    try {
        const res = await fetch(PROXY + 'https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
                'refresh_token': refreshToken
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
            <p>Precisamos de uma autorização inicial para começar.</p>
            <a href="https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}" 
               style="background:#ffe600; padding:15px; border-radius:8px; text-decoration:none; color:black; font-weight:bold;">
               LIGAR RADAR PRO
            </a>
        </div>`;
}

// 4. LÓGICA DE BUSCA
campoBusca.addEventListener('input', (e) => {
    clearTimeout(tempoEspera);
    const busca = e.target.value.trim();
    if (busca.length < 3) return;

    tempoEspera = setTimeout(async () => {
        container.innerHTML = '<p>A pesquisar no Mercado Livre... 📡</p>';
        
        // Verifica se o token expirou antes de buscar
        let token = localStorage.getItem('ml_access_token');
        const expira = localStorage.getItem('ml_token_expira');
        
        if (Date.now() > expira) {
            token = await renovarTokenAutomatico();
        }

        executarBusca(busca, token);
    }, 800);
});

async function executarBusca(query, token) {
    try {
        const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=12`;
        const res = await fetch(PROXY + url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dados = await res.json();
        
        container.innerHTML = '';
        dados.results.forEach(item => {
            const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            container.innerHTML += `
                <div class="card-oferta">
                    <img src="${item.thumbnail.replace('-I.jpg', '-O.jpg')}" class="foto-produto">
                    <div class="detalhes">
                        <h3 style="font-size:0.9rem;">${item.title}</h3>
                        <p style="color:#059669; font-weight:bold;">${preco}</p>
                        <a href="${item.permalink}" target="_blank" class="botao-ir" style="display:block; text-align:center; background:#2563eb; color:white; padding:8px; border-radius:5px; text-decoration:none;">Ver Detalhes</a>
                    </div>
                </div>`;
        });
    } catch (e) {
        container.innerHTML = '<p>Erro na busca. Verifique se o botão do CORS está ativo.</p>';
    }
}

// INÍCIO DE TUDO
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
    trocarCodigoInicial(code);
} else if (!localStorage.getItem('ml_access_token')) {
    autorizarNovamente();
} else {
    container.innerHTML = '<p style="text-align:center; padding:50px;">Radar Pro pronto para buscas! 🚀</p>';
}
