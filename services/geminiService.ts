
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Quiz } from "../types";

const getGenAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateAudio(text: string): Promise<string> {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Narrate the following text clearly and engagingly: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Audio generation failed: no audio data received.");
    }
    return base64Audio;
}

// Fix: Updated generateVideo to accept an optional base64 image string and include it in the video generation request.
export async function generateVideo(prompt: string, imageBase64?: string): Promise<Blob> {
    const ai = getGenAI();

    // Veo video generation can be a long process.
    // We initiate the process and then poll for the result.
    const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Create a short, engaging introductory video about: ${prompt}`,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    };

    if (imageBase64) {
        payload.image = {
            imageBytes: imageBase64,
            mimeType: 'image/jpeg'
        };
    }

    let operation = await ai.models.generateVideos(payload);

    while (!operation.done) {
        // Wait for 10 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed: no download link received.");
    }

    // The download link needs the API key appended
    const videoUrlWithKey = `${downloadLink}&key=${process.env.API_KEY}`;
    
    // Fetch the video as a blob
    const videoResponse = await fetch(videoUrlWithKey);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download generated video: ${videoResponse.statusText}`);
    }
    const videoBlob = await videoResponse.blob();
    return videoBlob;
}


export async function generateQuiz(context: string, questionCount: number): Promise<Quiz> {
    const ai = getGenAI();
    const prompt = `Based on the following lecture content, generate a quiz with ${questionCount} multiple-choice questions. Each question should have 4 options and a single correct answer.

    Lecture Content:
    ---
    ${context}
    ---
    
    Provide the output in the specified JSON format.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                answer: { type: Type.STRING }
                            },
                            required: ["question", "options", "answer"]
                        }
                    }
                },
                required: ["questions"]
            }
        }
    });

    const jsonText = response.text.trim();
    try {
        const parsedJson = JSON.parse(jsonText);
        // Basic validation
        if (parsedJson && Array.isArray(parsedJson.questions)) {
            return parsedJson as Quiz;
        } else {
            throw new Error("Invalid quiz format received from API.");
        }
    } catch (e) {
        console.error("Failed to parse quiz JSON:", jsonText);
        throw new Error("Failed to generate a valid quiz.");
    }
}
