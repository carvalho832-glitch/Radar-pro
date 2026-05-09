const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
    document.body.innerHTML = '<h2 style="padding: 50px; text-align: center; color: #2563eb;">Gerando seu Token Oficial... ⏳</h2>';
    
    fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: new URLSearchParams({
            'grant_type': 'authorization_code',
            'client_id': '6732948243450624',
            'client_secret': 'PCpL3bQs9wONBknKcKkelwUTmrlh7blv',
            'code': code,
            'redirect_uri': 'https://carvalho832-glitch.github.io/Radar-pro/'
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.access_token) {
            document.body.innerHTML = `
                <div style="padding: 30px; text-align: center; font-family: sans-serif;">
                    <h2 style="color: #059669;">✅ Token Gerado com Sucesso!</h2>
                    <p style="color: #666; margin-bottom: 20px;">Copie todo o texto verde abaixo:</p>
                    <div style="word-break: break-all; background: #ecfdf5; padding: 20px; border: 2px dashed #059669; border-radius: 10px; font-weight: bold; font-size: 1.1rem; color: #065f46;">
                        ${data.access_token}
                    </div>
                </div>`;
        } else {
            document.body.innerHTML = `<h2 style="color: red; padding: 30px;">Erro: ${data.message}</h2>`;
        }
    })
    .catch(err => alert("Erro: " + err));
} else {
    document.body.innerHTML = `
        <div style="padding: 50px; text-align: center; font-family: sans-serif;">
            <h2 style="color: #333;">Pegar Token Oficial</h2>
            <p style="color: #666; margin-bottom: 30px;">Clique no botão abaixo para autorizar e gerar sua chave VIP.</p>
            <a href="https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=6732948243450624&redirect_uri=https://carvalho832-glitch.github.io/Radar-pro/" 
               style="display: inline-block; padding: 15px 30px; background: #ffe600; color: #333; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1.1rem;">
               Autorizar no Mercado Livre
            </a>
        </div>
    `;
}
