import React from 'react';
import { Grade } from '../types';
import GradeCard from './GradeCard';

interface GradeSelectorProps {
  grades: Grade[];
  onSelectGrade: (grade: Grade) => void;
}

const GradeSelector: React.FC<GradeSelectorProps> = ({ grades, onSelectGrade }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-extrabold text-slate-700">Select Your Grade Level</h2>
        <p className="mt-2 text-lg text-slate-500">Choose a grade to see the available lectures.</p>
      </div>
      <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {grades.map((grade) => (
            <GradeCard key={grade.id} grade={grade} onSelect={onSelectGrade} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GradeSelector;
