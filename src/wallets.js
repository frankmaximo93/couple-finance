// ...existing code...
function updateWallets(userId) {
    // ...existing code...
    fetchWalletData(userId).then(data => {
        if (data) {
            renderWallets(data);
        } else {
            displayMessage("Erro ao atualizar as carteiras.");
        }
    }).catch(error => {
        console.error("Erro ao buscar dados das carteiras:", error);
        displayMessage("Erro ao atualizar as carteiras.");
    });
    // ...existing code...
}
