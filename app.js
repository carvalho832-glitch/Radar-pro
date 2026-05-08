// Dados simulados para o Radar Pro
const ofertas = [
    { 
        loja: "Amazon", 
        badgeClass: "badge-amazon", 
        titulo: "Echo Dot 5ª Geração com Alexa", 
        imagem: "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=500&q=80", 
        precoAtual: "R$ 284,05",
        link: "https://www.amazon.com.br" 
    },
    { 
        loja: "Shopee", 
        badgeClass: "badge-shopee", 
        titulo: "Miniatura Hot Wheels BMW 2002", 
        imagem: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80", 
        precoAtual: "R$ 19,90",
        link: "https://shopee.com.br"
    },
    { 
        loja: "M. Livre", 
        badgeClass: "badge-meli", 
        titulo: "Red Dead Redemption 2 - Xbox One", 
        imagem: "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&w=500&q=80", 
        precoAtual: "R$ 89,90",
        link: "https://www.mercadolivre.com.br"
    }
];

let filtrosAtivos = [];

function carregarOfertas() {
    const container = document.getElementById('lista-ofertas');
    const textoBusca = document.getElementById('campo-busca').value.toLowerCase();
    
    container.innerHTML = '';

    const filtradas = ofertas.filter(o => {
        const bateTexto = o.titulo.toLowerCase().includes(textoBusca);
        const bateFiltro = filtrosAtivos.length === 0 || filtrosAtivos.includes(o.loja);
        return bateTexto && bateFiltro;
    });

    if (filtradas.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 50px;">Nenhuma oferta encontrada.</p>';
        return;
    }

    filtradas.forEach(o => {
        container.innerHTML += `
            <div class="card-oferta">
                <span class="badge ${o.badgeClass}">${o.loja}</span>
                <img src="${o.imagem}" class="foto-produto">
                <div class="detalhes">
                    <h3 class="titulo-produto">${o.titulo}</h3>
                    <p class="preco-atual">${o.precoAtual}</p>
                    <a href="${o.link}" target="_blank" class="botao-ir">Acessar Oferta</a>
                </div>
            </div>`;
    });
}

// Configuração dos balõezinhos de filtro
document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const loja = btn.getAttribute('data-loja');
        
        if (filtrosAtivos.includes(loja)) {
            filtrosAtivos = filtrosAtivos.filter(f => f !== loja);
            btn.classList.remove('ativo');
        } else {
            filtrosAtivos.push(loja);
            btn.classList.add('ativo');
        }
        carregarOfertas();
    });
});

// Escuta a barra de busca
document.getElementById('campo-busca').addEventListener('input', carregarOfertas);

// Inicializa a tela
carregarOfertas();
