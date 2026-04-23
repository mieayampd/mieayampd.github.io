let cart = JSON.parse(localStorage.getItem('mieayam_cart')) || [];

function saveCart() {
    localStorage.setItem('mieayam_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId) {
    const item = window.menuData.find(p => p.id === productId);
    const existing = cart.find(c => c.id === productId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1, note: '' });
    }
    saveCart();
}

function updateNote(productId, note) {
    const item = cart.find(c => c.id === productId);
    if (item) {
        item.note = note;
        saveCart();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(c => c.id !== productId);
    saveCart();
}

function updateQuantity(productId, delta) {
    const item = cart.find(c => c.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
        }
    }
}

function clearCart() {
    cart = [];
    saveCart();
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const cartItems = document.getElementById('cart-items');

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (cartCount) cartCount.textContent = totalCount;
    if (cartTotal) cartTotal.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;

    const noteOptions = [
        { value: '', label: 'Tanpa Catatan' },
        { value: 'Mienya dipisah', label: 'Mienya dipisah' },
        { value: 'Tanpa Sawi', label: 'Tanpa Sawi' },
        { value: 'Tanpa Daun Bawang', label: 'Tanpa Daun Bawang' },
        { value: 'Ekstra Sambal', label: 'Ekstra Sambal' },
        { value: 'Kuah sedikit', label: 'Kuah sedikit' }
    ];

    if (cartItems) {
        cartItems.innerHTML = cart.length === 0 
            ? '<p class="text-stone-500 text-center py-8">Keranjang kosong</p>'
            : cart.map(item => `
                <div class="flex flex-col py-4 border-b border-stone-100 gap-3">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-bold text-sm">${item.name}</h4>
                            <p class="text-xs text-stone-500">Rp ${item.price.toLocaleString('id-ID')}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="updateQuantity('${item.id}', -1)" class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-stone-200">-</button>
                            <span class="font-mono font-bold">${item.quantity}</span>
                            <button onclick="updateQuantity('${item.id}', 1)" class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-stone-200">+</button>
                        </div>
                    </div>
                    <select onchange="cartUtils.updateNote('${item.id}', this.value)" class="w-full px-3 py-2 rounded-lg border border-stone-200 text-xs outline-none focus:border-amber-500 transition-all">
                        ${noteOptions.map(opt => `<option value="${opt.value}" ${item.note === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
            `).join('');
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
        checkoutBtn.classList.toggle('opacity-50', cart.length === 0);
    }
}

window.cartUtils = {
    addToCart,
    removeFromCart,
    updateQuantity,
    updateNote,
    clearCart,
    updateCartUI,
    getCart: () => cart
};

document.addEventListener('DOMContentLoaded', updateCartUI);
