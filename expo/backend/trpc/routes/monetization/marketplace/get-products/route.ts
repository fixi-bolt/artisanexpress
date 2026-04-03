import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';

export const getProductsProcedure = protectedProcedure
  .input(
    z.object({
      category: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    }).optional()
  )
  .query(async ({ input }) => {
    console.log('Monetization.getProducts', input);

    const allProducts = [
      {
        id: 'prod_toolkit_001',
        title: 'Kit de réparation plomberie',
        description: 'Kit complet avec clés, joints et téflon',
        price: 39.9,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1200&auto=format&fit=crop',
        category: 'tools',
        stock: 25,
      },
      {
        id: 'prod_paint_002',
        title: 'Peinture intérieure premium 2L',
        description: 'Peinture acrylique blanche mate',
        price: 24.5,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=1200&auto=format&fit=crop',
        category: 'materials',
        stock: 100,
      },
      {
        id: 'prod_drill_003',
        title: 'Perceuse électrique 18V',
        description: 'Perceuse sans fil avec batterie',
        price: 89.99,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1200&auto=format&fit=crop',
        category: 'tools',
        stock: 15,
      },
      {
        id: 'prod_ladder_004',
        title: 'Échelle télescopique 3m',
        description: 'Échelle aluminium pliable',
        price: 119.0,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1200&auto=format&fit=crop',
        category: 'tools',
        stock: 8,
      },
      {
        id: 'prod_tiles_005',
        title: 'Carrelage céramique 1m²',
        description: 'Carrelage blanc brillant',
        price: 34.5,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?q=80&w=1200&auto=format&fit=crop',
        category: 'materials',
        stock: 50,
      },
      {
        id: 'prod_screws_006',
        title: 'Coffret visserie 200 pièces',
        description: 'Vis et chevilles assortis',
        price: 15.9,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?q=80&w=1200&auto=format&fit=crop',
        category: 'materials',
        stock: 75,
      },
    ];

    if (input?.category) {
      return allProducts.filter(p => p.category === input.category).slice(0, input.limit);
    }
    
    return allProducts.slice(0, input?.limit || 20);
  });
