function linkAccounts(userId, accountData) {
    // ...existing code...
    if (linkedAccounts.length === 0) {
        displayMessage("Nenhuma conta vinculada encontrada. Vá para a página de Vincular Contas para compartilhar dados financeiros.");
    } else {
        displayMessage("Contas vinculadas com sucesso.");
    }
    // ...existing code...
}
