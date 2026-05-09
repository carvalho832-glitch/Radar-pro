const CLIENT_ID = '6732948243450624';
const CLIENT_SECRET = 'PCpL3bQs9wONBknKcLkelwUTmrIh7bIv'; 
const REDIRECT_URI = 'https://carvalho832-glitch.github.io/Radar-pro/';

const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

// 1. LIMPEZA INICIAL: Remove registros bugados para evitar o erro de Sessão Expirada
const tk = localStorage.getItem('ml_access_token');
if (!tk || tk === 'undefined' || tk === 'null' || tk.length < 5) {
    localStorage.clear();
}

function guardarTokens(dados) {
    if (dados && dados.access_token) {
        localStorage.setItem('ml_access_token', dados.access_token);
        localStorage.setItem('ml_refresh_token', dados.refresh_token);
        const expiraEm = Date.now() + (dados.expires_in * 1000);
        localStorage.setItem('ml_token_expira', expiraEm);
        return true;
    }
    return false;
}

// 2. TROCA DO CÓDIGO (Após o login/facial)
async function trocarCodigoInicial(code) {
    container.innerHTML = '<div style="text-align:center; padding:50px;"><h2>Autenticando... 🚀</h2><p>Sincronizando com o Mercado Livre.</p></div>';
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
        
        if (guardarTokens(dados)) {
            // Limpa a URL e recarrega para ativar o modo de busca
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => { location.reload(); }, 300);
        } else {
            throw new Error();
        }
    } catch (e) {
        localStorage.clear();
        autorizarNovamente("Falha na conexão. Tente novamente.");
    }
}

// 3. RENOVAÇÃO AUTOMÁTICA (Mantém você logado)
async function renovarTokenAutomatico() {
    const refresh = localStorage.getItem('ml_refresh_token');
    if (!refresh || refresh === 'undefined') return null;
    try {
        const res = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'client_id': CLIENT_ID.trim(),
                'client_secret': CLIENT_SECRET.trim(),
                'refresh_token': refresh.trim()
            })
        });
        const dados = await res.json();
        if (guardarTokens(dados)) return dados.access_token;
    } catch (e) { return null; }
}

function autorizarNovamente(msg = "Sessão expirada.") {
    container.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <p style="color:red; font-weight:bold; margin-bottom:15px;">${msg}</p>
            <a href="https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}" 
               style="display:inline-block; background:#ffe600; padding:15px 30px; border-radius:10px; text-decoration:none; color:black; font-weight:bold; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
               CONECTAR RADAR PRO
            </a>
        </div>`;
}

// 4. LÓGICA DE PESQUISA
campoBusca.addEventListener('input', (e) => {
    clearTimeout(tempoEspera);
    const busca = e.target.value.trim();
    if (busca.length < 3) return;
    
    tempoEspera = setTimeout(async () => {
        container.innerHTML = '<p style="text-align:center; padding:50px; color:#2563eb; font-weight:bold;">Buscando ofertas... 📡</p>';
        let token = localStorage.getItem('ml_access_token');
        const expira = localStorage.getItem('ml_token_expira');
        
        // Se o token expirou ou não existe, renova
        if (!token || Date.now() > expira) {
            token = await renovarTokenAutomatico();
        }
        
        if (token) {
            executarBusca(busca, token);
        } else {
            autorizarNovamente();
        }
    }, 1000);
});

async function executarBusca(query, token) {
    // Usamos AllOrigins como ponte estável para evitar erros de bloqueio (CORS)
    const apiURL = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=24`;
    const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiURL)}`;

    try {
        const res = await fetch(proxyURL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dados = await res.json();
        
        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:50px; color:#666;">Nenhum produto encontrado para sua busca. 🔍</p>';
            return;
        }

        container.innerHTML = ''; // Limpa o carregando
        dados.results.forEach(item => {
            const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const foto = item.thumbnail.replace('-I.jpg', '-J.jpg'); // Foto de melhor qualidade

            container.innerHTML += `
                <div class="card-oferta" style="border: 1px solid #eee; border-radius: 12px; padding: 12px; margin-bottom: 15px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    <img src="${foto}" style="width:100%; height:160px; object-fit:contain; border-radius:8px;">
                    <h3 style="font-size:0.85rem; color:#333; height:40px; overflow:hidden; margin: 10px 0; line-height:1.2;">${item.title}</h3>
                    <p style="color:#059669; font-weight:bold; font-size:1.2rem;">${preco}</p>
                    <a href="${item.permalink}" target="_blank" style="display:block; text-align:center; background:#2563eb; color:white; padding:10px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:10px;">Ver Oferta</a>
                </div>`;
        });
    } catch (e) {
        container.innerHTML = '<p style="text-align:center; padding:50px;">Ocorreu um erro na busca. Tente pesquisar novamente.</p>';
    }
}

// 5. INICIALIZAÇÃO
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
    trocarCodigoInicial(code);
} else if (!localStorage.getItem('ml_access_token')) {
    autorizarNovamente();
} else {
    container.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <p style="color:#059669; font-weight:bold; font-size:1.3rem;">Radar Pro Online! 🚀</p>
            <p style="color:#666; margin-top:10px;">O que você quer buscar hoje?</p>
            <hr style="margin: 30px 0; border:0; border-top:1px solid #eee;">
            <button onclick="localStorage.clear(); location.reload();" style="background:none; border:none; color:#999; text-decoration:underline; font-size:0.75rem; cursor:pointer;">Reiniciar Conexão</button>
        </div>`;
}
