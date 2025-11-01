
import { GoogleGenAI, Type } from "@google/genai";
import { PluginTemplate } from "../types";
import { dspSources } from './dsp';

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
          unit: { type: Type.STRING, enum: ['%', 'ms', 'Hz', 'dB'], description: "The unit for the parameter value." },
          affects: { type: Type.STRING, description: "The name of the DSP module this parameter primarily controls." }
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
    4.  A detailed list of parameters that would be needed to control this plugin's features. Each parameter must have a unique ID, a user-friendly name, a type ('range' or 'toggle'), and a sensible default value, min/max, step, and unit for range types.
    5.  The complete, production-ready boilerplate code for the chosen framework ('JUCE' or 'Web Audio'). The code must be fully functional and correctly reference the parameters you've defined. For JUCE, provide a professional C++ header and source file structure within a single string. For Web Audio, provide a complete JavaScript class that can be instantiated.

    Return the entire package as a single, valid JSON object that adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pluginGenerationSchema,
      },
    });
    
    const generatedJson = JSON.parse(response.text.trim());

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


export const addModuleToProject = async (
  existingProject: PluginTemplate,
  moduleName: string,
  moduleDescription: string
): Promise<PluginTemplate> => {

  if (existingProject.framework !== 'JUCE') {
    throw new Error("Module integration is currently only supported for JUCE projects.");
  }

  // Find the specific module source code
  const moduleSource = dspSources[moduleName as keyof typeof dspSources];
  if (!moduleSource) {
    throw new Error(`DSP source for module "${moduleName}" not found.`);
  }
  
  const prompt = `
    You are an expert JUCE plugin developer specializing in code refactoring.
    A user wants to add a new DSP module to their existing plugin using a pre-existing DSP library.

    **Module Request:**
    - Module to Add: ${moduleName}
    - Module Description: ${moduleDescription}

    **DSP Library Source Code for ${moduleName}:**
    This is the specific class from the library you MUST use. Its class name within the AmapianoDSP namespace is \`${moduleName}\`.
    \`\`\`cpp
    ${moduleSource}
    \`\`\`

    **Existing Plugin Context:**
    - Plugin Name: ${existingProject.name}
    - Existing Parameters: ${JSON.stringify(existingProject.parameters, null, 2)}
    - Existing Code (Header and Source):
    \`\`\`cpp
    ${existingProject.code}
    \`\`\`

    **Your Task:**
    1.  **Analyze the request:** Understand the function of the \`AmapianoDSP::${moduleName}\` class.
    2.  **Define New Parameters:** Identify and define the necessary \`juce::AudioParameterFloat\` or \`juce::AudioParameterBool\` parameters to control this module. For example, a Reverb might need 'roomSize' and 'preDelay'. Give them sensible names, IDs, ranges, and units. Each new parameter's "affects" property should be "${moduleName}".
    3.  **Refactor the Code:** Modify the existing C++ code to integrate the new module. This involves:
        a. Adding the necessary class definition for \`AmapianoDSP::${moduleName}\` or assuming it's included.
        b. Declaring the new parameters as member variables (e.g., \`juce::AudioParameterFloat* roomSizeParam;\`).
        c. Initializing the new parameters in the constructor's initializer list and adding them to the \`AudioProcessor\`.
        d. Declaring an instance of the chosen \`AmapianoDSP::${moduleName}\` class as a member variable (e.g., \`AmapianoDSP::Reverb reverb;\`).
        e. Calling the module's \`.prepare()\` method in the plugin's \`prepareToPlay()\`.
        f. In \`processBlock()\`, read the latest values from your new parameters and update the DSP module (e.g., \`reverb.setRoomSize(*roomSizeParam)\`).
        g. Correctly insert the module's \`.process()\` call into the sample processing loop. It should process the audio after any existing effects.
    4.  **Return the Complete Package:** Respond with a single JSON object containing the **complete, updated plugin configuration**. This JSON object must include:
        - The original id, name, type, description, and tags.
        - The **full, combined list** of old and new parameters.
        - The **entire, fully refactored C++ code**.

    Do not return just a snippet. The output must be the complete, modified project, adhering to the provided JSON schema. Do not include any markdown formatting.
  `;

   try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pluginGenerationSchema,
      },
    });
    
    const generatedJson = JSON.parse(response.text.trim());
    
    const updatedTemplate: PluginTemplate = {
      ...generatedJson,
      framework: 'JUCE', // Keep the framework consistent
    };
    
    return updatedTemplate;

  } catch (error) {
    console.error("Error adding module to project:", error);
    throw new Error("Failed to add module. The AI may have returned an invalid format or failed to refactor the code.");
  }

};
