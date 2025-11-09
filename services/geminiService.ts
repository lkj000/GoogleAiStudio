
import { GoogleGenAI, Type } from "@google/genai";
import { PluginTemplate, Preset } from "../types";
import { dspSources } from './dsp';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const pluginGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "A unique, URL-friendly ID in kebab-case. e.g., 'vintage-tape-warble'" },
    name: { type: Type.STRING, description: "A creative, descriptive name for the plugin. e.g., 'Vintage Tape Warble'" },
    type: { type: Type.STRING, enum: ['instrument', 'effect', 'utility'], description: "The category of the plugin." },
    framework: { type: Type.STRING, enum: ['JUCE', 'Web Audio'], description: "The target framework for the plugin code." },
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
    signalChain: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of strings listing the DSP modules in their processing order. e.g., ['Saturation', 'Reverb']"
    },
    code: { type: Type.STRING, description: "The full, complete, and syntactically correct boilerplate code for the specified framework, incorporating all the defined parameters and the correct signal chain order." }
  },
  required: ["id", "name", "type", "framework", "description", "tags", "parameters", "code", "signalChain"]
};

// New, more robust schema for refactoring operations
const pluginRefactoringSchema = {
  type: Type.OBJECT,
  properties: {
    parameters: pluginGenerationSchema.properties.parameters,
    signalChain: pluginGenerationSchema.properties.signalChain,
    code: pluginGenerationSchema.properties.code
  },
  required: ["parameters", "code", "signalChain"]
};

const signalChainRefactoringSchema = {
    type: Type.OBJECT,
    properties: {
        signalChain: pluginGenerationSchema.properties.signalChain,
        code: pluginGenerationSchema.properties.code
    },
    required: ["signalChain", "code"]
};

const presetsGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        presets: {
            type: Type.ARRAY,
            description: "An array of generated preset objects.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "A creative and descriptive name for the preset (e.g., 'Warm Tape Wobble', 'Deep Space Echo')." },
                    values: {
                        type: Type.OBJECT,
                        description: "An object where keys are parameter IDs and values are the corresponding numeric settings for this preset.",
                        additionalProperties: { type: Type.NUMBER }
                    }
                },
                required: ["name", "values"]
            }
        }
    },
    required: ["presets"]
};


const parseJsonResponse = (rawText: string): any => {
    let cleanedText = rawText.trim();
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = cleanedText.match(jsonRegex);

    if (match && match[1]) {
        cleanedText = match[1];
    }

    try {
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse JSON response:", cleanedText);
        throw new Error("AI returned malformed JSON.");
    }
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
    4.  The 'framework' property, which must be "${framework}".
    5.  A detailed list of parameters that would be needed to control this plugin's features. Each parameter must have a unique ID, a user-friendly name, a type ('range' or 'toggle'), and a sensible default value, min/max, step, and unit for range types.
    6.  An array of strings for the 'signalChain' property, listing the DSP modules in their processing order. This should be derived from the description.
    7.  The complete, production-ready boilerplate code for the chosen framework ('JUCE' or 'Web Audio'). The code must be fully functional, correctly reference the parameters you've defined, and respect the signal chain order. For JUCE, provide a professional C++ header and source file structure within a single string. For Web Audio, provide a complete JavaScript class that can be instantiated and has 'input' and 'output' AudioNode properties, and a 'setParam(id, value)' method.

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
    
    const generatedJson = parseJsonResponse(response.text);

    const pluginTemplate: PluginTemplate = {
      id: generatedJson.id,
      name: generatedJson.name,
      type: generatedJson.type,
      framework: generatedJson.framework,
      description: generatedJson.description,
      tags: generatedJson.tags,
      parameters: generatedJson.parameters,
      code: generatedJson.code,
      signalChain: generatedJson.signalChain,
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

  const moduleSource = dspSources[moduleName as keyof typeof dspSources];
  if (!moduleSource) {
    throw new Error(`DSP source for module "${moduleName}" not found.`);
  }
  
  const prompt = `
    You are an expert JUCE plugin developer specializing in precise code refactoring.
    A user wants to add a new DSP module to their existing plugin.

    **Module Request:**
    - Module to Add: ${moduleName}
    - Module Description: ${moduleDescription}

    **DSP Library Source Code for ${moduleName}:**
    This is the specific C++ class from the library you MUST use. Its class name within the AmapianoDSP namespace is \`${moduleName}\`.
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

    **Your Task (Follow these steps PRECISELY):**
    1.  **Define New Parameters:** Identify and define the necessary \`juce::AudioParameterFloat\` or \`juce::AudioParameterBool\` parameters to control this module. For example, a Saturation module might need a 'drive' parameter. Give them sensible names, IDs, ranges, and units. Each new parameter's "affects" property MUST be "${moduleName}".
    2.  **Refactor the Code:** Modify the existing C++ code to integrate the new module as described in previous instructions.
    3.  **Update Signal Chain:** Add "${moduleName}" to the END of the existing signalChain array.
    4.  **Return ONLY the changed parts:** Respond with a single JSON object containing ONLY the following updated properties:
        - The **full, combined list** of old and new parameters.
        - The updated 'signalChain' array.
        - The **entire, fully refactored C++ code**.

    CRITICAL: Do not return the full project object, only the changed properties. Do not include markdown formatting.
  `;

   try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pluginRefactoringSchema,
      },
    });
    
    const generatedJson = parseJsonResponse(response.text);
    
    // Merge the AI's response with the existing project data to ensure stability
    const updatedTemplate: PluginTemplate = {
      ...existingProject,
      parameters: generatedJson.parameters,
      code: generatedJson.code,
      signalChain: generatedJson.signalChain,
    };
    
    return updatedTemplate;

  } catch (error) {
    console.error("Error adding module to project:", error);
    throw new Error("Failed to add module. The AI may have returned an invalid format or failed to refactor the code.");
  }

};

export const refactorSignalChain = async (
  existingProject: PluginTemplate,
  newChain: string[]
): Promise<PluginTemplate> => {
  if (existingProject.framework !== 'JUCE') {
    throw new Error("Signal chain refactoring is currently only supported for JUCE projects.");
  }
  
  const prompt = `
    You are an expert JUCE C++ audio plugin developer specializing in precise code refactoring.
    Your task is to re-order the signal processing chain within an existing plugin's code.

    **Refactoring Request:**
    - Current Signal Chain Order: ${JSON.stringify(existingProject.signalChain)}
    - **New Desired Signal Chain Order:** ${JSON.stringify(newChain)}

    **Existing Plugin Code (Header and Source):**
    \`\`\`cpp
    ${existingProject.code}
    \`\`\`

    **Your Task (Follow these steps PRECISELY):**
    1.  **Analyze the Code:** Understand how the DSP modules are currently connected and processed in the \`processBlock\` method.
    2.  **Refactor the \`processBlock\` method:** Modify the C++ code to process the audio through the modules in the **new desired order**. This is the most critical step. The logic must be correct.
    3.  **Update Member Declarations (if needed):** Ensure the member variables for the DSP modules are declared in an order that makes sense, though this is less critical than the \`processBlock\` logic.
    4.  **Return ONLY the changed parts:** Respond with a single JSON object containing ONLY the following updated properties:
        - The updated 'signalChain' array (which should be identical to the new desired order you were given).
        - The **entire, fully refactored C++ code** that implements this new signal chain.

    CRITICAL: Do not change any other properties. Do not return the full project object, only the specified changed properties. Do not include markdown formatting.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: signalChainRefactoringSchema,
      },
    });
    
    const generatedJson = parseJsonResponse(response.text);
    
    const updatedTemplate: PluginTemplate = {
      ...existingProject,
      code: generatedJson.code,
      signalChain: generatedJson.signalChain,
    };
    
    return updatedTemplate;

  } catch (error) {
    console.error("Error refactoring signal chain:", error);
    throw new Error("Failed to refactor signal chain. The AI may have returned an invalid format.");
  }
};

export const generatePluginFromSmartTemplate = async (templateName: 'Amapianorizer' | 'Lofi Chillifier'): Promise<PluginTemplate> => {
    const prompts = {
        Amapianorizer: `
            You are an expert audio plugin developer. Your task is to generate a complete VST plugin configuration from a "Smart Template" concept.
            The user wants to create an 'Amapianorizer' plugin for the JUCE framework.

            **Concept:** A genre-defining multi-effect for creating authentic Amapiano sounds. It should combine a punchy log drum processor with atmospheric effects.

            **Required Modules & Parameters:**
            1.  **Log Drum Processor:** This is the core. It needs parameters for a hard, percussive 'Knock' (transient shaping, 0-100%) and a booming 'Decay' (release time, 0-100%).
            2.  **Saturation:** A warm, analog-style saturation, controlled by a 'Vibe' parameter (0-100%).
            3.  **Reverb:** A spacious reverb to create atmosphere, controlled by 'Space' (decay time/size, 0-100%) and 'Mix' (wet/dry, 0-100%).

            **Signal Chain:** The processing order must be: Saturation -> Log Drum Processor -> Reverb.

            Based on this, generate a complete plugin package. This includes a creative name ("Amapianorizer" or similar), a concise description, relevant tags, a detailed list of all required parameters, the correct signal chain array, and the complete, production-ready JUCE C++ boilerplate code.

            Return the entire package as a single, valid JSON object that adheres to the provided schema. Do not include any markdown formatting.
        `,
        'Lofi Chillifier': `
            You are an expert audio plugin developer. Your task is to generate a complete VST plugin configuration from a "Smart Template" concept.
            The user wants to create a 'Lofi Chillifier' plugin for the JUCE framework.

            **Concept:** An instant vibe machine to add vintage warmth, tape hiss, and hazy echoes to any audio signal.

            **Required Modules & Parameters:**
            1.  **Tape Warble:** This module emulates the pitch instability of old tape machines. It needs 'Wow' (slow pitch drift, 0-100%) and 'Flutter' (fast pitch instability, 0-100%) parameters.
            2.  **Noise:** A layer of authentic vinyl crackle and tape hiss. Controlled by a single 'Hiss' parameter (0-100%).
            3.  **Filtered Echo:** A dark, lo-fi delay. Controlled by 'Time' (delay time, 0-100%), 'Feedback' (repeats, 0-100%), and 'Tone' (a low-pass filter on the echoes, 0-100%).

            **Signal Chain:** The processing order must be: Tape Warble -> Filtered Echo -> Noise.

            Based on this, generate a complete plugin package. This includes a creative name ("Lofi Chillifier" or similar), a concise description, relevant tags, a detailed list of all required parameters, the correct signal chain array, and the complete, production-ready JUCE C++ boilerplate code.

            Return the entire package as a single, valid JSON object that adheres to the provided schema. Do not include any markdown formatting.
        `
    };

    const prompt = prompts[templateName];
    if (!prompt) {
        throw new Error(`Unknown smart template: ${templateName}`);
    }

    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: pluginGenerationSchema,
          },
        });
        
        const generatedJson = parseJsonResponse(response.text);

        return generatedJson as PluginTemplate;

    } catch (error) {
        console.error(`Error generating smart template "${templateName}":`, error);
        throw new Error(`Failed to generate smart template. The AI may have returned an invalid format.`);
    }
};

export const generateDocumentation = async (project: PluginTemplate): Promise<string> => {
    const prompt = `
        You are an expert technical writer specializing in user manuals for audio software.
        Your task is to generate a comprehensive and user-friendly manual in Markdown format for the following audio plugin.

        **Plugin Details:**
        - Name: ${project.name}
        - Description: ${project.description}
        - Type: ${project.type}
        - Framework: ${project.framework}
        - Tags: ${project.tags.join(', ')}
        - Parameters:
        ${project.parameters.map(p => `  - **${p.name}** (\`${p.id}\`): Controls the ${p.affects || 'main output'}. Range: ${p.min}-${p.max} ${p.unit || ''}. Default: ${p.defaultValue}.`).join('\n')}

        **Manual Structure:**
        Please create a manual with the following sections:
        1.  **Introduction:** A brief, engaging overview of what the plugin is and its ideal use cases.
        2.  **Features:** A bulleted list of the key features.
        3.  **Controls & Parameters:** A detailed breakdown of each parameter. For each one, explain what it does in simple terms and give tips on how to use it effectively. Use the parameter details provided above.
        4.  **Usage Tips:** Provide one or two creative examples of how to use this plugin to achieve a specific sound (e.g., "For a classic lo-fi vibe, try...").

        Format the entire output as clean, well-structured Markdown. Use headings, bold text, and lists to make it easy to read. Do not include any other text or explanation outside of the Markdown manual itself.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating documentation:", error);
        throw new Error("Failed to generate documentation. The AI may be experiencing issues.");
    }
};

export const generatePresets = async (project: PluginTemplate, count: number = 6): Promise<Preset[]> => {
    const parameterDetails = project.parameters
        .filter(p => p.type === 'range')
        .map(p => `- \`${p.id}\` (${p.name}): min=${p.min}, max=${p.max}, default=${p.defaultValue}`)
        .join('\n');

    const prompt = `
        You are an expert sound designer. Your task is to create a set of useful and creative presets for an audio plugin.

        **Plugin Details:**
        - Name: ${project.name}
        - Description: ${project.description}
        - Available Parameters (and their valid ranges):
        ${parameterDetails}

        **Your Task:**
        Generate ${count} distinct presets. For each preset:
        1.  Invent a creative, descriptive name (e.g., "Gentle Flutter", "Dark Cavern", "Crushed Cassette").
        2.  Provide a value for **each** of the available parameters listed above.
        3.  Ensure every parameter value is a number and falls strictly within its specified min/max range.

        Return the entire set of presets as a single, valid JSON object that adheres to the provided schema. Do not include any markdown formatting.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: presetsGenerationSchema,
            },
        });
        
        const generatedJson = parseJsonResponse(response.text);
        
        if (!generatedJson.presets || !Array.isArray(generatedJson.presets)) {
            throw new Error("AI response did not contain a valid 'presets' array.");
        }

        return generatedJson.presets as Preset[];

    } catch (error) {
        console.error("Error generating presets:", error);
        throw new Error("Failed to generate presets. The AI may have returned an invalid format.");
    }
};

export const getAudioFeedback = async (
    userQuery: string,
    project: PluginTemplate,
    paramValues: Record<string, number>,
    audioAnalysis: { rms: number; peak: number; dominantFrequency: number; bass: number; mids: number; treble: number }
): Promise<string> => {
    const currentParams = project.parameters.map(p => `- ${p.name} (${p.id}): ${paramValues[p.id].toFixed(2)}`).join('\n');

    const prompt = `
        You are an expert audio engineer and mixing advisor AI.
        A user is working on a plugin and has a question about the sound they are producing.
        Your task is to provide clear, actionable feedback based on their question, the plugin's current state, and a technical analysis of the audio.

        **User's Question:** "${userQuery}"

        **Plugin Context:**
        - Name: ${project.name}
        - Description: ${project.description}
        - Current Parameter Settings:
        ${currentParams}

        **Real-time Audio Analysis:**
        - RMS Volume: ${audioAnalysis.rms.toFixed(2)} dBFS
        - Peak Volume: ${audioAnalysis.peak.toFixed(2)} dBFS
        - Dominant Frequency: ~${audioAnalysis.dominantFrequency.toFixed(0)} Hz
        - Frequency Balance: Bass ${audioAnalysis.bass.toFixed(1)}%, Mids ${audioAnalysis.mids.toFixed(1)}%, Treble ${audioAnalysis.treble.toFixed(1)}%

        **Your Task:**
        1.  Analyze the user's question in the context of the plugin and the audio data.
        2.  Provide a concise, helpful answer in Markdown format.
        3.  Suggest specific parameter changes on their plugin to help them achieve their goal. For example, "To add warmth, try increasing the 'drive' parameter to around 6.5."
        4.  Keep your advice practical and easy for a musician or producer to understand.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating audio feedback:", error);
        throw new Error("The AI advisor is currently unavailable.");
    }
};
