
import React, { useEffect, useRef } from 'react';

interface SlideProps {
    title: string;
    content: string;
    audioUrl: string;
    imageUrl: string;
    slideNumber: number;
    totalSlides: number;
}

export const Slide: React.FC<SlideProps> = ({ title, content, audioUrl, imageUrl, slideNumber, totalSlides }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
        }
    }, [audioUrl]);

    return (
        <div className="w-full h-full flex flex-col p-6 md:p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
            {/* Header */}
            <div className="flex-shrink-0 mb-4">
                <span className="inline-block bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Slide {slideNumber} of {totalSlides}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-3">{title}</h2>
            </div>

            {/* Body - Image and Content Side by Side */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                {/* Image */}
                <div className="rounded-2xl overflow-hidden shadow-xl bg-white flex items-center justify-center">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-xl p-6 overflow-y-auto">
                    <div
                        className="prose prose-lg max-w-none prose-headings:text-indigo-600 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            </div>

            {/* Footer - Audio */}
            <div className="flex-shrink-0 mt-6 flex justify-center">
                <audio ref={audioRef} key={audioUrl} controls src={audioUrl} className="w-full max-w-2xl rounded-full shadow-lg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        </div>
    );
};
