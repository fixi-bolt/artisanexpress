import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

interface ArtisanScore {
  artisanId: string;
  score: number;
  reasons: string[];
}

export const getSmartRecommendationsProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
      category: z.string().optional(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      limit: z.number().optional().default(10),
    })
  )
  .query(async ({ input }) => {
    console.log("[Recommendations] Getting smart recommendations for:", input.userId);

    const userHistory = await getUserHistory(input.userId);
    const nearbyArtisans = await getNearbyArtisans(input.location, input.category);
    
    const scoredArtisans: ArtisanScore[] = nearbyArtisans.map(artisan => {
      const score = calculateMatchScore(artisan, userHistory, input.location);
      const reasons = generateReasons(artisan, userHistory, score);
      
      return {
        artisanId: artisan.id,
        score,
        reasons,
      };
    });

    scoredArtisans.sort((a, b) => b.score - a.score);

    const topRecommendations = scoredArtisans.slice(0, input.limit);

    const loyaltyOffers = generateLoyaltyOffers(userHistory);
    const subscriptionOffer = generateSubscriptionOffer(userHistory);

    console.log("[Recommendations] Top recommendations:", topRecommendations.length);

    return {
      recommendations: topRecommendations.map(r => ({
        artisanId: r.artisanId,
        matchScore: Math.round(r.score * 100),
        reasons: r.reasons,
      })),
      loyaltyOffers,
      subscriptionOffer,
      insights: {
        totalHistoryMissions: userHistory.completedMissions,
        favoriteCategory: userHistory.favoriteCategory,
        averageSpending: userHistory.averageSpending,
        loyaltyTier: getLoyaltyTier(userHistory.completedMissions),
      },
    };
  });

async function getUserHistory(userId: string) {
  return {
    completedMissions: 5 + Math.floor(Math.random() * 20),
    favoriteCategory: 'plumber',
    averageSpending: 120 + Math.floor(Math.random() * 100),
    lastMissionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    favoriteArtisans: ['art-1', 'art-3'],
    categoryPreferences: {
      plumber: 8,
      electrician: 3,
      locksmith: 2,
    },
    averageRatingGiven: 4.2 + Math.random() * 0.8,
  };
}

async function getNearbyArtisans(location: { latitude: number; longitude: number }, category?: string) {
  return [
    {
      id: 'art-1',
      name: 'Jean Dupont',
      category: category || 'plumber',
      rating: 4.8,
      completedJobs: 150,
      distance: 2.5,
      isAvailable: true,
      responseTime: 15,
      lastActive: new Date(),
    },
    {
      id: 'art-2',
      name: 'Marie Martin',
      category: category || 'plumber',
      rating: 4.6,
      completedJobs: 90,
      distance: 5.2,
      isAvailable: true,
      responseTime: 25,
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'art-3',
      name: 'Pierre Leblanc',
      category: category || 'plumber',
      rating: 4.9,
      completedJobs: 200,
      distance: 8.0,
      isAvailable: false,
      responseTime: 10,
      lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  ];
}

function calculateMatchScore(artisan: any, userHistory: any, location: { latitude: number; longitude: number }): number {
  let score = 0.0;

  if (artisan.rating >= 4.5) score += 0.3;
  else if (artisan.rating >= 4.0) score += 0.15;

  if (artisan.distance <= 3) score += 0.25;
  else if (artisan.distance <= 10) score += 0.15;
  else score += 0.05;

  if (userHistory.favoriteArtisans.includes(artisan.id)) {
    score += 0.35;
  }

  if (artisan.isAvailable) score += 0.15;

  if (artisan.responseTime <= 15) score += 0.10;
  else if (artisan.responseTime <= 30) score += 0.05;

  const hoursSinceActive = (Date.now() - artisan.lastActive.getTime()) / (1000 * 60 * 60);
  if (hoursSinceActive <= 1) score += 0.10;
  else if (hoursSinceActive <= 6) score += 0.05;

  if (artisan.completedJobs >= 100) score += 0.15;
  else if (artisan.completedJobs >= 50) score += 0.08;

  return Math.min(1.0, score);
}

function generateReasons(artisan: any, userHistory: any, score: number): string[] {
  const reasons: string[] = [];

  if (userHistory.favoriteArtisans.includes(artisan.id)) {
    reasons.push("Déjà travaillé avec vous");
  }

  if (artisan.rating >= 4.7) {
    reasons.push(`Excellent: ${artisan.rating}/5`);
  }

  if (artisan.distance <= 3) {
    reasons.push(`Très proche: ${artisan.distance} km`);
  }

  if (artisan.isAvailable) {
    reasons.push("Disponible maintenant");
  }

  if (artisan.responseTime <= 15) {
    reasons.push(`Répond en ${artisan.responseTime} min`);
  }

  if (artisan.completedJobs >= 100) {
    reasons.push(`${artisan.completedJobs} interventions réussies`);
  }

  if (score >= 0.8) {
    reasons.push("Recommandation premium");
  }

  return reasons.slice(0, 3);
}

function generateLoyaltyOffers(userHistory: any) {
  const offers = [];

  if (userHistory.completedMissions >= 10) {
    offers.push({
      id: 'loyalty-10',
      title: 'Client fidèle',
      description: '-10% sur votre prochaine intervention',
      discount: 10,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  if (userHistory.completedMissions >= 20) {
    offers.push({
      id: 'loyalty-20',
      title: 'Client VIP',
      description: 'Intervention prioritaire + -15%',
      discount: 15,
      priority: true,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });
  }

  return offers;
}

function generateSubscriptionOffer(userHistory: any) {
  if (userHistory.completedMissions >= 5) {
    return {
      id: 'sub-maintenance',
      title: 'Forfait Maintenance Annuel',
      description: '4 interventions/an pour 299€ au lieu de 480€',
      price: 299,
      originalPrice: 480,
      savings: 181,
      benefits: [
        'Interventions prioritaires',
        'Sans frais de déplacement',
        'Garantie pièces 1 an',
        'Assistance 24/7',
      ],
      categories: ['plumber', 'electrician', 'locksmith'],
    };
  }

  return null;
}

function getLoyaltyTier(completedMissions: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (completedMissions >= 50) return 'platinum';
  if (completedMissions >= 20) return 'gold';
  if (completedMissions >= 10) return 'silver';
  return 'bronze';
}
