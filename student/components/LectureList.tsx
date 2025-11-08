import React from 'react';
import { Lecture } from '../types';
import LectureCard from './LectureCard';

interface LectureListProps {
  lectures: Lecture[];
  gradeName: string;
  onSelectLecture: (lecture: Lecture) => void;
  onGoBack: () => void;
}

const LectureList: React.FC<LectureListProps> = ({ lectures, gradeName, onSelectLecture, onGoBack }) => {
  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="text-left">
                <h2 className="text-4xl font-extrabold text-slate-700">Lectures for {gradeName}</h2>
                <p className="mt-2 text-lg text-slate-500">Select a lecture to begin your learning adventure.</p>
            </div>
            <button
                onClick={onGoBack}
                className="flex items-center px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75 transition-colors"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
                Back to Grades
            </button>
      </div>

      {lectures.length > 0 ? (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {lectures.map((lecture) => (
                <LectureCard key={lecture.id} lecture={lecture} onSelect={onSelectLecture} />
            ))}
            </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 bg-gray-100 p-8 rounded-lg">
            <p className="text-2xl font-bold mb-2">No Lectures Found</p>
            <p>There are no lectures available for {gradeName} at the moment. Please check back later!</p>
        </div>
      )}
    </div>
  );
};

export default LectureList;
