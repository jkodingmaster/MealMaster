
import { GoogleGenAI, Type, Schema, Content } from "@google/genai";
import { Recipe, ChatMessage, RecipeSource, Ingredient } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recipeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    recipes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          prepTime: { type: Type.STRING },
          calories: { type: Type.INTEGER },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.STRING },
                estimatedPrice: { type: Type.STRING },
                imageTerm: { type: Type.STRING },
                isMissing: { type: Type.BOOLEAN },
                isEssential: { type: Type.BOOLEAN, description: "True if this ingredient is core to the dish and cannot be simply omitted without changing the dish's identity." },
              },
              required: ["name", "amount", "estimatedPrice", "imageTerm", "isMissing", "isEssential"],
            },
          },
          instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["title", "description", "prepTime", "calories", "ingredients", "instructions"],
      },
    },
  },
  required: ["recipes"],
};

async function getWebInformedRecipes(promptPrefix: string, searchContext: string): Promise<Recipe[]> {
  const model = "gemini-3-pro-preview";

  try {
    const searchResponse = await ai.models.generateContent({
      model,
      contents: `${promptPrefix}: ${searchContext}. Focus on finding highly-rated and popular web-proven recipes. Extract as much detail as possible about every single ingredient and step.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const searchText = searchResponse.text;
    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: RecipeSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Web Resource",
        uri: chunk.web.uri,
      }));

    const structResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the following recipe research, generate exactly 3 distinct recipes in JSON format. 
      Research: ${searchText}
      
      CRITICAL REQUIREMENT:
      - You MUST include ALL ingredients mentioned in the source material. 
      - Determine if an ingredient is 'isEssential' (core proteins, grains, primary fats/acids).
      - imageTerm must be descriptive.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
        systemInstruction: "You are a meticulous professional recipe compiler. Accuracy is everything.",
      },
    });

    const data = JSON.parse(structResponse.text || "{}");
    return data.recipes?.map((r: any) => ({ 
      ...r, 
      id: crypto.randomUUID(),
      sources
    })) || [];

  } catch (error) {
    console.error("Deep Search Error:", error);
    return [];
  }
}

export const getIngredientAlternative = async (ingredient: Ingredient, recipeTitle: string): Promise<Ingredient | null> => {
  const model = "gemini-3-flash-preview";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Find a common and high-quality alternative for "${ingredient.name}" (${ingredient.amount}) in the context of the recipe "${recipeTitle}". Return a single JSON object for the replacement ingredient.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            amount: { type: Type.STRING },
            estimatedPrice: { type: Type.STRING },
            imageTerm: { type: Type.STRING },
            isMissing: { type: Type.BOOLEAN },
            isEssential: { type: Type.BOOLEAN },
          },
          required: ["name", "amount", "estimatedPrice", "imageTerm", "isMissing", "isEssential"],
        }
      }
    });
    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Alternative finding error:", error);
    return null;
  }
};

export const suggestRecipesFromChat = async (userRequest: string): Promise<Recipe[]> => {
  return getWebInformedRecipes("Search for the best, most popular versions of these requested meals.", userRequest);
};

export const getChefResponse = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const chatHistory: Content[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const chat = ai.chats.create({
    model,
    history: chatHistory,
    config: {
      systemInstruction: `You are Gorden Ram-C. You are a world-class chef who is intense, helpful, but very critical of laziness in the kitchen.`,
    },
  });

  try {
    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "Speak up!";
  } catch (error) {
    return "The kitchen is in shambles!";
  }
};
