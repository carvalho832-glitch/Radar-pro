// Removemos os dados estáticos. Agora é tudo ao vivo!

const container = document.getElementById('lista-ofertas');
const campoBusca = document.getElementById('campo-busca');

// Variável para controlar o tempo de digitação (Debounce)
let tempoEspera;

// Escuta o que você digita na barra
campoBusca.addEventListener('input', function(e) {
    // Cancela a busca anterior se você ainda estiver digitando
    clearTimeout(tempoEspera);
    
    const textoBusca = e.target.value.trim();

    if (textoBusca.length < 3) {
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Digite pelo menos 3 letras para iniciar o Radar... 📡</p>';
        return;
    }

    container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; font-weight: bold; color: #2563eb;">Buscando as melhores ofertas no Mercado Livre... ⏳</p>';

    // Espera 800 milissegundos após você parar de digitar para buscar na API
    tempoEspera = setTimeout(() => {
        buscarNoMercadoLivre(textoBusca);
    }, 800);
});

// A função mágica que conecta com os servidores do Mercado Livre
async function buscarNoMercadoLivre(query) {
    try {
        // Chama a API pública do ML (MLB = Mercado Livre Brasil)
        const resposta = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${query}&limit=12`);
        const dados = await resposta.json();

        if (dados.results.length === 0) {
            container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666;">Nenhuma oferta encontrada para esta busca. 😕</p>';
            return;
        }

        container.innerHTML = ''; // Limpa a mensagem de carregamento

        // Para cada produto encontrado, cria um Card
        dados.results.forEach(produto => {
            // Formata o preço para o padrão Brasileiro (R$)
            const precoFormatado = produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            // O ML manda uma foto pequena (thumbnail). Esse truque troca o final do link para pegar a foto em Alta Resolução
            const imagemAltaRes = produto.thumbnail.replace('-I.jpg', '-O.jpg');

            const cardHTML = `
                <div class="card-oferta">
                    <span class="badge badge-meli">M. Livre</span>
                    <img src="${imagemAltaRes}" alt="${produto.title}" class="foto-produto">
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
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: red;">Erro ao conectar com a loja. Tente novamente.</p>';
        console.error("Erro no Radar Pro:", erro);
    }
}

// Quando o app abre, mostra uma mensagem de boas-vindas
container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px; color: #666; font-size: 1.1rem;">Digite o que você procura acima para ativar o Radar! 🚀<br><br><small>Buscando diretamente nos servidores do Mercado Livre.</small></p>';

// Botões de filtro (Apenas visual por enquanto, até configurarmos Amazon e Shopee)
document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('ativo');
    });
});
