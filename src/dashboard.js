// ...existing code...
function updateDashboard(userId) {
    // ...existing code...
    fetchDashboardData(userId).then(data => {
        if (data) {
            renderDashboard(data);
        } else {
            displayMessage("Erro ao atualizar o dashboard.");
        }
    }).catch(error => {
        console.error("Erro ao buscar dados do dashboard:", error);
        displayMessage("Erro ao atualizar o dashboard.");
    });
    // ...existing code...
}
