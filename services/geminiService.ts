
import { GoogleGenAI, Type } from "@google/genai";
import { PluginTemplate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const pluginGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "A unique, URL-friendly ID in kebab-case. e.g., 'vintage-tape-warble'" },
    name: { type: Type.STRING, description: "A creative, descriptive name for the plugin. e.g., 'Vintage Tape Warble'" },
    type: { type: Type.STRING, enum: ['instrument', 'effect', 'utility'], description: "The category of the plugin." },
    description: { type: Type.STRING, description: "A brief, compelling description of what the plugin does." },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "An array of 4-5 relevant, lowercase tags. e.g., ['lo-fi', 'tape', 'chorus', 'vintage']"
    },
    parameters: {
      type: Type.ARRAY,
      description: "An array of parameter objects that control the plugin.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A short, camelCase ID for the parameter. e.g., 'wowAmount'" },
          name: { type: Type.STRING, description: "A user-friendly name for the UI. e.g., 'Wow Amount'" },
          type: { type: Type.STRING, enum: ['range', 'toggle'], description: "The type of UI control." },
          defaultValue: { type: Type.NUMBER, description: "The default value for the parameter." },
          min: { type: Type.NUMBER, description: "The minimum value for a 'range' type." },
          max: { type: Type.NUMBER, description: "The maximum value for a 'range' type." },
          step: { type: Type.NUMBER, description: "The step increment for a 'range' type." },
        },
        required: ["id", "name", "type", "defaultValue"]
      }
    },
    code: { type: Type.STRING, description: "The full, complete, and syntactically correct boilerplate code for the specified framework, incorporating all the defined parameters." }
  },
  required: ["id", "name", "type", "description", "tags", "parameters", "code"]
};

export const generatePluginFromDescription = async (
  description: string,
  framework: 'JUCE' | 'Web Audio'
): Promise<PluginTemplate> => {
  const prompt = `
    You are an expert audio plugin developer. Your task is to generate a complete VST plugin configuration from a user's description.
    The user wants to create a plugin with the following description: "${description}".
    The target framework is: "${framework}".

    Based on this, generate a complete plugin package. This includes:
    1.  A creative and fitting name for the plugin.
    2.  A concise description.
    3.  A set of relevant tags.
    4.  A detailed list of parameters that would be needed to control this plugin's features. Each parameter must have a unique ID, a user-friendly name, a type ('range' or 'toggle'), and a sensible default value, min/max, and step for range types.
    5.  The complete, production-ready boilerplate code for the chosen framework ('JUCE' or 'Web Audio'). The code must be fully functional and correctly reference the parameters you've defined. For JUCE, provide a professional C++ header and source file structure within a single string. For Web Audio, provide a complete JavaScript class that can be instantiated.

    Return the entire package as a single, valid JSON object that adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.
  `;

  try {
    const response = await ai.models.generateContent({
      // FIX: Use a more powerful model for complex tasks like code generation as per guidelines.
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pluginGenerationSchema,
      },
    });
    
    // FIX: Trim whitespace from the response text before parsing to prevent potential JSON errors.
    const generatedJson = JSON.parse(response.text.trim());

    // The AI response is the plugin template. We just need to add the framework field.
    const pluginTemplate: PluginTemplate = {
      ...generatedJson,
      framework: framework,
    };
    
    return pluginTemplate;

  } catch (error) {
    console.error("Error generating plugin from description:", error);
    throw new Error("Failed to generate plugin. The AI may have returned an invalid format.");
  }
};
