
import { GoogleGenAI, Type, Modality } from "@google/genai";
import mime from "mime";
import type { Quiz } from "../types";

const getGenAI = () => new GoogleGenAI({ apiKey: localStorage.getItem('GEMINI_API_KEY')});

interface WavConversionOptions {
    numChannels: number;
    sampleRate: number;
    bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');

    const options: Partial<WavConversionOptions> = {
        numChannels: 1,
    };

    if (format && format.startsWith('L')) {
        const bits = parseInt(format.slice(1), 10);
        if (!isNaN(bits)) {
            options.bitsPerSample = bits;
        }
    }

    for (const param of params) {
        const [key, value] = param.split('=').map(s => s.trim());
        if (key === 'rate') {
            options.sampleRate = parseInt(value, 10);
        }
    }

    return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Uint8Array {
    const {
        numChannels,
        sampleRate,
        bitsPerSample,
    } = options;

    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    // Helper function to write string
    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');                       // ChunkID
    view.setUint32(4, 36 + dataLength, true);     // ChunkSize (little-endian)
    writeString(8, 'WAVE');                       // Format
    writeString(12, 'fmt ');                      // Subchunk1ID
    view.setUint32(16, 16, true);                 // Subchunk1Size (PCM)
    view.setUint16(20, 1, true);                  // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true);        // NumChannels
    view.setUint32(24, sampleRate, true);         // SampleRate
    view.setUint32(28, byteRate, true);           // ByteRate
    view.setUint16(32, blockAlign, true);         // BlockAlign
    view.setUint16(34, bitsPerSample, true);      // BitsPerSample
    writeString(36, 'data');                      // Subchunk2ID
    view.setUint32(40, dataLength, true);         // Subchunk2Size

    return new Uint8Array(buffer);
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
}

function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

function convertToWav(rawData: string, mimeType: string): Uint8Array {
    const options = parseMimeType(mimeType);
    const audioData = base64ToUint8Array(rawData);
    const wavHeader = createWavHeader(audioData.length, options);
    return concatenateUint8Arrays([wavHeader, audioData]);
}

export async function generateImageFromImage(inputImageBase64: string, prompt: string): Promise<Blob> {
    const ai = getGenAI();
    const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash-image',
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: inputImageBase64
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            }
        ],
        config: {
            responseModalities: ['IMAGE', 'TEXT'],
            imageConfig: {
                imageSize: '1K',
            },
        },
    });

    const imageChunks: Uint8Array[] = [];

    for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
            continue;
        }

        if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            const data = inlineData.data || '';

            // Convert base64 to Uint8Array
            const imageData = base64ToUint8Array(data);
            imageChunks.push(imageData);
        }
    }

    if (imageChunks.length === 0) {
        throw new Error("Image generation failed: no image data received.");
    }

    // Concatenate all chunks and convert to Blob
    const finalImage = concatenateUint8Arrays(imageChunks);
    return new Blob([finalImage], { type: 'image/png' });
}

export async function generateImage(prompt: string): Promise<Blob> {
    const ai = getGenAI();
    const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash-image',
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: `Create an educational illustration for a lesson slide: ${prompt}. Style: Colorful, friendly, suitable for students, clean and modern design.`
                    }
                ]
            }
        ],
        config: {
            responseModalities: ['IMAGE', 'TEXT'],
            imageConfig: {
                imageSize: '1K',
            },
        },
    });

    const imageChunks: Uint8Array[] = [];

    for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
            continue;
        }

        if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            const data = inlineData.data || '';

            // Convert base64 to Uint8Array
            const imageData = base64ToUint8Array(data);
            imageChunks.push(imageData);
        }
    }

    if (imageChunks.length === 0) {
        throw new Error("Image generation failed: no image data received.");
    }

    // Concatenate all chunks and convert to Blob
    const finalImage = concatenateUint8Arrays(imageChunks);
    return new Blob([finalImage], { type: 'image/png' });
}

export async function generateAudio(text: string): Promise<string> {
    const ai = getGenAI();
    const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash-preview-tts",
        contents: [
            {
                role: 'user',
                parts: [{ text: `Narrate the following text clearly and engagingly: ${text}` }]
            }
        ],
        config: {
            responseModalities: ['audio'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const audioChunks: Uint8Array[] = [];

    for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
            continue;
        }

        if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            const mimeType = inlineData.mimeType || '';
            const data = inlineData.data || '';

            let fileExtension = mime.getExtension(mimeType);
            let audioData: Uint8Array;

            if (!fileExtension) {
                // No standard extension, likely raw PCM audio - convert to WAV
                fileExtension = 'wav';
                audioData = convertToWav(data, mimeType);
            } else {
                audioData = base64ToUint8Array(data);
            }

            audioChunks.push(audioData);
        }
    }

    if (audioChunks.length === 0) {
        throw new Error("Audio generation failed: no audio data received.");
    }

    // Concatenate all chunks
    const finalAudio = concatenateUint8Arrays(audioChunks);

    // Return as base64 string for compatibility with existing code
    return uint8ArrayToBase64(finalAudio);
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
        // Check for errors in the operation
        if (operation.error) {
            console.error("Video generation error:", operation.error);
            throw new Error(`Video generation failed: ${operation.error.message || JSON.stringify(operation.error)}`);
        }

        // Wait for 10 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    // Check for errors after completion
    if (operation.error) {
        console.error("Video generation error:", operation.error);
        throw new Error(`Video generation failed: ${operation.error.message || JSON.stringify(operation.error)}`);
    }

    // Log the full response for debugging
    console.log("Video operation response:", JSON.stringify(operation.response, null, 2));

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        console.error("Full operation object:", JSON.stringify(operation, null, 2));
        throw new Error("Video generation failed: no download link received.");
    }

    // The download link needs the API key appended
    const videoUrlWithKey = `${downloadLink}&key=${localStorage.getItem('GEMINI_API_KEY')}`;
    
    // Fetch the video as a blob
    const videoResponse = await fetch(videoUrlWithKey);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download generated video: ${videoResponse.statusText}`);
    }
    return await videoResponse.blob();
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
