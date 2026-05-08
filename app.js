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
        // Criando a URL da API do ML
        const urlML = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=12`;
        
        // Usando a "Ponte" (Proxy) para driblar o bloqueio 403 de segurança do Mercado Livre
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlML)}`;
        
        const resposta = await fetch(proxyUrl);
        
        if (!resposta.ok) {
            throw new Error(`Falha na ponte de conexão (Erro ${resposta.status})`);
        }

        // O Proxy devolve os dados empacotados, precisamos desempacotar (JSON.parse)
        const dadosProxy = await resposta.json();
        const dados = JSON.parse(dadosProxy.contents);

        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Nenhuma oferta encontrada para esta busca. 😕</p>';
            return;
        }

        container.innerHTML = ''; 

        dados.results.forEach(produto => {
            const precoFormatado = produto.price 
                ? produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                : 'Preço Indisponível';
            
            // Tratamento de imagem para puxar em alta resolução (tira o -I e bota -O)
            let imagem = produto.thumbnail || 'https://via.placeholder.com/200?text=Sem+Foto';
            imagem = imagem.replace('-I.jpg', '-O.jpg');

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
        container.innerHTML = `<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: red;"><b>Erro detalhado:</b> ${erro.message}</p>`;
    }
}

container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666; font-size: 1.1rem;">Digite o que você procura acima para ativar o Radar! 🚀</p>';

document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('ativo');
    });
});
