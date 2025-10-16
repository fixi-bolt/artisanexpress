import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { generateText } from "@rork/toolkit-sdk";

export const chatAssistantProcedure = protectedProcedure
  .input(
    z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })
      ),
      context: z.object({
        category: z.string().optional(),
        missionId: z.string().optional(),
      }).optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[AI] Chat assistant request:", input);

    const { messages, context } = input;

    const systemPrompt = `Tu es un assistant intelligent pour ArtisanNow, une plateforme d'artisans à la demande.

Tu aides les clients à:
- Décrire leur problème avec précision
- Choisir la bonne catégorie d'artisan
- Comprendre les coûts estimés
- Préparer leur intervention

Tu es professionnel, empathique et concis. Tu poses des questions pertinentes pour bien comprendre le besoin.
${context?.category ? `\nCatégorie actuelle: ${context.category}` : ""}
${context?.missionId ? `\nMission ID: ${context.missionId}` : ""}`;

    const formattedMessages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: systemPrompt },
      ...messages,
    ];

    const response = await generateText({
      messages: formattedMessages,
    });

    console.log("[AI] Chat response generated");

    return {
      response,
      suggestions: [
        "Ajouter des photos",
        "Préciser l'urgence",
        "Vérifier la disponibilité",
      ],
    };
  });
