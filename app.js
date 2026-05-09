const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

// ✅ SEU MOTOR TURBO ESTÁ LIGADO!
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
        // Buscando no site do Brasil (MLB) com o seu acesso VIP
        const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=15`;
        
        const resposta = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MEU_TOKEN_ML}`
            }
        });
        
        if (!resposta.ok) {
            throw new Error(`Erro na conexão: ${resposta.status}`);
        }

        const dados = await resposta.json();

        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Nenhum produto encontrado. Tente outro termo! 😕</p>';
            return;
        }

        container.innerHTML = ''; 

        dados.results.forEach(item => {
            const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            // Melhorando a qualidade da imagem (trocando thumbnail por imagem maior)
            let foto = item.thumbnail.replace('-I.jpg', '-O.jpg');

            const cardHTML = `
                <div class="card-oferta">
                    <span class="badge-meli">M. Livre</span>
                    <img src="${foto}" alt="${item.title}" class="foto-produto">
                    <div class="detalhes">
                        <h3 class="titulo-produto">${item.title}</h3>
                        <p class="preco-atual">${preco}</p>
                        <a href="${item.permalink}" target="_blank" class="botao-ir">Ver no App</a>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

    } catch (erro) {
        container.innerHTML = `<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #dc2626;"><b>Erro no Radar:</b> ${erro.message}</p>`;
    }
}

// Mensagem de boas-vindas
container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666; font-size: 1.1rem;">Radar Pro Ativo! Digite um produto acima para começar. 🚀</p>';
