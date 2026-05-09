const CLIENT_ID = '6732948243450624';
const CLIENT_SECRET = 'PCpL3bQs9wONBknKcLkelwUTmrIh7bIv'; 
const REDIRECT_URI = 'https://carvalho832-glitch.github.io/Radar-pro/';
const PROXY = 'https://cors-anywhere.herokuapp.com/';

const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

// Limpeza de segurança
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
            headers: { 
                'accept': 'application/json',
                'content-type': 'application/x-www-form-urlencoded' 
            },
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
        } else {
            localStorage.clear();
            const erroReal = dados.error_description || dados.message || "Erro desconhecido";
            autorizarNovamente(`Falha na Senha/ID: ${erroReal}`);
        }
    } catch (e) { 
        autorizarNovamente(`Erro de conexão local: ${e.message}`); 
    }
}

async function renovarTokenAutomatico() {
    const refreshToken = localStorage.getItem('ml_refresh_token');
    if (!refreshToken || refreshToken === 'undefined') {
        localStorage.clear();
        return autorizarNovamente();
    }

    try {
        const res = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: { 
                'accept': 'application/json',
                'content-type': 'application/x-www-form-urlencoded' 
            },
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
            <p style="color: red; font-weight: bold; margin-bottom: 15px;">${mensagemErro}</p>
            <p style="color: #333;">Precisamos de uma autorização para começar.</p>
            <a href="https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID.trim()}&redirect_uri=${REDIRECT_URI.trim()}" 
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
        container.innerHTML = '<p style="text-align:center; padding:50px; color:#2563eb; font-weight:bold;">Buscando ofertas reais... ⏳</p>';
        
        let token = localStorage.getItem('ml_access_token');
        const expira = localStorage.getItem('ml_token_expira');
        
        if (!token || token === 'undefined' || Date.now() > expira) {
            token = await renovarTokenAutomatico();
        }

        if(token) executarBusca(busca, token);
    }, 800);
});

// MOTOR DE BUSCA TURBINADO
async function executarBusca(query, token) {
    try {
        const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=15`;
        const res = await fetch(PROXY + url, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const dados = await res.json();
        
        if (res.status === 401 || dados.message === 'invalid_token') {
            localStorage.clear();
            autorizarNovamente("Token expirado. Por favor, autorize novamente.");
            return;
        }

        // Verifica se deu erro na API
        if (dados.error) {
            container.innerHTML = `<p style="text-align:center; padding:50px; color:red;"><b>Erro na busca:</b> ${dados.message}</p>`;
            return;
        }

        // Verifica se a lista veio vazia
        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:50px; color:#666;">
                    <p>Nenhuma oferta encontrada para "<b>${query}</b>". 😕</p>
                    <p style="font-size:0.8rem; margin-top:10px;">Tente pesquisar algo mais genérico, como "Celular" ou "Fralda".</p>
                </div>`;
            return;
        }

        container.innerHTML = ''; // Limpa a mensagem de carregando
        
        dados.results.forEach(item => {
            const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            // Troca a miniatura por uma imagem maior (J.jpg ou O.jpg)
            let foto = item.thumbnail.replace('-I.jpg', '-J.jpg'); 

            container.innerHTML += `
                <div class="card-oferta" style="position:relative; border: 1px solid #ddd; border-radius: 8px; padding: 10px; margin-bottom: 15px; background: white;">
                    <span style="background:#ffe600; color:black; padding:3px 8px; font-size:0.75rem; font-weight:bold; border-radius:4px; position:absolute; top:10px; left:10px; z-index:1;">M. Livre</span>
                    <img src="${foto}" style="width:100%; height:180px; object-fit:contain; border-radius:5px; margin-bottom:10px;">
                    <div class="detalhes">
                        <h3 style="font-size:0.95rem; color:#333; height:40px; overflow:hidden; margin-bottom:5px;">${item.title}</h3>
                        <p style="color:#059669; font-weight:bold; font-size:1.3rem; margin-bottom:10px;">${preco}</p>
                        <a href="${item.permalink}" target="_blank" style="display:block; text-align:center; background:#2563eb; color:white; padding:10px; border-radius:6px; text-decoration:none; font-weight:bold;">Ver Oferta</a>
                    </div>
                </div>`;
        });
    } catch (e) {
        container.innerHTML = `<div style="text-align:center; padding:50px; color:red;">
            <b>Atenção:</b> A ponte de conexão fechou.<br>
            <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">O Mercado Livre bloqueou a conexão. Precisamos abrir a ponte (CORS) novamente.</p>
            <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" style="display:inline-block; margin-top:15px; padding:12px; background:#dc2626; color:white; border-radius:5px; text-decoration:none; font-weight:bold;">Liberar Acesso (CORS)</a>
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
            <p style="color:#059669; font-weight:bold; font-size:1.2rem;">Radar Pro conectado! 🚀</p>
            <p style="font-size: 0.8rem; color: #999; margin-top: 20px; cursor: pointer; text-decoration:underline;" onclick="localStorage.clear(); location.reload();">Desconectar / Resetar</p>
        </div>`;
}
