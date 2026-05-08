const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');

let tempoEspera;

campoBusca.addEventListener('input', function(e) {
    clearTimeout(tempoEspera);
    const textoBusca = e.target.value.trim();

    if (textoBusca.length < 3) {
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Digite pelo menos 3 letras para iniciar o Radar... 📡</p>';
        return;
    }

    container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; font-weight: bold; color: #2563eb;">Buscando as melhores ofertas no Mercado Livre... ⏳</p>';

    tempoEspera = setTimeout(() => {
        buscarNoMercadoLivre(textoBusca);
    }, 800);
});

async function buscarNoMercadoLivre(query) {
    try {
        // Proteção 1: Encode garante que espaços (ex: Samsung S23) não quebrem o link
        const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=12`;
        const resposta = await fetch(url);
        
        // Verifica se o Mercado Livre recusou a conexão
        if (!resposta.ok) {
            throw new Error(`Servidor respondeu com erro ${resposta.status}`);
        }

        const dados = await resposta.json();

        // Verifica se a lista veio vazia
        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Nenhuma oferta encontrada para esta busca. 😕</p>';
            return;
        }

        container.innerHTML = ''; 

        dados.results.forEach(produto => {
            // Proteção 2: Se o produto não tiver preço definido
            const precoFormatado = produto.price 
                ? produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                : 'Preço Indisponível';
            
            // Proteção 3: Se o produto vier sem foto, não deixa quebrar, usa a imagem original
            const imagem = produto.thumbnail || 'https://via.placeholder.com/200?text=Sem+Foto';

            const cardHTML = `
                <div class="card-oferta">
                    <span class="badge badge-meli">M. Livre</span>
                    <img src="${imagem}" alt="${produto.title}" class="foto-produto">
                    <div class="detalhes">
                        <h3 class="titulo-produto">${produto.title}</h3>
                        <p class="preco-atual">${precoFormatado}</p>
                        <a href="${produto.permalink}" target="_blank" class="botao-ir">Acessar Oferta</a>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

    } catch (erro) {
        // Agora ele vai mostrar na tela o motivo REAL do erro para investigarmos
        container.innerHTML = `<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: red;"><b>Erro detalhado:</b> ${erro.message}</p>`;
    }
}

container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666; font-size: 1.1rem;">Digite o que você procura acima para ativar o Radar! 🚀</p>';

document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('ativo');
    });
});
