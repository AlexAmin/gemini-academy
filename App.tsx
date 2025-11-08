
import React, { useState, useEffect, useCallback } from 'react';
import type { LecturePlan, GeneratedAssets, Quiz, QuizQuestion, GenerationStatus } from './types';
import { fetchLecturePlan, fetchInitialImage, uploadFileToFirebase, base64ToBlob } from './services/firebaseService';
import { generateAudio, generateVideo, generateQuiz, generateImage, generateImageFromImage } from './services/geminiService';
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
            // Check localStorage for saved API key
            const savedApiKey = localStorage.getItem('GEMINI_API_KEY');
            if (savedApiKey) {
                setIsApiKeySelected(true);
            } else {
                setIsApiKeySelected(false);
            }
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
            // Check if already set
            const existingKey = localStorage.getItem('GEMINI_API_KEY');
            if (existingKey) {
                const clearKey = window.confirm('An API key is already saved. Would you like to replace it?');
                if (!clearKey) return;
            }

            // Prompt for new API key
            const apiKey = window.prompt('Please enter your Gemini API Key:');
            if (apiKey && apiKey.trim()) {
                localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
                setIsApiKeySelected(true);
            }
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

            let initialImageBase64: string;
            if (initialImageFile) {
                initialImageBase64 = await fileToB64(initialImageFile);
            } else {
                initialImageBase64 = await fetchInitialImage(INITIAL_IMAGE_URL);
            }

            setStatus({ stage: '2/4', message: 'Creating contextual scene...' });
            // Generate a contextual image of the person for the video first frame
            const contextualImagePrompt = `Transform this person's image into a scene that represents the following educational topic: ${plan.unit_title}. ${plan.overview}. Keep the person recognizable but place them in an educational or thematic context related to the topic. Style: professional, educational, engaging.`;
            const contextualImageBlob = await generateImageFromImage(initialImageBase64, contextualImagePrompt);
            const contextualImageBase64 = await fileToB64(contextualImageBlob);

            setStatus({ stage: '3/5', message: 'Generating multimedia assets...' });
            const [audioBase64s, imageBlobs, videoBlob, quizData] = await Promise.all([
                Promise.all(plan.content_and_themes.map(theme => generateAudio(theme.details))),
                Promise.all(plan.content_and_themes.map(theme => generateImage(`${theme.theme}: ${theme.details}`))),
                generateVideo(`${plan.overview} ${plan.guiding_questions.join(' ')}`, contextualImageBase64).catch(err => {
                    if (err.message.includes("Requested entity was not found.")) {
                        setIsApiKeySelected(false);
                        throw new Error("Your API key is invalid or expired. Please select a new key and try again.");
                    }
                    throw err;
                }),
                generateQuiz(plan.content_and_themes.map(t => t.details).join('\n\n'), 5),
            ]);

            setStatus({ stage: '4/5', message: 'Uploading media to cloud...' });
            const videoPath = `media/${kebabCase(plan.unit_title)}-video.mp4`;

            const audioUploadPromises = audioBase64s.map((base64, i) => {
                const audioBlob = base64ToBlob(base64, 'audio/wav');
                const audioPath = `media/${kebabCase(plan.unit_title)}-audio-${i}.wav`;
                return uploadFileToFirebase(audioBlob, audioPath);
            });

            const imageUploadPromises = imageBlobs.map((blob, i) => {
                const imagePath = `media/${kebabCase(plan.unit_title)}-image-${i}.png`;
                return uploadFileToFirebase(blob, imagePath);
            });

            const videoUploadPromise = uploadFileToFirebase(videoBlob, videoPath);

            const [uploadedVideoUrl, ...rest] = await Promise.all([
                videoUploadPromise,
                ...audioUploadPromises,
                ...imageUploadPromises
            ]);

            const uploadedAudioUrls = rest.slice(0, audioBase64s.length);
            const uploadedImageUrls = rest.slice(audioBase64s.length);

            const assets: GeneratedAssets = {
                videoUrl: uploadedVideoUrl,
                audioUrls: uploadedAudioUrls,
                imageUrls: uploadedImageUrls,
                quiz: quizData,
            };

            setStatus({ stage: '5/5', message: 'Ready!' });
            setGeneratedAssets(assets);
            
        } catch (err: any) {
            console.error("Generation failed:", err);
            setError(err.message || 'An unknown error occurred during generation.');
        } finally {
            setIsLoading(false);
        }
    };

    const totalSlides = generatedAssets && lecturePlan
        ? 1 + lecturePlan.content_and_themes.length + (generatedAssets.quiz?.questions.length || 0) + 1 // +1 for completion slide
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

        const slideContent = Array.from({ length: totalSlides + 1 }, (_, i) => {
            if (i === 0) {
                return `<div class="slide intro-slide">
                          <div class="video-container">
                            <video src="${generatedAssets.videoUrl}" controls autoplay loop></video>
                          </div>
                          <div class="intro-overlay">
                            <h1 class="intro-title">${lecturePlan.unit_title}</h1>
                          </div>
                        </div>`;
            } else if (i <= lecturePlan.content_and_themes.length) {
                const theme = lecturePlan.content_and_themes[i - 1];
                const imageUrl = generatedAssets.imageUrls[i - 1];
                return `<div class="slide content-slide">
                          <div class="slide-header">
                            <span class="slide-number">Slide ${i} of ${totalSlides - 1}</span>
                            <h2 class="slide-title">${theme.theme}</h2>
                          </div>
                          <div class="slide-body">
                            <div class="slide-image">
                              <img src="${imageUrl}" alt="${theme.theme}" />
                            </div>
                            <div class="slide-content">
                              ${markdownToHtml(theme.details)}
                            </div>
                          </div>
                          <div class="slide-footer">
                            <audio src="${generatedAssets.audioUrls[i-1]}" controls autoplay></audio>
                          </div>
                        </div>`;
            } else if (i <= lecturePlan.content_and_themes.length + generatedAssets.quiz.questions.length) {
                const question = generatedAssets.quiz.questions[i - 1 - lecturePlan.content_and_themes.length];
                const qNum = i - lecturePlan.content_and_themes.length;
                return `<div class="slide quiz-slide" data-quiz="true">
                          <div class="quiz-header">
                            <span class="quiz-badge">Quiz Question ${qNum}</span>
                          </div>
                          <h3 class="quiz-question">${question.question}</h3>
                          <ul class="quiz-options">
                            ${question.options.map((opt, idx) => `
                              <li class="quiz-option" data-answer="${opt}" data-correct="${opt === question.answer}">
                                <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                                <span class="option-text">${opt}</span>
                              </li>
                            `).join('')}
                          </ul>
                          <div class="quiz-answer" style="display: none;">
                            <div class="answer-feedback"></div>
                          </div>
                        </div>`;
            } else {
                return `<div class="slide completion-slide">
                          <div class="completion-content">
                            <div class="celebration-icon">🎉</div>
                            <h1 class="completion-title">Woohoo! You're Done!</h1>
                            <p class="completion-message">Congratulations on completing this lesson!</p>
                            <div class="completion-stats">
                              <div class="stat-item">
                                <div class="stat-number">${lecturePlan.content_and_themes.length}</div>
                                <div class="stat-label">Topics Covered</div>
                              </div>
                              <div class="stat-item">
                                <div class="stat-number">${generatedAssets.quiz.questions.length}</div>
                                <div class="stat-label">Questions Answered</div>
                              </div>
                            </div>
                            <p class="completion-footer">Great job learning about ${lecturePlan.unit_title}!</p>
                          </div>
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
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        font-family: 'Poppins', sans-serif;
                        overflow: hidden;
                    }
                    .slide-container {
                        position: relative;
                        width: 100vw;
                        height: 100vh;
                        overflow: hidden;
                    }
                    .slide {
                        display: none;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: white;
                        opacity: 0;
                        transition: opacity 0.5s ease-in-out;
                    }
                    .slide.active {
                        display: flex;
                        opacity: 1;
                    }

                    /* Intro Slide */
                    .intro-slide {
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        position: relative;
                    }
                    .video-container {
                        width: 80%;
                        max-width: 900px;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }
                    .video-container video {
                        width: 100%;
                        height: auto;
                        display: block;
                    }
                    .intro-overlay {
                        position: absolute;
                        top: 10%;
                        width: 100%;
                        text-align: center;
                    }
                    .intro-title {
                        font-size: 3.5rem;
                        font-weight: 700;
                        color: white;
                        text-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        animation: fadeInUp 1s ease-out;
                    }

                    /* Content Slide */
                    .content-slide {
                        flex-direction: column;
                        padding: 2rem 3rem;
                        background: linear-gradient(to bottom right, #ffecd2 0%, #fcb69f 100%);
                    }
                    .slide-header {
                        margin-bottom: 1.5rem;
                    }
                    .slide-number {
                        display: inline-block;
                        background: #667eea;
                        color: white;
                        padding: 0.5rem 1rem;
                        border-radius: 20px;
                        font-size: 0.9rem;
                        font-weight: 600;
                    }
                    .slide-title {
                        font-size: 2.5rem;
                        font-weight: 700;
                        color: #2d3748;
                        margin-top: 1rem;
                    }
                    .slide-body {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 2rem;
                        flex: 1;
                        overflow: hidden;
                    }
                    .slide-image {
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                        height: 100%;
                        display: flex;
                        align-items: center;
                    }
                    .slide-image img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .slide-content {
                        background: white;
                        padding: 2rem;
                        border-radius: 15px;
                        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                        overflow-y: auto;
                        color: #2d3748;
                        font-size: 1.1rem;
                        line-height: 1.8;
                    }
                    .slide-content h1, .slide-content h2, .slide-content h3 {
                        color: #667eea;
                        margin-bottom: 0.5rem;
                    }
                    .slide-content p {
                        margin-bottom: 1rem;
                    }
                    .slide-content ul, .slide-content ol {
                        margin-left: 1.5rem;
                        margin-bottom: 1rem;
                    }
                    .slide-footer {
                        margin-top: 1.5rem;
                        text-align: center;
                    }
                    .slide-footer audio {
                        width: 100%;
                        max-width: 600px;
                        border-radius: 30px;
                    }

                    /* Quiz Slide */
                    .quiz-slide {
                        flex-direction: column;
                        padding: 3rem 4rem;
                        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                        justify-content: center;
                    }
                    .quiz-header {
                        text-align: center;
                        margin-bottom: 2rem;
                    }
                    .quiz-badge {
                        display: inline-block;
                        background: #ff6b6b;
                        color: white;
                        padding: 0.75rem 2rem;
                        border-radius: 25px;
                        font-size: 1.2rem;
                        font-weight: 700;
                        box-shadow: 0 5px 15px rgba(255,107,107,0.3);
                    }
                    .quiz-question {
                        font-size: 2rem;
                        font-weight: 700;
                        color: #2d3748;
                        text-align: center;
                        margin-bottom: 2rem;
                        padding: 0 2rem;
                    }
                    .quiz-options {
                        list-style: none;
                        max-width: 800px;
                        margin: 0 auto 2rem;
                    }
                    .quiz-option {
                        background: white;
                        margin-bottom: 1rem;
                        padding: 1.5rem;
                        border-radius: 15px;
                        display: flex;
                        align-items: center;
                        gap: 1.5rem;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                        transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s;
                        cursor: pointer;
                    }
                    .quiz-option:hover:not(.answered) {
                        transform: translateY(-3px);
                        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    }
                    .quiz-option.answered {
                        cursor: default;
                        opacity: 0.6;
                    }
                    .quiz-option.selected.correct {
                        background: #48bb78;
                        border: 2px solid #38a169;
                    }
                    .quiz-option.selected.correct .option-letter {
                        background: #38a169;
                    }
                    .quiz-option.selected.correct .option-text {
                        color: white;
                    }
                    .quiz-option.selected.incorrect {
                        background: #f56565;
                        border: 2px solid #e53e3e;
                    }
                    .quiz-option.selected.incorrect .option-letter {
                        background: #e53e3e;
                    }
                    .quiz-option.selected.incorrect .option-text {
                        color: white;
                    }
                    .quiz-option.answered.correct:not(.selected) {
                        background: #c6f6d5;
                        border: 2px solid #48bb78;
                    }
                    .quiz-option.answered.correct:not(.selected) .option-letter {
                        background: #48bb78;
                    }
                    .option-letter {
                        background: #667eea;
                        color: white;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 1.2rem;
                        flex-shrink: 0;
                        transition: background-color 0.3s;
                    }
                    .option-text {
                        color: #2d3748;
                        font-size: 1.1rem;
                        font-weight: 500;
                        transition: color 0.3s;
                    }
                    .quiz-answer {
                        text-align: center;
                        padding: 1rem 2rem;
                        border-radius: 15px;
                        font-size: 1.2rem;
                        max-width: 600px;
                        margin: 0 auto;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    }
                    .answer-feedback.correct {
                        background: #48bb78;
                        color: white;
                    }
                    .answer-feedback.incorrect {
                        background: #f56565;
                        color: white;
                    }

                    /* Completion Slide */
                    .completion-slide {
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 3rem;
                    }
                    .completion-content {
                        text-align: center;
                        color: white;
                        animation: fadeInUp 1s ease-out;
                    }
                    .celebration-icon {
                        font-size: 6rem;
                        margin-bottom: 1rem;
                        animation: bounce 1s infinite;
                    }
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-20px); }
                    }
                    .completion-title {
                        font-size: 3.5rem;
                        font-weight: 700;
                        margin-bottom: 1rem;
                        text-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    }
                    .completion-message {
                        font-size: 1.5rem;
                        margin-bottom: 3rem;
                        opacity: 0.9;
                    }
                    .completion-stats {
                        display: flex;
                        gap: 3rem;
                        justify-content: center;
                        margin-bottom: 3rem;
                    }
                    .stat-item {
                        background: rgba(255,255,255,0.2);
                        padding: 2rem 3rem;
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    }
                    .stat-number {
                        font-size: 3rem;
                        font-weight: 700;
                        margin-bottom: 0.5rem;
                    }
                    .stat-label {
                        font-size: 1rem;
                        opacity: 0.9;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .completion-footer {
                        font-size: 1.2rem;
                        opacity: 0.8;
                        font-style: italic;
                    }

                    /* Navigation Buttons */
                    .nav-btn {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        background: rgba(255,255,255,0.9);
                        color: #667eea;
                        border: none;
                        padding: 1.2rem 1.5rem;
                        cursor: pointer;
                        z-index: 10;
                        border-radius: 50%;
                        font-size: 1.5rem;
                        font-weight: 700;
                        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                        transition: all 0.3s;
                    }
                    .nav-btn:hover {
                        background: white;
                        transform: translateY(-50%) scale(1.1);
                        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                    }
                    #prevBtn { left: 2rem; }
                    #nextBtn { right: 2rem; }

                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
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

                    function resetQuiz(slide) {
                        if (!slide.dataset.quiz) return;

                        // Reset all options
                        const options = slide.querySelectorAll('.quiz-option');
                        options.forEach(option => {
                            option.classList.remove('answered', 'selected', 'correct', 'incorrect');
                        });

                        // Hide answer feedback
                        const answerDiv = slide.querySelector('.quiz-answer');
                        if (answerDiv) {
                            answerDiv.style.display = 'none';
                            answerDiv.querySelector('.answer-feedback').textContent = '';
                            answerDiv.querySelector('.answer-feedback').className = 'answer-feedback';
                        }
                    }

                    function handleQuizAnswer(option, slide) {
                        // Check if already answered
                        if (option.classList.contains('answered')) return;

                        const isCorrect = option.dataset.correct === 'true';

                        // Mark all options as answered
                        const allOptions = slide.querySelectorAll('.quiz-option');
                        allOptions.forEach(opt => {
                            opt.classList.add('answered');
                            if (opt.dataset.correct === 'true') {
                                opt.classList.add('correct');
                            }
                        });

                        // Mark the selected option
                        option.classList.add('selected');
                        if (isCorrect) {
                            option.classList.add('correct');
                        } else {
                            option.classList.add('incorrect');
                        }

                        // Show feedback
                        const answerDiv = slide.querySelector('.quiz-answer');
                        const feedbackDiv = answerDiv.querySelector('.answer-feedback');
                        if (isCorrect) {
                            feedbackDiv.textContent = '🎉 Correct!';
                            feedbackDiv.classList.add('correct');
                        } else {
                            const correctAnswer = Array.from(allOptions).find(opt => opt.dataset.correct === 'true').dataset.answer;
                            feedbackDiv.textContent = '❌ Incorrect. The correct answer is: ' + correctAnswer;
                            feedbackDiv.classList.add('incorrect');
                        }
                        answerDiv.style.display = 'block';
                    }

                    function initQuiz(slide) {
                        if (!slide.dataset.quiz) return;

                        const options = slide.querySelectorAll('.quiz-option');
                        options.forEach(option => {
                            option.addEventListener('click', () => handleQuizAnswer(option, slide));
                        });
                    }

                    function showSlide(index) {
                        slides.forEach((slide, i) => {
                            slide.classList.toggle('active', i === index);
                            const media = slide.querySelector('video, audio');
                            if (media) {
                                if (i === index) {
                                    media.play().catch(e=>console.log("Autoplay blocked"));
                                } else {
                                    media.pause();
                                }
                            }

                            // Reset quiz when navigating away or to it
                            if (slide.dataset.quiz) {
                                resetQuiz(slide);
                            }
                        });
                    }

                    // Initialize all quizzes
                    slides.forEach(slide => {
                        if (slide.dataset.quiz) {
                            initQuiz(slide);
                        }
                    });

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
            const lectureId = lecturePlan.lecture_id || kebabCase(lecturePlan.unit_title);
            const filePath = `lectures/${lecturePlan.grade}/${lectureId}.html`;
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
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 md:p-12">
                    {/* User Profile Header */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <img
                                src={INITIAL_IMAGE_URL}
                                alt="Teacher Profile"
                                className="w-16 h-16 rounded-full object-cover border-4 border-indigo-500 shadow-lg"
                            />
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Welcome, Alex!</h2>
                                <p className="text-sm text-gray-500">Ready to create your next lesson</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSelectKey}
                            className="flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            <KeyIcon />
                            <span className="hidden sm:inline">{isApiKeySelected ? "API Key Connected" : "Connect API Key"}</span>
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                            Gemini Academy
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Transform your lesson plans into engaging multimedia presentations with AI-powered audio, images, and video.
                        </p>
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-center mb-8">
                        <button
                            onClick={handleGenerateLecture}
                            disabled={isLoading || !isApiKeySelected}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:transform-none text-lg"
                        >
                            ✨ Generate Lecture
                        </button>
                    </div>

                    {!isApiKeySelected && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded">
                            <p className="text-sm text-amber-800">
                                <strong>API Key Required:</strong> Connect your API key to generate videos.
                                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900 ml-1">
                                    Learn more
                                </a>
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Optional Overrides */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Optional: Customize Your Lesson
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="json-upload" className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer">
                                    <DocumentIcon />
                                    <span className="truncate text-sm">{lecturePlanFile ? lecturePlanFile.name : 'Upload Lesson Plan (.json)'}</span>
                                </label>
                                <input id="json-upload" type="file" className="hidden" accept=".json" onChange={handleLectureFileChange} />
                            </div>
                            <div>
                                <label htmlFor="image-upload" className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer">
                                    <ImageIcon />
                                    <span className="truncate text-sm">{initialImageFile ? initialImageFile.name : 'Upload Your Photo (.jpg)'}</span>
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
                <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center relative p-8">
                    <div className="absolute top-12 left-0 right-0 text-center z-10">
                        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl animate-fade-in">
                            {lecturePlan.unit_title}
                        </h1>
                    </div>
                    <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl">
                        <video
                            key={generatedAssets.videoUrl}
                            src={generatedAssets.videoUrl}
                            controls
                            autoPlay
                            muted
                            loop
                            className="w-full h-auto"
                        />
                    </div>
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
                    imageUrl={generatedAssets.imageUrls[themeIndex]}
                    slideNumber={slideIndex}
                    totalSlides={totalSlides - 2}
                />
            );
        } else if (slideIndex < totalSlides - 1) {
            const quizIndex = slideIndex - 1 - lecturePlan.content_and_themes.length;
            const question = generatedAssets.quiz.questions[quizIndex];
            slideComponent = (
                <QuizSlide
                    key={slideIndex}
                    question={question}
                    questionNumber={quizIndex + 1}
                    totalQuestions={generatedAssets.quiz.questions.length}
                />
            );
        } else {
            // Completion slide
            slideComponent = (
                <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-8">
                    <div className="text-center text-white">
                        <div className="text-8xl mb-6 animate-bounce">🎉</div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-2xl">
                            Woohoo! You're Done!
                        </h1>
                        <p className="text-2xl mb-8 opacity-90">
                            Congratulations on completing this lesson!
                        </p>
                        <div className="flex gap-8 justify-center mb-8">
                            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
                                <div className="text-5xl font-bold mb-2">{lecturePlan.content_and_themes.length}</div>
                                <div className="text-sm uppercase tracking-wider opacity-90">Topics Covered</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
                                <div className="text-5xl font-bold mb-2">{generatedAssets.quiz.questions.length}</div>
                                <div className="text-sm uppercase tracking-wider opacity-90">Questions Answered</div>
                            </div>
                        </div>
                        <p className="text-xl opacity-80 italic">
                            Great job learning about {lecturePlan.unit_title}!
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow-2xl p-4">
                <div className="flex-grow relative rounded-xl overflow-hidden shadow-lg">
                   {slideComponent}
                </div>
                <div className="flex-shrink-0 flex items-center justify-between p-4 mt-2 bg-gray-50 rounded-lg">
                    <button onClick={goToPrevSlide} disabled={currentSlide === 0} className="p-3 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors disabled:bg-gray-200"><ArrowLeftIcon /></button>
                    <span className="text-gray-700 font-semibold">Slide {currentSlide + 1} / {totalSlides}</span>
                    <button onClick={goToNextSlide} disabled={currentSlide === totalSlides - 1} className="p-3 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors disabled:bg-gray-200"><ArrowRightIcon /></button>
                </div>
                 <div className="text-center pb-2 pt-4">
                     {finalLectureUrl ? (
                         <div className="bg-green-50 border-2 border-green-200 p-4 rounded-xl inline-flex flex-col items-center gap-3">
                             <p className="font-bold text-green-700 text-lg">🎉 Lecture Published Successfully!</p>
                             {publishedFilePath && (
                                <p className="text-sm text-gray-600">
                                    Saved to: <code className="bg-white px-3 py-1 rounded-md text-xs font-mono border border-gray-200">{publishedFilePath}</code>
                                </p>
                             )}
                             <a
                                 href={finalLectureUrl}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
                             >
                                 <LinkIcon /> View Your Lecture
                             </a>
                         </div>
                     ) : (
                         <button
                             onClick={handlePublishLecture}
                             disabled={isPublishing}
                             className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
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
        <main className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 md:p-8" style={{minHeight: 'max(100vh, 720px)'}}>
            <div className="w-full h-full max-w-6xl flex items-center justify-center">
                {isLoading ? (
                    <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md">
                        <Spinner />
                        <h2 className="text-2xl font-semibold mt-6 text-indigo-700">{status.stage} - {status.message}</h2>
                        <p className="text-gray-600 mt-2">{displayMessage}</p>
                    </div>
                ) : (
                    renderContent()
                )}
            </div>
        </main>
    );
}