
import React, { useState, useEffect, useCallback } from 'react';
import type { LecturePlan, GeneratedAssets, Quiz, QuizQuestion, GenerationStatus } from './types';
import { fetchLecturePlan, fetchInitialImage, uploadFileToFirebase, base64ToBlob } from './services/firebaseService';
import { generateAudio, generateVideo, generateQuiz } from './services/geminiService';
import { Slide } from './components/Slide';
import { QuizSlide } from './components/QuizSlide';
import { Spinner } from './components/Spinner';
import { ArrowLeftIcon, ArrowRightIcon, UploadIcon, KeyIcon, LinkIcon, DocumentIcon, ImageIcon } from './components/IconComponents';
import { kebabCase, markdownToHtml, blobToBase64 as fileToB64 } from './utils';

const LECTURE_PLAN_URL = 'https://firebasestorage.googleapis.com/v0/b/gemini-vibeathon.firebasestorage.app/o/plans%2FTWI1750.json?alt=media';
const INITIAL_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/gemini-vibeathon.firebasestorage.app/o/media%2Falex.jpg?alt=media';

const generationMessages = [
    "Brewing coffee for the AI... this might take a moment.",
    "Teaching the AI to speak... synthesising audio.",
    "Directing a cinematic masterpiece... rendering video.",
    "Uploading rushes to the cloud... please wait.",
    "Assembling pixels into a coherent narrative.",
    "The AI is checking its notes... preparing your quiz."
];

export default function App() {
    const [lecturePlan, setLecturePlan] = useState<LecturePlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<GenerationStatus>({ stage: '', message: '' });
    const [error, setError] = useState<string | null>(null);
    const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssets | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const [displayMessage, setDisplayMessage] = useState(generationMessages[0]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [finalLectureUrl, setFinalLectureUrl] = useState<string | null>(null);
    const [publishedFilePath, setPublishedFilePath] = useState<string | null>(null);
    const [lecturePlanFile, setLecturePlanFile] = useState<File | null>(null);
    const [initialImageFile, setInitialImageFile] = useState<File | null>(null);


    const checkApiKey = useCallback(async () => {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setIsApiKeySelected(hasKey);
        } else {
             // For local dev or if aistudio is not available
            setIsApiKeySelected(!!process.env.API_KEY);
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            interval = window.setInterval(() => {
                setDisplayMessage(prev => {
                    const currentIndex = generationMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % generationMessages.length;
                    return generationMessages[nextIndex];
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);


    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success and re-check, giving user immediate feedback
            setIsApiKeySelected(true); 
            checkApiKey(); // Verify in background
        } else {
            alert("API key selection is not available in this environment.");
        }
    };
    
    const handleLectureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLecturePlanFile(e.target.files[0]);
        }
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setInitialImageFile(e.target.files[0]);
        }
    };

    const handleGenerateLecture = async () => {
        if (!isApiKeySelected) {
            setError("Please select an API key before generating the lecture.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedAssets(null);
        setCurrentSlide(0);
        setFinalLectureUrl(null);
        setPublishedFilePath(null);

        try {
            setStatus({ stage: '1/4', message: 'Loading lesson plan...' });
            let plan: LecturePlan;
            if (lecturePlanFile) {
                try {
                    const fileContent = await lecturePlanFile.text();
                    plan = JSON.parse(fileContent);
                } catch (e) {
                    throw new Error("Failed to read or parse the provided JSON file. Please ensure it's valid.");
                }
            } else {
                plan = await fetchLecturePlan(LECTURE_PLAN_URL);
            }
            setLecturePlan(plan);

            setStatus({ stage: '2/4', message: 'Generating multimedia assets...' });

            let initialImageBase64: string;
            if (initialImageFile) {
                initialImageBase64 = await fileToB64(initialImageFile);
            } else {
                initialImageBase64 = await fetchInitialImage(INITIAL_IMAGE_URL);
            }

            const [audioBase64s, videoBlob, quizData] = await Promise.all([
                Promise.all(plan.content_and_themes.map(theme => generateAudio(theme.details))),
                generateVideo(`${plan.overview} ${plan.guiding_questions.join(' ')}`, initialImageBase64).catch(err => {
                    if (err.message.includes("Requested entity was not found.")) {
                        setIsApiKeySelected(false);
                        throw new Error("Your API key is invalid or expired. Please select a new key and try again.");
                    }
                    throw err;
                }),
                generateQuiz(plan.content_and_themes.map(t => t.details).join('\n\n'), 5),
            ]);
            
            setStatus({ stage: '3/4', message: 'Uploading media to cloud...' });
            const videoPath = `media/${kebabCase(plan.unit_title)}-video.mp4`;
            
            const audioUploadPromises = audioBase64s.map((base64, i) => {
                const audioBlob = base64ToBlob(base64, 'audio/mpeg');
                const audioPath = `media/${kebabCase(plan.unit_title)}-audio-${i}.mp3`;
                return uploadFileToFirebase(audioBlob, audioPath);
            });

            const videoUploadPromise = uploadFileToFirebase(videoBlob, videoPath);

            const [uploadedVideoUrl, ...uploadedAudioUrls] = await Promise.all([videoUploadPromise, ...audioUploadPromises]);

            const assets: GeneratedAssets = {
                videoUrl: uploadedVideoUrl,
                audioUrls: uploadedAudioUrls,
                quiz: quizData,
            };

            setStatus({ stage: '4/4', message: 'Ready!' });
            setGeneratedAssets(assets);
            
        } catch (err: any) {
            console.error("Generation failed:", err);
            setError(err.message || 'An unknown error occurred during generation.');
        } finally {
            setIsLoading(false);
        }
    };

    const totalSlides = generatedAssets && lecturePlan
        ? 1 + lecturePlan.content_and_themes.length + (generatedAssets.quiz?.questions.length || 0)
        : 0;

    const goToNextSlide = () => {
        setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
    };

    const goToPrevSlide = () => {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
    };

    const handlePublishLecture = async () => {
        if (!lecturePlan || !generatedAssets) return;
    
        setIsPublishing(true);
        setError(null);

        const slideContent = Array.from({ length: totalSlides }, (_, i) => {
            if (i === 0) {
                return `<div class="slide"><video src="${generatedAssets.videoUrl}" controls autoplay muted loop class="w-full h-full object-cover"></video></div>`;
            } else if (i <= lecturePlan.content_and_themes.length) {
                const theme = lecturePlan.content_and_themes[i - 1];
                return `<div class="slide">
                          <h2 class="text-4xl font-bold mb-4">${theme.theme}</h2>
                          <div class="prose prose-invert max-w-none">${markdownToHtml(theme.details)}</div>
                          <audio src="${generatedAssets.audioUrls[i-1]}" controls autoplay class="mt-auto"></audio>
                        </div>`;
            } else {
                const question = generatedAssets.quiz.questions[i - 1 - lecturePlan.content_and_themes.length];
                return `<div class="slide">
                          <h3 class="text-3xl font-semibold mb-6">${question.question}</h3>
                          <ul class="space-y-4">
                            ${question.options.map(opt => `<li>${opt}</li>`).join('')}
                          </ul>
                          <p class="mt-6 font-bold">Correct Answer: ${question.answer}</p>
                        </div>`;
            }
        }).join('');
    
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${lecturePlan.unit_title}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { background-color: #0f172a; color: white; font-family: sans-serif; }
                    .slide-container { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
                    .slide { display: none; flex-direction: column; padding: 2rem; box-sizing: border-box; position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
                    .slide.active { display: flex; }
                    .nav-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 1rem; cursor: pointer; z-index: 10; border-radius: 9999px; }
                    #prevBtn { left: 1rem; }
                    #nextBtn { right: 1rem; }
                    .prose { color: #d1d5db; }
                    .prose h2 { font-size: 2.25rem; line-height: 2.5rem; }
                </style>
            </head>
            <body>
                <div class="slide-container">
                    ${slideContent}
                    <button id="prevBtn" class="nav-btn">&lt;</button>
                    <button id="nextBtn" class="nav-btn">&gt;</button>
                </div>
                <script>
                    let current = 0;
                    const slides = document.querySelectorAll('.slide');
                    function showSlide(index) {
                        slides.forEach((slide, i) => {
                            slide.classList.toggle('active', i === index);
                            const media = slide.querySelector('video, audio');
                            if (media) {
                                if (i === index) media.play().catch(e=>console.log("Autoplay blocked"));
                                else media.pause();
                            }
                        });
                    }
                    document.getElementById('nextBtn').addEventListener('click', () => {
                        current = (current + 1) % slides.length;
                        showSlide(current);
                    });
                    document.getElementById('prevBtn').addEventListener('click', () => {
                        current = (current - 1 + slides.length) % slides.length;
                        showSlide(current);
                    });
                    showSlide(0);
                </script>
            </body>
            </html>
        `;
    
        try {
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const filePath = `lectures/${kebabCase(lecturePlan.unit_title)}.html`;
            const finalUrl = await uploadFileToFirebase(htmlBlob, filePath);
            setFinalLectureUrl(finalUrl);
            setPublishedFilePath(filePath);
        } catch (err: any) {
            setError(`Failed to publish lecture: ${err.message}`);
        } finally {
            setIsPublishing(false);
        }
    };


    const renderContent = () => {
        if (!generatedAssets || !lecturePlan) {
            return (
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-sky-400">Gemini Academy</h1>
                    <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">Transform your lesson plans into engaging multimedia presentations. Click generate to begin.</p>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button
                            onClick={handleGenerateLecture}
                            disabled={isLoading || !isApiKeySelected}
                            className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 disabled:bg-sky-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                        >
                            Generate Lecture
                        </button>
                        <button 
                            onClick={handleSelectKey}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                        >
                            <KeyIcon />
                            {isApiKeySelected ? "API Key Selected" : "Select API Key"}
                        </button>
                    </div>
                     {!isApiKeySelected && <p className="mt-3 text-sm text-yellow-400">An API key is required to generate videos. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300">Billing info</a>.</p>}
                    {error && <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg max-w-2xl mx-auto">{error}</div>}

                    <div className="mt-6 border-t border-slate-700/50 pt-6 max-w-md mx-auto">
                        <h3 className="text-base font-semibold text-slate-400 mb-4">Optional Overrides</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="json-upload" className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-bold py-2 px-3 rounded-lg shadow-sm transition-colors cursor-pointer text-sm">
                                    <DocumentIcon />
                                    <span className="truncate">{lecturePlanFile ? lecturePlanFile.name : 'Lesson Plan (.json)'}</span>
                                </label>
                                <input id="json-upload" type="file" className="hidden" accept=".json" onChange={handleLectureFileChange} />
                            </div>
                            <div>
                                <label htmlFor="image-upload" className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-bold py-2 px-3 rounded-lg shadow-sm transition-colors cursor-pointer text-sm">
                                    <ImageIcon />
                                    <span className="truncate">{initialImageFile ? initialImageFile.name : 'Start Image (.jpg)'}</span>
                                </label>
                                <input id="image-upload" type="file" className="hidden" accept="image/jpeg,image/png" onChange={handleImageFileChange} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        let slideComponent;
        const slideIndex = currentSlide;

        if (slideIndex === 0) {
            slideComponent = (
                <div className="w-full h-full bg-black flex items-center justify-center">
                    <video key={generatedAssets.videoUrl} src={generatedAssets.videoUrl} controls autoPlay muted loop className="w-full h-full object-contain" />
                </div>
            );
        } else if (slideIndex > 0 && slideIndex <= lecturePlan.content_and_themes.length) {
            const themeIndex = slideIndex - 1;
            const theme = lecturePlan.content_and_themes[themeIndex];
            slideComponent = (
                <Slide
                    title={theme.theme}
                    content={markdownToHtml(theme.details)}
                    audioUrl={generatedAssets.audioUrls[themeIndex]}
                />
            );
        } else {
            const quizIndex = slideIndex - 1 - lecturePlan.content_and_themes.length;
            const question = generatedAssets.quiz.questions[quizIndex];
            slideComponent = (
                <QuizSlide
                    question={question}
                    questionNumber={quizIndex + 1}
                    totalQuestions={generatedAssets.quiz.questions.length}
                />
            );
        }

        return (
            <div className="w-full h-full flex flex-col">
                <div className="flex-grow relative rounded-lg overflow-hidden shadow-2xl bg-slate-800/50 backdrop-blur-sm">
                   {slideComponent}
                </div>
                <div className="flex-shrink-0 flex items-center justify-between p-4 mt-2">
                    <button onClick={goToPrevSlide} disabled={currentSlide === 0} className="p-3 rounded-full bg-slate-700/50 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ArrowLeftIcon /></button>
                    <span className="text-slate-300 font-medium">Slide {currentSlide + 1} / {totalSlides}</span>
                    <button onClick={goToNextSlide} disabled={currentSlide === totalSlides - 1} className="p-3 rounded-full bg-slate-700/50 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ArrowRightIcon /></button>
                </div>
                 <div className="text-center pb-4">
                     {finalLectureUrl ? (
                         <div className="bg-slate-800/50 p-4 rounded-lg inline-flex flex-col items-center gap-3">
                             <p className="font-bold text-green-400">🎉 Lecture Published!</p>
                             {publishedFilePath && (
                                <p className="text-sm text-slate-400">
                                    Saved to: <code className="bg-slate-700 px-2 py-1 rounded-md text-xs font-mono">{publishedFilePath}</code>
                                </p>
                             )}
                             <a 
                                 href={finalLectureUrl}
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                             >
                                 <LinkIcon /> View Your Lecture
                             </a>
                         </div>
                     ) : (
                         <button 
                             onClick={handlePublishLecture}
                             disabled={isPublishing}
                             className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-bold py-2 px-5 rounded-lg shadow-md transition-transform transform hover:scale-105"
                         >
                             {isPublishing ? (
                                <>
                                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                 </svg>
                                 <span>Publishing...</span>
                                </>
                             ) : (
                                <>
                                 <UploadIcon />
                                 <span>Publish Lecture</span>
                                </>
                             )}
                         </button>
                     )}
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen w-full bg-slate-900 text-white flex items-center justify-center p-4 md:p-8" style={{minHeight: 'max(100vh, 720px)'}}>
            <div className="w-full h-full max-w-6xl aspect-video flex items-center justify-center">
                {isLoading ? (
                    <div className="text-center">
                        <Spinner />
                        <h2 className="text-2xl font-semibold mt-6 text-sky-300">{status.stage} - {status.message}</h2>
                        <p className="text-slate-400 mt-2">{displayMessage}</p>
                    </div>
                ) : (
                    renderContent()
                )}
            </div>
        </main>
    );
}