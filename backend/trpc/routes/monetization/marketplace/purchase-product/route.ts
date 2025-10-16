import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';

export const purchaseProductProcedure = protectedProcedure
  .input(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      userId: z.string(),
      paymentMethodId: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('Monetization.purchaseProduct', input);

    return {
      success: true,
      orderId: `order_${Date.now()}`,
      estimatedDeliveryDays: 3,
    } as const;
  });
