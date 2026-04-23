const menuData = [
    {
        id: 'mie-ori',
        name: 'Mie Ayam Original',
        price: 12000,
        description: 'Mie kenyal dengan topping ayam berbumbu, daun bawang, dan kuah gurih.',
        image: '/assets/img/menu-ori.webp',
        category: 'mie-ayam'
    },
    {
        id: 'mie-pangsit',
        name: 'Mie Ayam Pangsit',
        price: 14000,
        description: 'Mie ayam lezat ditambah pangsit kering yang gurih dan renyah.',
        image: '/assets/img/menu-pangsit.webp',
        category: 'mie-ayam'
    },
    {
        id: 'mie-ceker',
        name: 'Mie Ayam Ceker',
        price: 14000,
        description: 'Mie ayam dengan tambahan ceker empuk yang bumbunya meresap.',
        image: '/assets/img/menu-ceker.webp',
        category: 'mie-ayam'
    },
    {
        id: 'mie-balungan',
        name: 'Mie Ayam Balungan',
        price: 14000,
        description: 'Sensasi makan mie ayam dengan balungan yang gurih dan nikmat.',
        image: '/assets/img/menu-balungan.webp',
        category: 'mie-ayam'
    },
    {
        id: 'es-jeruk',
        name: 'Es Jeruk',
        price: 5000,
        description: 'Perasan jeruk segar asli dengan tambahan es batu yang menyegarkan.',
        image: '/assets/img/menu-es-jeruk.png',
        category: 'minuman'
    },
    {
        id: 'es-teh',
        name: 'Es Teh Manis',
        price: 3000,
        description: 'Teh pilihan yang diseduh sempurna, manis, dan menyegarkan.',
        image: '/assets/img/menu-es-teh.png',
        category: 'minuman'
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = menuData;
} else {
    window.menuData = menuData;
}
