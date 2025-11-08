
import React from 'react';
import { Lecture } from '../types';

interface LectureCardProps {
  lecture: Lecture;
  onSelect: (lecture: Lecture) => void;
}

const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const LectureCard: React.FC<LectureCardProps> = ({ lecture, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(lecture)}
      className="group flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-2 border-transparent hover:border-blue-500"
    >
      <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        <BookIcon />
      </div>
      <h3 className="text-lg font-bold text-slate-800">{lecture.title}</h3>
      <p className="text-sm text-slate-500 mt-2">Click to start lesson</p>
    </button>
  );
};

export default LectureCard;
