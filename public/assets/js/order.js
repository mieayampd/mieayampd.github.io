function formatWhatsAppMessage(items, note) {
    let message = "Halo Mie Ayam Pak Dul, saya ingin memesan:\n\n";
    let total = 0;

    items.forEach(item => {
        if (item.quantity > 0) {
            let itemNote = item.note ? ` (Catatan: ${item.note})` : "";
            message += `- ${item.quantity}x ${item.name}${itemNote}\n`;
            total += item.price * item.quantity;
        }
    });

    if (note) {
        message += `\nCatatan: ${note}\n`;
    }

    message += `\nTerima kasih!`;
    return encodeURIComponent(message);
}

function redirectToWhatsApp(items, note) {
    const phoneNumber = "6288808620330";
    const encodedMessage = formatWhatsAppMessage(items, note);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
}

window.orderUtils = {
    redirectToWhatsApp,
    formatWhatsAppMessage
};
