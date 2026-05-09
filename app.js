const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');
let tempoEspera;

// ✅ Seu Token (Lembre-se: ele dura 6 horas, se parar de funcionar, precisa gerar um novo TG)
const MEU_TOKEN_ML = 'APP_USR-6732948243450624-050823-74760a9f8f4a147bdcc152764760-152764760'; 

campoBusca.addEventListener('input', function(e) {
    clearTimeout(tempoEspera);
    const textoBusca = e.target.value.trim();

    if (textoBusca.length < 3) {
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Digite o que procura... 📡</p>';
        return;
    }

    container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; font-weight: bold; color: #2563eb;">Buscando resultados reais... ⏳</p>';

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
            headers: {
                'Authorization': `Bearer ${MEU_TOKEN_ML}`,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!resposta.ok) {
            throw new Error(`Erro ${resposta.status}: Verifique se o Token ainda é válido.`);
        }

        const dados = await resposta.json();

        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Nenhum produto encontrado. 😕</p>';
            return;
        }

        container.innerHTML = ''; 

        dados.results.forEach(item => {
            const preco = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            let foto = item.thumbnail.replace('-I.jpg', '-O.jpg'); 

            const cardHTML = `
                <div class="card-oferta">
                    <span class="badge-meli">M. Livre</span>
                    <img src="${foto}" alt="${item.title}" class="foto-produto">
                    <div class="detalhes">
                        <h3 class="titulo-produto" style="font-size: 0.9rem; margin-bottom: 5px;">${item.title}</h3>
                        <p class="preco-atual" style="color: #059669; font-size: 1.2rem; font-weight: bold;">${preco}</p>
                        <a href="${item.permalink}" target="_blank" style="display: block; text-align: center; background: #2563eb; color: white; padding: 10px; border-radius: 5px; text-decoration: none; margin-top: 10px;">Ver Detalhes</a>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

    } catch (erro) {
        container.innerHTML = `
            <div style="text-align:center; grid-column: 1/-1; padding: 30px; color: #dc2626;">
                <b>Erro de Conexão:</b><br>
                ${erro.message}<br><br>
                <small>Dica: Verifique se o acesso em <i>cors-anywhere.herokuapp.com/corsdemo</i> ainda está ativo.</small>
            </div>`;
    }
}

container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Radar Pro: Busca Simples Ativada! 🚀</p>';
