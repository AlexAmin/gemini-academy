
import React from 'react';
import { Lecture } from '../types';

interface LectureViewerProps {
  lecture: Lecture;
  onGoBack: () => void;
}

const LectureViewer: React.FC<LectureViewerProps> = ({ lecture, onGoBack }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-700">{lecture.title}</h2>
        <button
          onClick={onGoBack}
          className="flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
          </svg>
          Back to Lectures
        </button>
      </div>
      <div className="flex-grow bg-white rounded-lg shadow-inner overflow-hidden border">
        <iframe
          src={lecture.url}
          title={lecture.title}
          className="w-full h-full border-0"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default LectureViewer;
