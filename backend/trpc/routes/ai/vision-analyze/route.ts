import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { generateObject } from "@/lib/rork-toolkit-sdk";

export const visionAnalyzeProcedure = protectedProcedure
  .input(
    z.object({
      description: z.string().optional(),
      imageUrls: z.array(z.string()).min(1, "At least one image is required"),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[AI] Vision analyze input:", input);

    const messages: { role: "user"; content: ({ type: "text"; text: string } | { type: "image"; image: string })[] }[] = [
      {
        role: "user",
        content: [
          { type: "text", text: `Analyse ces photos d'un problème domestique. Retourne un JSON structuré en français.` },
          ...(input.description ? [{ type: "text" as const, text: `Description: ${input.description}` }] : []),
          ...input.imageUrls.map((u) => ({ type: "image" as const, image: u })),
        ],
      },
    ];

    const result = await generateObject({
      messages,
      schema: z.object({
        detectedCategory: z.string().describe("ID ou nom de catégorie probable"),
        severity: z.enum(["low", "medium", "high"]).describe("Gravité estimée"),
        confidence: z.number().min(0).max(1).describe("Confiance 0-1"),
        probableIssues: z.array(z.string()).describe("Problèmes probables"),
        recommendedParts: z.array(z.string()).describe("Pièces/consommables probables"),
        safetyAdvice: z.array(z.string()).describe("Conseils de sécurité immédiats"),
        notes: z.string().describe("Notes additionnelles"),
      }),
    });

    console.log("[AI] Vision analyze result:", result);

    return { analysis: result }; 
  });
