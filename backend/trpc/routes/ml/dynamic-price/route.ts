import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

interface DemandData {
  level: 'low' | 'medium' | 'high';
  surgeMultiplier: number;
}

export const dynamicPriceProcedure = protectedProcedure
  .input(
    z.object({
      basePrice: z.number(),
      category: z.string(),
      distance: z.number(),
      urgency: z.enum(['low', 'medium', 'high']),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
    })
  )
  .query(async ({ input }) => {
    console.log("[ML] Calculating dynamic price with input:", input);

    const demandData = await getDemandData(input.location, input.category);
    
    const currentHour = new Date().getHours();
    const timeOfDay = input.timeOfDay || getTimeOfDay(currentHour);
    
    const distanceFee = calculateDistanceFee(input.distance);
    const urgencyMultiplier = getUrgencyMultiplier(input.urgency);
    const timeMultiplier = getTimeMultiplier(timeOfDay);
    const surgeMultiplier = demandData.surgeMultiplier;

    const categoryBaseAdjustment = getCategoryAdjustment(input.category);

    const subtotal = (input.basePrice + categoryBaseAdjustment) * urgencyMultiplier * timeMultiplier;
    const totalBeforeSurge = subtotal + distanceFee;
    const finalPrice = totalBeforeSurge * surgeMultiplier;

    const rounded = Math.round(finalPrice);

    console.log("[ML] Price calculation:", {
      basePrice: input.basePrice,
      categoryBaseAdjustment,
      distanceFee,
      urgencyMultiplier,
      timeMultiplier,
      surgeMultiplier,
      finalPrice: rounded,
    });

    return {
      total: rounded,
      currency: 'EUR',
      breakdown: {
        base: input.basePrice,
        category: categoryBaseAdjustment,
        distance: distanceFee,
        urgency: input.urgency,
        surge: surgeMultiplier,
        time: timeMultiplier,
      },
      factors: {
        demandLevel: demandData.level,
        timeOfDay,
        distanceKm: input.distance,
      },
      savings: surgeMultiplier < 1.0 ? Math.round((1.0 - surgeMultiplier) * totalBeforeSurge) : 0,
      explanation: generatePriceExplanation(input, demandData, surgeMultiplier, timeOfDay),
    };
  });

async function getDemandData(location: { latitude: number; longitude: number }, category: string): Promise<DemandData> {
  const hour = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());

  const highDemandCategories = ['plumber', 'electrician', 'locksmith'];
  const isHighDemandCategory = highDemandCategories.includes(category);

  if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) {
    return {
      level: isHighDemandCategory ? 'high' : 'medium',
      surgeMultiplier: isHighDemandCategory ? 1.4 : 1.2,
    };
  } else if (hour >= 22 || hour <= 6) {
    return {
      level: 'high',
      surgeMultiplier: 1.5,
    };
  } else if (isWeekend) {
    return {
      level: 'medium',
      surgeMultiplier: 1.15,
    };
  } else {
    return {
      level: 'low',
      surgeMultiplier: 0.95,
    };
  }
}

function calculateDistanceFee(distance: number): number {
  if (distance <= 5) return 10;
  if (distance <= 10) return 20;
  if (distance <= 20) return 35;
  return 50;
}

function getUrgencyMultiplier(urgency: 'low' | 'medium' | 'high'): number {
  const multipliers = {
    low: 1.0,
    medium: 1.15,
    high: 1.35,
  };
  return multipliers[urgency];
}

function getTimeMultiplier(timeOfDay: string): number {
  const multipliers: Record<string, number> = {
    morning: 1.05,
    afternoon: 1.0,
    evening: 1.1,
    night: 1.3,
  };
  return multipliers[timeOfDay] || 1.0;
}

function getCategoryAdjustment(category: string): number {
  const adjustments: Record<string, number> = {
    plumber: 15,
    electrician: 20,
    locksmith: 25,
    painter: 0,
    cleaner: -10,
    gardener: -5,
    carpenter: 10,
    mason: 15,
    roofer: 20,
    hvac: 25,
  };
  return adjustments[category] || 0;
}

function generatePriceExplanation(
  input: { basePrice: number; distance: number; urgency: string },
  demandData: DemandData,
  surgeMultiplier: number,
  timeOfDay: string
): string {
  const parts: string[] = [];

  parts.push(`Base: ${input.basePrice}€`);
  
  if (input.distance > 5) {
    parts.push(`Déplacement: ${calculateDistanceFee(input.distance)}€`);
  }

  if (input.urgency === 'high') {
    parts.push(`Urgence élevée: +35%`);
  } else if (input.urgency === 'medium') {
    parts.push(`Urgence moyenne: +15%`);
  }

  if (demandData.level === 'high') {
    parts.push(`Forte demande: x${surgeMultiplier.toFixed(2)}`);
  } else if (demandData.level === 'low' && surgeMultiplier < 1.0) {
    parts.push(`Promotion heure creuse: -${Math.round((1 - surgeMultiplier) * 100)}%`);
  }

  if (timeOfDay === 'night') {
    parts.push(`Intervention de nuit: +30%`);
  }

  return parts.join(' • ');
}

function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}
