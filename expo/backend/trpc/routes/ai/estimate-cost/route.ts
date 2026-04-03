import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { generateObject } from "@/lib/rork-toolkit-sdk";

export const estimateCostProcedure = protectedProcedure
  .input(
    z.object({
      category: z.string(),
      description: z.string(),
      photos: z.array(z.string()).optional(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[AI] Estimating cost for mission:", input);

    const { category, description, photos } = input;

    const messages: { role: "user"; content: string | ({ type: "text"; text: string } | { type: "image"; image: string })[] }[] = [
      {
        role: "user",
        content: photos && photos.length > 0
          ? [
              { type: "text" as const, text: `Catégorie: ${category}\nDescription: ${description}\n\nAnalyse les photos et estime le coût de cette intervention d'artisan.` },
              ...photos.map((photo) => ({ type: "image" as const, image: photo })),
            ]
          : `Catégorie: ${category}\nDescription: ${description}\n\nEstime le coût de cette intervention d'artisan.`,
      },
    ];

    const estimation = await generateObject({
      messages,
      schema: z.object({
        estimatedCost: z.number().describe("Coût estimé en euros"),
        minCost: z.number().describe("Coût minimum en euros"),
        maxCost: z.number().describe("Coût maximum en euros"),
        estimatedDuration: z.number().describe("Durée estimée en minutes"),
        complexity: z.enum(["low", "medium", "high"]).describe("Niveau de complexité"),
        urgency: z.enum(["low", "medium", "high"]).describe("Niveau d'urgence suggéré"),
        reasoning: z.string().describe("Explication de l'estimation"),
        recommendations: z.array(z.string()).describe("Recommandations pour le client"),
        materialsNeeded: z.array(z.string()).describe("Matériaux probablement nécessaires"),
      }),
    });

    console.log("[AI] Cost estimation completed:", estimation);

    return {
      estimation,
      confidence: photos && photos.length > 0 ? "high" : "medium",
      disclaimer: "Cette estimation est basée sur l'IA et peut varier selon l'artisan et la situation réelle.",
    };
  });
