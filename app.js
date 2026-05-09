const CLIENT_ID = '6732948243450624';
const CLIENT_SECRET = 'PCpL3bQs9wONBknKcKkelwUTmrlh7blv';
const REDIRECT_URI = 'https://carvalho832-glitch.github.io/Radar-pro/';
const PROXY = 'https://cors-anywhere.herokuapp.com/';

const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

// Limpeza de emergência: se o token estiver bugado, ele limpa a memória sozinho
if (localStorage.getItem('ml_access_token') === 'undefined') {
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
            location.reload(); 
        } else {
            localStorage.clear();
            autorizarNovamente(`Código expirado. Motivo: ${dados.message}`);
        }
    } catch (e) { 
        autorizarNovamente("Erro ao conectar no ML."); 
    }
}

async function renovarTokenAutomatico() {
    const refreshToken = localStorage.getItem('ml_refresh_token');
    if (!refreshToken || refreshToken === 'undefined') {
        localStorage.clear();
        return autorizarNovamente();
    }

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
        } else {
            throw new Error();
        }
    } catch (e) { 
        localStorage.clear();
        return autorizarNovamente(); 
    }
}

function autorizarNovamente(mensagemErro = "") {
    container.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <p style="color: red; font-weight: bold;">${mensagemErro}</p>
            <p>Precisamos de uma autorização para começar.</p>
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
        container.innerHTML = '<p style="text-align:center; padding:50px;">Buscando ofertas reais... ⏳</p>';
        
        let token = localStorage.getItem('ml_access_token');
        const expira = localStorage.getItem('ml_token_expira');
        
        if (!token || token === 'undefined' || Date.now() > expira) {
            token = await renovarTokenAutomatico();
        }

        if(token) executarBusca(busca, token);
    }, 800);
});

async function executarBusca(query, token) {
    try {
        const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=12`;
        const res = await fetch(PROXY + url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const dados = await res.json();
        
        // Se o token for inválido, limpa tudo e pede auth de novo
        if (res.status === 401 || dados.message === 'invalid_token') {
            localStorage.clear();
            autorizarNovamente("Token expirado. Por favor, autorize novamente.");
            return;
        }

        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:50px;">Nenhum produto encontrado. 😕</p>';
            return;
        }

        container.innerHTML = '';
        dados.results.forEach(item => {
            const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            container.innerHTML += `
                <div class="card-oferta">
                    <img src="${item.thumbnail.replace('-I.jpg', '-O.jpg')}" class="foto-produto">
                    <div class="detalhes">
                        <h3 style="font-size:0.9rem; margin-bottom:5px;">${item.title}</h3>
                        <p style="color:#059669; font-weight:bold; font-size:1.2rem;">${preco}</p>
                        <a href="${item.permalink}" target="_blank" style="display:block; text-align:center; background:#2563eb; color:white; padding:8px; border-radius:5px; text-decoration:none; margin-top:10px;">Ver Oferta</a>
                    </div>
                </div>`;
        });
    } catch (e) {
        container.innerHTML = `<div style="text-align:center; padding:50px; color:red;">
            <b>Erro Real de Conexão:</b><br>${e.message}
            <br><br>Se for erro de CORS, clique no botão da Ponte Herokuapp.
        </div>`;
    }
}

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
    trocarCodigoInicial(code);
} else if (!localStorage.getItem('ml_access_token') || localStorage.getItem('ml_access_token') === 'undefined') {
    autorizarNovamente();
} else {
    container.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <p>Radar Pro conectado! 🚀</p>
            <p style="font-size: 0.8rem; color: #999; margin-top: 20px; cursor: pointer;" onclick="localStorage.clear(); location.reload();">🔄 Resetar Sistema</p>
        </div>`;
}
