const CLIENT_ID = '6732948243450624';
const CLIENT_SECRET = 'PCpL3bQs9wONBknKcLkelwUTmrIh7bIv'; 
const REDIRECT_URI = 'https://carvalho832-glitch.github.io/Radar-pro/';

const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

function guardarTokens(dados) {
    if(dados.access_token) {
        localStorage.setItem('ml_access_token', dados.access_token);
        localStorage.setItem('ml_refresh_token', dados.refresh_token);
        const expiraEm = Date.now() + (dados.expires_in * 1000);
        localStorage.setItem('ml_token_expira', expiraEm);
    }
}

async function renovarTokenAutomatico() {
    const refreshToken = localStorage.getItem('ml_refresh_token');
    if (!refreshToken) return autorizarNovamente();
    try {
        const res = await fetch('https://api.mercadolivre.com/oauth/token', {
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

async function trocarCodigoInicial(code) {
    container.innerHTML = '<h2 style="text-align:center; padding: 50px;">Sincronizando... 🚀</h2>';
    try {
        const res = await fetch('https://api.mercadolivre.com/oauth/token', {
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
    } catch (e) { autorizarNovamente(); }
}

function autorizarNovamente() {
    container.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <p>Sessão expirada.</p>
            <a href="https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}" 
               style="display:inline-block; margin-top:20px; background:#ffe600; padding:15px 30px; border-radius:8px; text-decoration:none; color:black; font-weight:bold;">
               CONECTAR RADAR
            </a>
        </div>`;
}

campoBusca.addEventListener('input', (e) => {
    clearTimeout(tempoEspera);
    const busca = e.target.value.trim();
    if (busca.length < 3) return;
    
    tempoEspera = setTimeout(async () => {
        container.innerHTML = '<p style="text-align:center; padding:50px; color:#2563eb;">Buscando ofertas... 📡</p>';
        let token = localStorage.getItem('ml_access_token');
        const expira = localStorage.getItem('ml_token_expira');
        if (!token || Date.now() > expira) token = await renovarTokenAutomatico();
        if(token) executarBusca(busca, token);
    }, 1000);
});

async function executarBusca(query, token) {
    // TENTATIVA 1: Busca Direta (Mais rápida e sem intermediários)
    const targetUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=20`;
    
    try {
        const res = await fetch(targetUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const dados = await res.json();
        renderizarProdutos(dados);

    } catch (e) {
        // TENTATIVA 2: Se a direta falhar (CORS), usamos o proxy reserva
        console.warn("Busca direta bloqueada. Tentando via Proxy Reserva...");
        try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            const resProxy = await fetch(proxyUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dadosProxy = await resProxy.json();
            renderizarProdutos(dadosProxy);
        } catch (err) {
            container.innerHTML = '<p style="text-align:center; padding:50px;">Erro ao carregar dados. Verifique sua conexão.</p>';
        }
    }
}

function renderizarProdutos(dados) {
    if (!dados.results || dados.results.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:50px;">Nenhum produto encontrado.</p>';
        return;
    }

    container.innerHTML = '';
    dados.results.forEach(item => {
        const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const imgUrl = item.thumbnail.replace('-I.jpg', '-J.jpg');

        container.innerHTML += `
            <div class="card-oferta" style="border: 1px solid #eee; border-radius: 12px; padding: 12px; margin-bottom: 15px; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <img src="${imgUrl}" style="width:100%; height:160px; object-fit:contain; border-radius: 8px;">
                <div style="margin-top:10px;">
                    <h3 style="font-size:0.85rem; color:#333; height:38px; overflow:hidden;">${item.title}</h3>
                    <p style="color:#059669; font-weight:bold; font-size:1.1rem; margin: 8px 0;">${preco}</p>
                    <a href="${item.permalink}" target="_blank" style="display:block; text-align:center; background:#2563eb; color:white; padding:10px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:0.85rem;">Ver Oferta</a>
                </div>
            </div>`;
    });
}

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
if (code) trocarCodigoInicial(code);
else if (!localStorage.getItem('ml_access_token')) autorizarNovamente();
else container.innerHTML = '<p style="text-align:center; padding:50px; color:#999;">Digite sua busca... 🔍</p>';
