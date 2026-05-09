const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

// ✅ SEU TOKEN OFICIAL ATUALIZADO
const MEU_TOKEN_ML = 'APP_USR-6732948243450624-050823-74760a9f8f4a147bdcc152764760-152764760'; 

campoBusca.addEventListener('input', function(e) {
    clearTimeout(tempoEspera);
    const textoBusca = e.target.value.trim();

    if (textoBusca.length < 3) {
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Aguardando sua busca... 📡</p>';
        return;
    }

    container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; font-weight: bold; color: #2563eb;">Localizando as melhores ofertas... ⏳</p>';

    tempoEspera = setTimeout(() => {
        buscarNoMercadoLivre(textoBusca);
    }, 800);
});

async function buscarNoMercadoLivre(query) {
    try {
        const proxy = 'https://cors-anywhere.herokuapp.com/';
        const urlAPI = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=15`;
        
        const resposta = await fetch(proxy + urlAPI, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${MEU_TOKEN_ML}`,
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });
        
        // Se der erro 403, é sinal que a ponte (proxy) fechou
        if (resposta.status === 403) {
            container.innerHTML = `
                <div style="text-align:center; grid-column: 1/-1; padding: 30px; border: 2px dashed #f87171; border-radius: 10px;">
                    <p style="color: #dc2626; font-weight: bold;">⚠️ Acesso Temporário Expirou</p>
                    <p style="font-size: 0.9rem; color: #666;">Clique no botão abaixo para reativar o Radar por mais 24h:</p>
                    <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" 
                       style="display:inline-block; margin-top:10px; padding:10px 20px; background:#2563eb; color:white; border-radius:5px; text-decoration:none; font-weight:bold;">
                       REATIVAR PONTE 🚀
                    </a>
                    <p style="font-size: 0.7rem; color: #999; margin-top:10px;">(Após clicar e ativar no site, volte aqui e pesquise de novo)</p>
                </div>`;
            return;
        }

        if (!resposta.ok) {
            throw new Error(`Erro na API: ${resposta.status}`);
        }

        const dados = await resposta.json();

        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Nenhum produto encontrado. Tente outro termo! 😕</p>';
            return;
        }

        container.innerHTML = ''; 

        dados.results.forEach(item => {
            const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            let foto = item.thumbnail.replace('-I.jpg', '-O.jpg'); // Melhora a qualidade da imagem

            const cardHTML = `
                <div class="card-oferta">
                    <span class="badge-meli">M. Livre</span>
                    <img src="${foto}" alt="${item.title}" class="foto-produto">
                    <div class="detalhes">
                        <h3 class="titulo-produto">${item.title}</h3>
                        <p class="preco-atual">${preco}</p>
                        <a href="${item.permalink}" target="_blank" class="botao-ir">Ver Oferta</a>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

    } catch (erro) {
        console.error(erro);
        container.innerHTML = `
            <div style="text-align:center; grid-column: 1/-1; padding: 50px; color: #dc2626;">
                <b>Erro de Conexão:</b><br>
                O servidor está demorando a responder. Tente pesquisar novamente em instantes.
            </div>`;
    }
}

// Estado Inicial
container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666; font-size: 1.1rem;">Radar Pro 100% Configurado! 🚀</p>';
