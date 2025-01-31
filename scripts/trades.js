document.addEventListener('DOMContentLoaded', () => {
    // Función para copiar el ID al portapapeles
    const loadTrades = async () => {
        try {
            const tradeResponse = await fetch(`https://hlfeovqorgnzkeuuqvti.supabase.co/rest/v1/trades?select=*`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsZmVvdnFvcmduemtldXVxdnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNTM0NDMsImV4cCI6MjA1MzgyOTQ0M30.8nmLJ191I6eJIkdhFCwMTq4wFFPDvmeHa9ZuFjPpR2g"
                }
            });
            const trades = await tradeResponse.json();
            const tradesList = document.getElementById('tradesList');
            // Ordenar los trades por fecha (más recientes primero)
            // trades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            if (trades.length === 0) {
                tradesList.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-info-circle"></i>
                        <p>No hay intercambios disponibles en este momento</p>
                    </div>
                `;
                return;
            }

            // 4. Generar el HTML dinámico
            tradesList.innerHTML = trades
                .reverse()
                .filter(trade => trade.oferta.length > 0 || trade.busqueda.length > 0) // Filtra trades donde oferta y busqueda no están vacíos
                .map(trade => `
            <div class="trade-card">
            <small>${formatDate(trade.fecha)}</small>
                <div class="trade-header">
                    <span>Identificador:${trade.trade_name}</span>
                </div>
                
                <div class="trade-user-info">
                    <span>Usuario: ${trade.usuario.nick}</span>
                    <span>
                        ID: ${trade.usuario.id}
                        <button class="copy-id-button" data-id="${trade.usuario.id}">
                            <i class="fas fa-copy"></i>
                        </button>
                    </span>
                </div>
                
                <div class="trade-columns">
                    <div class="trade-offer">
                        <h3>
                            <i class="fas fa-gift"></i>
                            Ofrezco (${trade.oferta.length})
                        </h3>
                        ${renderTradeItems(trade.oferta)}
                    </div>
                    
                    <div class="trade-want">
                        <h3>
                            <i class="fas fa-search"></i>
                            Busco (${trade.busqueda.length})
                        </h3>
                        ${renderTradeItems(trade.busqueda)}
                    </div>
                </div>
                
                <div class="trade-status ${trade.estado.toLowerCase()}">
                    ${trade.estado.toUpperCase()}
                </div>
                ${trade.estado === 'pendiente'
                        ?
                        `
                    <div class="trade-complete-button-container">
                        <button class="trade-complete-button"
                        data-id="${trade.id}"
                        data-trade-name="${trade.trade_name}">
                            Compartir
                        </button >
                </div>`: ""
                    }
            </div>
        `).join('');

        } catch (error) {
            console.error('Error al cargar intercambios:', error);
            tradesList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar los intercambios: ${error.message}</p>
            </div>`;
        }
    };

    const renderTradeItems = (items) => {
        // Asegurar que items sea siempre un array
        const itemsArray = Array.isArray(items) ? items : Object.values(items);

        return itemsArray.map(item => `
        <div class="trade-item">
            <img src="${item.imagen}" alt="${item.nombre}" 
                 onerror="this.src='assets/placeholder-pokemon.png'">
            <span>${item.nombre}</span>
        </div>
    `).join('');

    };

    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    // Inicializar la carga de intercambios
    loadTrades();
});

// Agregar evento de clic a los botones de completar trade
document.addEventListener('click', (event) => {
    if (event.target.closest('.trade-complete-button')) {
        const button = event.target.closest('.trade-complete-button');
        const tradeId = button.getAttribute('data-id');
        const tradeName = button.getAttribute('data-trade-name'); // Capturar nombre

        if (!tradeId || tradeId === "undefined") {
            alert('Error: ID no válido');
            return;
        }
        // // Codificar el nombre para URL (ej: espacios → %20)
        // const encodedTradeName = encodeURIComponent(tradeName);
        // // Enviar ambos parámetros
        // window.location.href = `id-trade.html?id=${tradeId}&name=${encodedTradeName}`;
        if (!tradeId || tradeId === "undefined") {
            alert('Error: ID no válido');
            return;
        }

        // Crear o mostrar sección de compartir
        const encodedTradeName = encodeURIComponent(tradeName);
        const shareUrl = `https://tradepocket.vercel.app/id-trade.html?id=${tradeId}&name=${encodedTradeName}`;

        console.log(shareUrl);

        // Crear elementos dinámicamente
        const shareSection = document.createElement('div');
        shareSection.className = 'share-overlay';
        shareSection.innerHTML = `
            <div class="share-container">
                <div class="share-header">
                    <h3>📤 Compartir Trade</h3>
                    <button class="close-share">&times;</button>
                </div>
                <p>¡Comparte este enlace con tu compañero de intercambio!</p>
                <div class="trade-complete-button-container">
                    <a class= "span-link" href="${shareUrl}">traderpocket.share.${tradeName}</a> 
                    <button class="copy-share-button" data-id="${shareUrl}">
                            <i class="fas fa-copy"></i>
                        </button>
                </div>
                <small class="share-note">El enlace expirará en 24 horas</small>
            </div>
        `;

        // Añadir al body
        document.body.appendChild(shareSection);
        // Evento para cerrar
        shareSection.querySelector('.close-share').addEventListener('click', () => {
            document.body.removeChild(shareSection);
        });

    }
});
// Agregar evento de clic a los botones de copiar
document.addEventListener('click', (event) => {
    if (event.target.closest('.copy-id-button')) {
        const button = event.target.closest('.copy-id-button');
        const id = button.getAttribute('data-id');
        copyToClipboard(id, "ID copiado con exito");
    } else if (event.target.closest('.copy-share-button')) {
        const button = event.target.closest('.copy-share-button');
        const id = button.getAttribute('data-id');
        copyToClipboard(id, "Enlace copiado con exito");
    }
});
const copyToClipboard = (text, alertText) => {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert(alertText);
        })
        .catch((error) => {
            console.error('Error al copiar el ID:', error);
            alert('Error al copiar el ID');
        });
};