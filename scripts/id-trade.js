// Función para cargar los detalles del trade
const loadTradeDetails = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tradeName = decodeURIComponent(urlParams.get("name"));
    const tradeId = urlParams.get("id");
    const tradeDetails = document.getElementById("trade-details");

    if (!tradeName || !tradeId) {
        tradeDetails.innerHTML = `
            <div class="error-message">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Error: Parámetros inválidos en la URL</p>
            </div>`;
        return;
    }

    try {
        // Obtener datos del trade desde Supabase
        const tradeResponse = await fetch(
            `https://hlfeovqorgnzkeuuqvti.supabase.co/rest/v1/trades?id=eq.${tradeId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    apikey:
                        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsZmVvdnFvcmduemtldXVxdnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNTM0NDMsImV4cCI6MjA1MzgyOTQ0M30.8nmLJ191I6eJIkdhFCwMTq4wFFPDvmeHa9ZuFjPpR2g",
                },
            }
        );

        if (!tradeResponse.ok) {
            throw new Error(`Error HTTP: ${tradeResponse.status}`);
        }

        const [trade] = await tradeResponse.json();

        if (!trade) {
            throw new Error("Trade no encontrado");
        }

        // Función para formatear la fecha
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleString();
        };

        // Función para renderizar los ítems del trade
        const renderTradeItems = (items) => {
            if (!items || items.length === 0) return "<p>No hay elementos</p>";
            return items
                .map(
                    (card) => `
    <div class="trade-item">
        <img src="${card.imagen}" alt="${card.nombre}"
            onerror="this.src='assets/placeholder-pokemon.png'">
            <span>${card.nombre}</span>
    </div>
    `
                )
                .join("");
        };

        // Construir el HTML del trade
        tradeDetails.innerHTML = `
    <div class="trade-card">
        <small>${formatDate(trade.fecha)}</small>
        <div class="trade-header">
            <span>Intercambio - ${trade.trade_name}</span>
        </div>
        <div class="trade-user-info">
            <span>Iniciado por: ${trade.usuario.nick}</span>
            <span>
                ID: ${trade.usuario.id}
                <button class="copy-id-button" data-id="${trade.usuario.id}">
                    <i class="fas fa-copy"></i>
                </button>
            </span>
        </div>
        <div class="trade-columns">
            <div class="trade-offer">
                <h3><i class="fas fa-gift"></i> Ofrezco (${trade.oferta?.length || 0
            })</h3>
                <ul>${renderTradeItems(trade.oferta)}</ul>
            </div>
            <div class="trade-want">
                <h3><i class="fas fa-search"></i> Busco (${trade.busqueda?.length || 0
            })</h3>
                <ul>${renderTradeItems(trade.busqueda)}</ul>
            </div>
        </div>
        <div class="trade-status ${trade.estado.toLowerCase()}">
            ${trade.estado.toUpperCase()}
        </div>
        ${trade.estado === "pendiente"
                ? `
                  <div class="trade-complete-button-container">
                    <button class="trade-complete-button" data-id="${trade.id}">
                      Aceptar Trade
                    </button>
                    <button class="trade-rejected-button" data-id="${trade.id}">
                      Rechazar Trade
                    </button>
                  </div>`
                : ""
            }
        ${trade.estado === "aceptado"
                ? `
                  <div class="trade-complete-button-container">
                    <button class="open-app-button">
                      Abrir TCG Pocket
                    </button>
                  </div>`
                : ""
            }
    </div>
    `;

        // Asignar eventos de copiado
        document.addEventListener("click", (event) => {
            if (event.target.closest(".copy-id-button")) {
                const button = event.target.closest(".copy-id-button");
                const id = button.getAttribute("data-id");
                navigator.clipboard.writeText(id)
                    .then(() => alert("ID copiado: " + id))
                    .catch((err) => console.error("Error al copiar:", err));
            }
        });

        // Asignar eventos a los botones de acción
        if (trade.estado === "pendiente") {
            document
                .querySelector(".trade-complete-button")
                .addEventListener("click", () => {
                    updateTradeStatus("aceptado", trade.id);
                });

            document
                .querySelector(".trade-rejected-button")
                .addEventListener("click", () => {
                    updateTradeStatus("rechazado", trade.id);
                });
        } else if (trade.estado === "aceptado") {
            document
                .querySelector(".open-app-button")
                .addEventListener("click", openTCGPApp);
        }
    } catch (error) {
        console.error("Error:", error);
        tradeDetails.innerHTML = `
    <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${error.message}</p>
    </div>`;
    }
};

//Abrir app
const openTCGPApp = () => {
    // URL Scheme de tu app (debes reemplazarlo con el de tu aplicación)
    const appScheme = {
        android:
            "intent://pokemontcg/#Intent;package=jp.pokemon.pokemontcgp;scheme=pokemontcg;end",
        ios: "pokemontcglive://",
    };

    // URLs de las tiendas oficiales
    const storeUrls = {
        android:
            "https://play.google.com/store/apps/details?id=jp.pokemon.pokemontcgp",
        ios: "https://apps.apple.com/app/id1512323690", // ID real de Pokémon TCG Live en App Store
    };

    // Detectar plataforma
    const isAndroid = /android/i.test(navigator.userAgent);
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    // Intentar abrir la app
    const openAttempt = () => {
        if (isAndroid) {
            window.location = appScheme.android;
        } else if (isiOS) {
            window.location = appScheme.ios;
            // Método alternativo para iOS
            window.setTimeout(() => {
                window.location = storeUrls.ios;
            }, 2000);
        } else {
            window.location = storeUrls.android; // Fallback para otros dispositivos
        }
    };

    // Verificar si la app se abrió
    let appOpened = false;
    window.addEventListener("blur", () => {
        appOpened = true;
    });

    // Ejecutar intento de apertura
    openAttempt();

    // Redirigir a store si la app no está instalada
    setTimeout(() => {
        if (!appOpened) {
            window.location = isiOS ? storeUrls.ios : storeUrls.android;
        }
    }, 2000);
};
// Función para actualizar el estado del trade
const updateTradeStatus = async (newStatus, tradeId) => {
    try {
        const response = await fetch(
            `https://hlfeovqorgnzkeuuqvti.supabase.co/rest/v1/trades?id=eq.${tradeId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    apikey:
                        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsZmVvdnFvcmduemtldXVxdnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNTM0NDMsImV4cCI6MjA1MzgyOTQ0M30.8nmLJ191I6eJIkdhFCwMTq4wFFPDvmeHa9ZuFjPpR2g",
                },
                body: JSON.stringify({
                    estado: newStatus,
                    //fecha_actualizacion: new Date().toISOString(),
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error en la actualización");
        }

        // Actualizar el estado en la UI sin recargar
        document.querySelector(".trade-status").textContent = newStatus.toUpperCase();
        document.querySelector(".trade-status").className = `trade-status ${newStatus.toLowerCase()}`;

        // Ocultar botones si el trade fue aceptado o rechazado
        document.querySelector(".trade-complete-button-container").innerHTML = `<button class="open-app-button">
                      Abrir TCG Pocket
                    </button>`;
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert(`Error: ${error.message}`);
    }
};

// Inicializar la carga de los detalles
document.addEventListener("DOMContentLoaded", loadTradeDetails);
