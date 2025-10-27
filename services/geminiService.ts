
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates a descriptive prompt from an image using the Gemini API.
 * @param imageData Base64 encoded image data.
 * @param mimeType The MIME type of the image.
 * @returns A promise that resolves to the generated prompt text.
 */
export async function generatePromptFromImage(
  imageData: string,
  mimeType: string
): Promise<string> {
  const model = 'gemini-2.5-flash';

  const imagePart = {
    inlineData: {
      data: imageData,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: `You are an expert at writing detailed, descriptive, and artistic prompts for generative AI image models. 
    Describe the following image in a way that captures its essence, style, and key elements to be used as a prompt. 
    Focus on visual details: composition, colors, lighting, subject matter, and mood. Be concise but evocative.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
    });
    
    if (response && response.text) {
      return response.text.trim();
    } else {
      throw new Error("The API response was empty or invalid.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}
