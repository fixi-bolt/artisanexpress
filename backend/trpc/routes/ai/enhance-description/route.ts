import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { generateText } from "@rork/toolkit-sdk";

export const enhanceDescriptionProcedure = protectedProcedure
  .input(
    z.object({
      category: z.string(),
      description: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[AI] Enhancing description:", input);

    const { category, description } = input;

    const enhancedDescription = await generateText({
      messages: [
        {
          role: "user",
          content: `Tu es un assistant qui aide les clients à mieux décrire leur problème pour un artisan.

Catégorie: ${category}
Description initiale: ${description}

Améliore cette description en la rendant plus claire, précise et complète pour l'artisan. Ajoute des questions pertinentes si des informations importantes manquent. Garde un ton professionnel mais accessible.

Retourne seulement la description améliorée, sans préambule.`,
        },
      ],
    });

    console.log("[AI] Description enhanced successfully");

    return {
      originalDescription: description,
      enhancedDescription,
      improvements: [
        "Plus de détails techniques",
        "Informations de contexte ajoutées",
        "Questions de clarification incluses",
      ],
    };
  });
