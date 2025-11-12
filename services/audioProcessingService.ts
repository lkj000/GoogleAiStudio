import { GoogleGenAI, Type } from "@google/genai";
import { MidiNote, ArrangementPattern, ArrangementSection } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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

// --- MIDI Humanization Engine ---

const midiHumanizationSchema = {
    type: Type.OBJECT,
    properties: {
        humanizedPattern: {
            type: Type.ARRAY,
            description: "An array of humanized MIDI note objects.",
            items: {
                type: Type.OBJECT,
                properties: {
                    pitch: { type: Type.INTEGER, description: "The MIDI note number (0-127)." },
                    start: { type: Type.NUMBER, description: "The note's start time in beats, with slight timing variations." },
                    duration: { type: Type.NUMBER, description: "The note's duration in beats." },
                    velocity: { type: Type.INTEGER, description: "The note's velocity (0-127), with slight variations." }
                },
                required: ["pitch", "start", "duration", "velocity"]
            }
        }
    },
    required: ["humanizedPattern"]
};

export const humanizeMidiPattern = async (
    pattern: MidiNote[],
    timingAmount: number, // 0-100
    velocityAmount: number // 0-100
): Promise<MidiNote[]> => {
    const prompt = `
        You are an expert music producer specializing in creating natural, human-like MIDI performances.
        Your task is to humanize a given MIDI pattern by applying subtle, realistic variations to timing and velocity.

        **Original MIDI Pattern:**
        ${JSON.stringify(pattern, null, 2)}

        **Humanization Parameters:**
        - Timing Randomness: ${timingAmount}% (0% is perfectly quantized, 100% is very loose)
        - Velocity Variation: ${velocityAmount}% (0% is no change, 100% is highly dynamic)

        **Instructions:**
        1.  Iterate through each note in the original pattern.
        2.  For each note's 'start' time, add a small, random offset. The magnitude of this offset should be influenced by the 'Timing Randomness'. A common technique is to shift notes slightly ahead or behind the beat (e.g., +/- 0.05 beats for moderate timing randomness).
        3.  For each note's 'velocity', add a small, random offset. The magnitude should be influenced by the 'Velocity Variation'.
        4.  Ensure all values remain within their valid ranges (pitch/velocity 0-127). Do not change pitch or duration.
        5.  The result should sound like a real musician playing, not just random noise. The variations should be subtle and musical.

        Return a single JSON object containing the new 'humanizedPattern' array. Do not include markdown formatting.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: midiHumanizationSchema,
            },
        });
        const parsed = parseJsonResponse(response.text);
        return parsed.humanizedPattern as MidiNote[];
    } catch (error) {
        console.error("Error humanizing MIDI pattern:", error);
        throw new Error("Failed to humanize MIDI. The AI may have returned an invalid format.");
    }
};


// --- Arrangement Assistant Engine ---
const arrangementGenerationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Name of the section (e.g., 'Intro', 'Verse', 'Chorus', 'Build-up', 'Drop', 'Outro')." },
            length: { type: Type.INTEGER, description: "Length of the section in bars (e.g., 8, 16)." },
            patterns: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['Drums', 'Bass', 'Melody', 'FX', 'Chords', 'Lead'] }
                    },
                    required: ["id", "name", "type"]
                }
            }
        },
        required: ["name", "length", "patterns"]
    }
};

export const generateArrangement = async (
    availablePatterns: ArrangementPattern[],
    genre: string
): Promise<ArrangementSection[]> => {
    const prompt = `
        You are an expert music producer and arranger. Your task is to create a compelling song arrangement using a given pool of musical patterns.

        **Genre:** ${genre}
        **Available Patterns:**
        ${JSON.stringify(availablePatterns, null, 2)}

        **Instructions:**
        1.  Create a typical song structure for the specified genre. This should include sections like Intro, Verse, Chorus, etc. A common structure is Intro -> Verse -> Chorus -> Verse -> Chorus -> Bridge -> Chorus -> Outro.
        2.  Assign a realistic length (in bars, typically 8 or 16) to each section.
        3.  Populate each section's 'patterns' array with a logical combination of the available patterns.
        4.  Build energy dynamically. The Intro should be sparse, Verses should build, and Choruses should be the most energetic. For example, don't use all patterns in the Intro. Introduce elements gradually. The bass and full drums usually come in after the intro.
        5.  Ensure that the 'patterns' in your response are ONLY selected from the 'Available Patterns' list provided above. Use the exact 'id', 'name', and 'type' for each pattern you use.

        Return the entire arrangement as a single JSON array of section objects. Do not include markdown formatting.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: arrangementGenerationSchema,
            },
        });
        return parseJsonResponse(response.text) as ArrangementSection[];
    } catch (error) {
        console.error("Error generating arrangement:", error);
        throw new Error("Failed to generate arrangement. The AI may have returned an invalid format.");
    }
};


// --- Time-Stretch Engine (Simulated) ---

const timeStretchSchema = {
    type: Type.OBJECT,
    properties: {
        success: { type: Type.BOOLEAN, description: "Whether the operation was successful." },
        stretchFactor: { type: Type.NUMBER, description: "The calculated stretch factor." },
        resultingBPM: { type: Type.NUMBER, description: "The target BPM." },
        artifacts: { type: Type.STRING, description: "A brief, technical description of expected audio artifacts, if any (e.g., 'minor transients smearing', 'clean result', 'slight phasing')." }
    },
    required: ["success", "stretchFactor", "resultingBPM", "artifacts"]
};

export const timeStretchAudio = async (
    originalBPM: number,
    targetBPM: number,
    algorithm: 'percussive' | 'tonal' | 'speech'
): Promise<any> => {
     const prompt = `
        You are a high-end audio digital signal processing (DSP) engine.
        A user wants to time-stretch an audio sample.

        **Parameters:**
        - Original BPM: ${originalBPM}
        - Target BPM: ${targetBPM}
        - Algorithm Mode: ${algorithm}

        **Your Task:**
        Simulate the time-stretching process and return a JSON object confirming the operation's result.
        - Calculate the stretch factor (targetBPM / originalBPM).
        - Based on the algorithm and the amount of stretching, provide a brief, realistic description of the expected audio artifacts. For example, a large stretch on a 'percussive' sample might cause transient smearing. A small stretch on a 'tonal' sample should be clean.

        Return a single JSON object with the results. Do not include markdown formatting.
    `;

    try {
        // This is a simulation. In a real app, this would involve complex audio processing.
        // We add a delay to mimic the processing time.
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: timeStretchSchema,
            },
        });

        const parsed = parseJsonResponse(response.text);
        if (!parsed.success) {
            throw new Error("AI simulation reported a failure in time-stretching.");
        }
        return parsed;

    } catch (error) {
        console.error("Error in time-stretch simulation:", error);
        throw new Error("Failed to time-stretch audio.");
    }
};