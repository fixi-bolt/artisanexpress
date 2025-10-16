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

    return [
      {
        id: 'prod_toolkit_001',
        title: 'Kit de réparation plomberie',
        price: 39.9,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2dfd5898f375?q=80&w=1200&auto=format&fit=crop',
        category: 'tools',
        stock: 25,
      },
      {
        id: 'prod_paint_002',
        title: 'Peinture intérieure premium 2L',
        price: 24.5,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop',
        category: 'materials',
        stock: 100,
      },
    ];
  });
