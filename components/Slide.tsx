
import React, { useEffect, useRef } from 'react';

interface SlideProps {
    title: string;
    content: string;
    audioUrl: string;
}

export const Slide: React.FC<SlideProps> = ({ title, content, audioUrl }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
        }
    }, [audioUrl]);

    return (
        <div className="w-full h-full flex flex-col p-8 md:p-12 text-white bg-gradient-to-br from-slate-800 to-slate-900 overflow-y-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-sky-300 mb-6 flex-shrink-0">{title}</h2>
            <div 
                className="flex-grow prose prose-xl prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
            />
            <div className="flex-shrink-0 mt-8">
                <audio ref={audioRef} key={audioUrl} controls src={audioUrl} className="w-full">
                    Your browser does not support the audio element.
                </audio>
            </div>
        </div>
    );
};
