import { GoogleGenAI, Type } from "@google/genai";
import type { Product, ProductCondition } from '../types';

export const generateProductDescription = async (
  title: string,
  category: string,
  condition: ProductCondition
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      You are an expert e-commerce copywriter specializing in fashion and apparel. 
      Your task is to write a compelling, detailed, and enticing product description for a second-hand item. 
      The tone should be enthusiastic but honest.
      Highlight the quality and potential use cases (e.g., "perfect for a casual weekend brunch" or "a standout piece for a formal event").
      Do not use hashtags or emojis. The description should be a single, well-written paragraph.

      Item Details:
      - Title: ${title}
      - Category: ${category}
      - Condition: ${condition}

      Generate the description now.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 32768,
        },
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating product description:", error);
    return "We had trouble generating a description. Please try again or write your own.";
  }
};


export const checkNSFWContent = async (
  title: string,
  description: string,
  imageBase64DataUrl: string
): Promise<boolean> => {
    try {
        if (!process.env.API_KEY) {
            console.error("API_KEY environment variable not set.");
            return false; // Fail safe
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const [header, base64ImageData] = imageBase64DataUrl.split(',', 2);
        if (!header || !base64ImageData) {
           console.error("Invalid base64 data URL provided.");
           return false; // Fail safe
        }
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

        const prompt = `
            Analyze the following product listing content (image and text). 
            Is this content Not Safe For Work (NSFW), sexually suggestive, explicit, or otherwise inappropriate for a general audience marketplace?
            Respond with only the single word 'YES' or 'NO'.

            Title: "${title}"
            Description: "${description}"
        `;

        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64ImageData,
            },
        };

        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const resultText = response.text.trim().toUpperCase();
        console.log('AI NSFW Check Result:', resultText);
        return resultText === 'YES';

    } catch (error) {
        console.error("Error during AI content moderation check:", error);
        // Fail safe: if the check fails, we don't flag it. 
        // The manual reporting system can still catch it.
        return false;
    }
};

export interface AISearchResult {
  summary: string;
  productIds: string[];
}

export const getSearchFiltersFromQuery = async (
  query: string,
  availableProducts: Product[]
): Promise<AISearchResult> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // The AI needs to know what products are available to search from.
    const productDataForAI = availableProducts.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      condition: p.condition,
    }));

    const prompt = `
      You are a smart shopping assistant for an online marketplace called 'Closet Swap AI'.
      Your goal is to help users find items by understanding their natural language search queries.

      You will be given a user's query and a JSON list of all available products.
      Analyze the query to understand the user's intent, including category, price, condition, and descriptive keywords.
      Then, find all the products from the provided list that match the user's intent.

      You MUST return your response as a JSON object that strictly adheres to the provided schema.
      The JSON object should contain two keys:
      1. 'summary': A brief, friendly, one-sentence summary of what you are searching for (e.g., "Searching for vintage dresses under $50").
      2. 'productIds': An array of strings, where each string is the 'id' of a product that matches the search criteria. If no products match, return an empty array.

      User Query: "${query}"

      Available Products:
      ${JSON.stringify(productDataForAI)}
    `;

    const schema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: "A brief, friendly, one-sentence summary of the search criteria.",
        },
        productIds: {
          type: Type.ARRAY,
          description: "An array of product IDs that match the search criteria.",
          items: {
            type: Type.STRING,
          },
        },
      },
      required: ['summary', 'productIds'],
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
        },
    });
    
    // The response text is a JSON string, so we parse it.
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse as AISearchResult;

  } catch (error) {
    console.error("Error with AI search query:", error);
    // Return a user-friendly error state
    return {
      summary: "Sorry, I had trouble with that search. Please try rephrasing your query.",
      productIds: [],
    };
  }
};

export interface PriceSuggestionResult {
    suggestedPriceLow: number;
    suggestedPriceHigh: number;
    reasoning: string;
}

export const suggestPrice = async (
    title: string,
    category: string,
    condition: ProductCondition,
    description: string,
    otherProducts: Product[]
): Promise<PriceSuggestionResult> => {
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const marketContext = otherProducts
            .filter(p => p.status === 'available')
            .map(p => ({
                title: p.title,
                price: p.price,
                condition: p.condition,
            }));

        const prompt = `
            You are an expert e-commerce pricing analyst for a second-hand fashion marketplace.
            Your task is to suggest a competitive price range for a new item listing.

            Analyze the item's details and compare it to the provided list of other items currently on the market.
            Based on this analysis, determine a low and high price suggestion. The range should be reasonable.
            Also, provide a brief, one-sentence justification for your suggestion.

            You MUST return your response as a JSON object that strictly adheres to the provided schema.

            Item to Price:
            - Title: "${title}"
            - Category: "${category}"
            - Condition: "${condition}"
            - Description: "${description}"

            Current Market Items for Context:
            ${JSON.stringify(marketContext)}
        `;

        const schema = {
            type: Type.OBJECT,
            properties: {
                suggestedPriceLow: { type: Type.NUMBER, description: "The low-end of the suggested price range." },
                suggestedPriceHigh: { type: Type.NUMBER, description: "The high-end of the suggested price range." },
                reasoning: { type: Type.STRING, description: "A brief justification for the price suggestion." },
            },
            required: ['suggestedPriceLow', 'suggestedPriceHigh', 'reasoning'],
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
        
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse as PriceSuggestionResult;

    } catch (error) {
        console.error("Error suggesting price:", error);
        return {
            suggestedPriceLow: 0,
            suggestedPriceHigh: 0,
            reasoning: "Sorry, I couldn't generate a price suggestion at this time. Please try again.",
        };
    }
};


export interface ListingAnalysisResult {
    title: string;
    category: string;
    description: string;
}

export const analyzeImageForListing = async (
    imageBase64DataUrl: string,
    categories: string[]
): Promise<ListingAnalysisResult> => {
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const [header, base64ImageData] = imageBase64DataUrl.split(',', 2);
        if (!header || !base64ImageData) {
           throw new Error('Invalid base64 data URL');
        }
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

        const prompt = `
            You are an expert e-commerce merchandiser for a second-hand fashion marketplace.
            Analyze the provided image of a clothing item. Based ONLY on the image, perform the following tasks:

            1.  **Title:** Write a concise, attractive, and descriptive title for the item.
            2.  **Category:** Choose the single most appropriate category for the item from the following list: ${categories.join(', ')}.
            3.  **Description:** Write a compelling, single-paragraph product description. The tone should be enthusiastic but honest. Describe the item's style, material (if discernible), and potential use cases. Do not use hashtags or emojis.

            You MUST return your response as a JSON object that strictly adheres to the provided schema.
        `;

        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64ImageData,
            },
        };
        
        const textPart = { text: prompt };

        const schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "A concise, attractive title for the item." },
                category: { type: Type.STRING, description: `The most appropriate category from the provided list.` },
                description: { type: Type.STRING, description: "A compelling, single-paragraph product description." },
            },
            required: ['title', 'category', 'description'],
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });

        const jsonResponse = JSON.parse(response.text);

        // Ensure the category is one of the valid ones
        if (!categories.includes(jsonResponse.category)) {
            console.warn(`AI suggested an invalid category: '${jsonResponse.category}'. Falling back to default.`);
            jsonResponse.category = categories[0];
        }

        return jsonResponse as ListingAnalysisResult;

    } catch (error) {
        console.error("Error analyzing image for listing:", error);
        return {
            title: "",
            category: categories[0],
            description: "Sorry, I couldn't analyze that image. Please fill in the details manually.",
        };
    }
};

export interface ShippingSuggestionResult {
    suggestedShippingCost: number;
}

export const suggestShippingCost = async (
    title: string,
    category: string,
    description: string,
): Promise<ShippingSuggestionResult> => {
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const prompt = `
            You are a logistics and shipping cost estimation expert for a second-hand marketplace in the United States.
            Based on the item's details, estimate a reasonable domestic shipping cost.
            Consider the likely size, weight, and fragility of the item based on its category and description.
            For example, 'shoes' are heavier than 'tops', and a 'denim jacket' is heavier than a 'silk scarf'.

            You MUST return your response as a JSON object with a single key: "suggestedShippingCost". The value should be a number representing the cost in USD.

            Item Details:
            - Title: "${title}"
            - Category: "${category}"
            - Description: "${description}"
        `;

        const schema = {
            type: Type.OBJECT,
            properties: {
                suggestedShippingCost: { type: Type.NUMBER, description: "The estimated shipping cost in USD." },
            },
            required: ['suggestedShippingCost'],
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
        
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse as ShippingSuggestionResult;

    } catch (error) {
        console.error("Error suggesting shipping cost:", error);
        return {
            suggestedShippingCost: 0, // Return a default value on error
        };
    }
};