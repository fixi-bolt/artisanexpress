import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { generateObject } from "@/lib/rork-toolkit-sdk";
import { categories } from "@/mocks/artisans";

export const suggestCategoryProcedure = protectedProcedure
  .input(
    z.object({
      description: z.string(),
      photos: z.array(z.string()).optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[AI] Suggesting category:", input);

    const { description, photos } = input;

    const availableCategories = categories.map((c) => ({
      id: c.id,
      label: c.label,
    }));

    const messages: { role: "user"; content: string | ({ type: "text"; text: string } | { type: "image"; image: string })[] }[] = [
      {
        role: "user",
        content: photos && photos.length > 0
          ? [
              { type: "text" as const, text: `Description: ${description}\n\nCatégories disponibles: ${JSON.stringify(availableCategories)}\n\nAnalyse la description et les photos pour suggérer la ou les catégories d'artisan les plus appropriées.` },
              ...photos.map((photo) => ({ type: "image" as const, image: photo })),
            ]
          : `Description: ${description}\n\nCatégories disponibles: ${JSON.stringify(availableCategories)}\n\nAnalyse la description pour suggérer la ou les catégories d'artisan les plus appropriées.`,
      },
    ];

    const suggestion = await generateObject({
      messages,
      schema: z.object({
        primaryCategory: z.string().describe("Catégorie principale suggérée (ID)"),
        secondaryCategories: z.array(z.string()).describe("Catégories secondaires possibles (IDs)"),
        confidence: z.number().min(0).max(100).describe("Niveau de confiance de la suggestion (0-100)"),
        reasoning: z.string().describe("Explication du choix de catégorie"),
        additionalNotes: z.string().describe("Notes supplémentaires pour le client"),
      }),
    });

    const primaryCategoryInfo = categories.find((c) => c.id === suggestion.primaryCategory);
    const secondaryCategoriesInfo = suggestion.secondaryCategories
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean);

    console.log("[AI] Category suggestion completed:", suggestion);

    return {
      suggestion: {
        ...suggestion,
        primaryCategoryLabel: primaryCategoryInfo?.label,
        secondaryCategoriesLabels: secondaryCategoriesInfo.map((c) => c?.label),
      },
      allCategories: availableCategories,
    };
  });
