export const categories = [
  {
    id: 1,
    name: 'Soins du Corps',
    slug: 'soins-du-corps',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop',
    description: 'Produits naturels pour prendre soin de votre corps',
    subcategories: [
      {
        id: 11,
        name: 'Savons Naturels',
        slug: 'savons-naturels',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop',
        description: 'Savons artisanaux et naturels'
      },
      {
        id: 12,
        name: 'Huiles Essentielles',
        slug: 'huiles-essentielles',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=300&fit=crop',
        description: 'Huiles essentielles pures et naturelles'
      },
      {
        id: 13,
        name: 'Crèmes Hydratantes',
        slug: 'cremes-hydratantes',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop',
        description: 'Crèmes nourrissantes pour la peau'
      }
    ]
  },
  {
    id: 2,
    name: 'Bien-être',
    slug: 'bien-etre',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=300&fit=crop',
    description: 'Produits pour votre équilibre et votre santé',
    subcategories: [
      {
        id: 21,
        name: 'Thés & Infusions',
        slug: 'thes-infusions',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop',
        description: 'Thés bio et infusions relaxantes'
      },
      {
        id: 22,
        name: 'Compléments Alimentaires',
        slug: 'complements-alimentaires',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=300&fit=crop',
        description: 'Vitamines et minéraux naturels'
      }
    ]
  },
  {
    id: 3,
    name: 'Maison & Décoration',
    slug: 'maison-decoration',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop',
    description: 'Objets décoratifs et produits ménagers écologiques',
    subcategories: [
      {
        id: 31,
        name: 'Bougies Parfumées',
        slug: 'bougies-parfumees',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=300&fit=crop',
        description: 'Bougies artisanales aux senteurs naturelles'
      },
      {
        id: 32,
        name: 'Produits Ménagers',
        slug: 'produits-menagers',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop',
        description: 'Nettoyants écologiques et naturels'
      }
    ]
  }
];

export const products = [
  {
    id: 1,
    name: 'Savon Noir Artisanal',
    description: 'Savon noir traditionnel fabriqué à la main avec des ingrédients 100% naturels. Idéal pour tous types de peau.',
    price: 8.50,
    categoryId: 11,
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'
    ],
    variants: [
      { id: 1, name: '500g', price: 8.50, stock: 15 },
      { id: 2, name: '1kg', price: 15.00, stock: 8 },
      { id: 3, name: '2kg', price: 28.00, stock: 5 }
    ],
    rating: 4.8,
    reviews: 127,
    isPopular: true
  },
  {
    id: 2,
    name: 'Huile Essentielle de Lavande',
    description: 'Huile essentielle de lavande pure et naturelle, parfaite pour la relaxation et le sommeil.',
    price: 12.90,
    categoryId: 12,
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'
    ],
    variants: [
      { id: 4, name: '10ml', price: 12.90, stock: 25 },
      { id: 5, name: '30ml', price: 32.00, stock: 18 },
      { id: 6, name: '100ml', price: 95.00, stock: 12 }
    ],
    rating: 4.9,
    reviews: 89,
    isPopular: true
  },
  {
    id: 3,
    name: 'Crème Hydratante Bio',
    description: 'Crème hydratante bio enrichie en aloe vera et huile d\'argan pour une peau douce et hydratée.',
    price: 18.50,
    categoryId: 13,
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop'
    ],
    variants: [
      { id: 7, name: '50ml', price: 18.50, stock: 30 },
      { id: 8, name: '100ml', price: 32.00, stock: 22 }
    ],
    rating: 4.7,
    reviews: 156,
    isPopular: false
  },
  {
    id: 4,
    name: 'Thé Vert Bio Relaxant',
    description: 'Mélange de thé vert bio avec des herbes relaxantes pour un moment de détente parfait.',
    price: 9.90,
    categoryId: 21,
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'
    ],
    variants: [
      { id: 9, name: '20 sachets', price: 9.90, stock: 45 },
      { id: 10, name: '50 sachets', price: 22.00, stock: 28 }
    ],
    rating: 4.6,
    reviews: 203,
    isPopular: true
  },
  {
    id: 5,
    name: 'Bougie Parfumée Vanille',
    description: 'Bougie artisanale parfumée à la vanille naturelle, parfaite pour créer une ambiance chaleureuse.',
    price: 24.90,
    categoryId: 31,
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop'
    ],
    variants: [
      { id: 11, name: 'Petite (150g)', price: 24.90, stock: 20 },
      { id: 12, name: 'Grande (300g)', price: 44.00, stock: 15 }
    ],
    rating: 4.8,
    reviews: 94,
    isPopular: false
  }
];

export const popularProducts = products.filter(product => product.isPopular);
