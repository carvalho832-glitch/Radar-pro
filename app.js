const CLIENT_ID = '6732948243450624';
const CLIENT_SECRET = 'PCpL3bQs9wONBknKcLkelwUTmrIh7bIv'; 
const REDIRECT_URI = 'https://carvalho832-glitch.github.io/Radar-pro/';

const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

// 1. MOTOR DE BUSCA DIRETA (Usa a API pública para máxima velocidade)
async function executarBusca(query) {
    // Buscamos produtos com desconto e frete grátis, igual à página inicial do ML
    const apiURL = `https://api.mercadolivre.com/sites/MLB/search?q=${encodeURIComponent(query)}&sort=relevance&limit=15`;
    
    // Usamos um proxy que funciona como um "túnel" simples e rápido
    const proxyURL = `https://api.allorigins.win/get?url=${encodeURIComponent(apiURL)}`;

    try {
        const response = await fetch(proxyURL);
        const json = await response.json();
        const dados = JSON.parse(json.contents); // Decodifica o conteúdo vindo da ponte

        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:50px;">Nenhum produto encontrado. 🤔</p>';
            return;
        }

        container.innerHTML = ''; 
        dados.results.forEach(item => {
            const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const foto = item.thumbnail.replace('-I.jpg', '-J.jpg'); // Melhora a qualidade da imagem
            const temDesconto = item.original_price && item.original_price > item.price;

            container.innerHTML += `
                <div class="card-oferta" style="border: 1px solid #eee; border-radius: 12px; padding: 12px; margin-bottom: 15px; background: white; position:relative; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    ${temDesconto ? '<span style="background:#ff4444; color:white; padding:2px 6px; font-size:0.7rem; border-radius:4px; position:absolute; top:10px; right:10px; font-weight:bold;">OFERTA</span>' : ''}
                    <img src="${foto}" style="width:100%; height:150px; object-fit:contain; border-radius:8px;">
                    <h3 style="font-size:0.85rem; color:#333; height:38px; overflow:hidden; margin:10px 0; line-height:1.2;">${item.title}</h3>
                    <p style="color:#059669; font-weight:bold; font-size:1.2rem; margin:0;">${preco}</p>
                    ${item.shipping.free_shipping ? '<p style="color:#00a650; font-size:0.7rem; font-weight:bold; margin-bottom:10px;">Frete Grátis</p>' : '<div style="margin-bottom:10px;"></div>'}
                    <a href="${item.permalink}" target="_blank" style="display:block; text-align:center; background:#2563eb; color:white; padding:10px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:0.85rem;">Ver Oferta</a>
                </div>`;
        });
    } catch (e) {
        container.innerHTML = '<p style="text-align:center; padding:50px;">Erro ao carregar ofertas. Verifique sua conexão.</p>';
    }
}

// 2. LOGICA DA BARRA DE BUSCA
campoBusca.addEventListener('input', (e) => {
    clearTimeout(tempoEspera);
    const busca = e.target.value.trim();
    if (busca.length < 3) return;
    
    tempoEspera = setTimeout(() => {
        container.innerHTML = '<p style="text-align:center; padding:50px; color:#2563eb;">Buscando melhores preços... ⏳</p>';
        executarBusca(busca);
    }, 800);
});

// 3. SISTEMA DE LOGIN (Opcional, mas mantido para futuras funções de afiliado)
async function trocarCodigoInicial(code) {
    container.innerHTML = '<h2 style="text-align:center; padding: 50px;">Conectando... 🚀</h2>';
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
        if (dados.access_token) {
            localStorage.setItem('ml_access_token', dados.access_token);
            window.history.replaceState({}, document.title, window.location.pathname);
            location.reload();
        }
    } catch (e) { console.error("Erro no login"); }
}

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
if (code) {
    trocarCodigoInicial(code);
} else {
    container.innerHTML = '<p style="text-align:center; padding:50px; color:#999;">Radar Pro Ativo! Pesquise acima. 🔍</p>';
}
