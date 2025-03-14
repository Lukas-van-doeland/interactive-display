// Tijdsinterval in milliseconden (bijvoorbeeld 5 seconden)
const timeInterval = 10000;

// Functie om de huidige pagina naar de volgende animatie te navigeren
function switchAnimation() {
    // Hier geef je de volgende animatiepagina's op
    const nextPage = [
        'fallingLeaf.html',
        'fish.html',
        'paint.html',
        'rain.html',
        'sand.html',
    ];

    // Haal de huidige pagina-index op en bepaal de volgende
    const currentPageIndex = nextPage.indexOf(window.location.pathname.split('/').pop());
    const nextPageIndex = (currentPageIndex + 1) % nextPage.length;

    // Navigeer naar de volgende animatie
    window.location.href = nextPage[nextPageIndex];
}

// Start de overgang na een bepaalde tijd
setInterval(switchAnimation, timeInterval);
