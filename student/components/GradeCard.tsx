import React from 'react';
import { Grade } from '../types';

interface GradeCardProps {
  grade: Grade;
  onSelect: (grade: Grade) => void;
}

const SchoolIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-2.072-1.037A48.282 48.282 0 0112 3.493a48.282 48.282 0 0111.824 5.618l-2.072 1.037m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 15a.75.75 0 100-1.5.75.75 0 000 1.5z" />
    </svg>
);


const GradeCard: React.FC<GradeCardProps> = ({ grade, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(grade)}
      className="group flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-2 border-transparent hover:border-blue-500"
    >
      <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        <SchoolIcon />
      </div>
      <h3 className="text-xl font-bold text-slate-800">{grade.name}</h3>
      <p className="text-sm text-slate-500 mt-2">View lectures</p>
    </button>
  );
};

export default GradeCard;
