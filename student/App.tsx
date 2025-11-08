import React, { useState, useEffect } from 'react';
import { listGrades, listLecturesByGrade } from './services/firebaseService';
import { Lecture, Grade } from './types';
import LectureList from './components/LectureList';
import LectureViewer from './components/LectureViewer';
import LoadingSpinner from './components/LoadingSpinner';
import GradeSelector from './components/GradeSelector';

const App: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading...');

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoading(true);
        setLoadingMessage('Loading Grade Levels...');
        setError(null);
        const fetchedGrades = await listGrades();
        setGrades(fetchedGrades);
      } catch (err) {
        setError('Failed to load grade levels. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const handleSelectGrade = async (grade: Grade) => {
    setSelectedGrade(grade);
    try {
        setIsLoading(true);
        setLoadingMessage(`Loading Lectures for ${grade.name}...`);
        setError(null);
        const fetchedLectures = await listLecturesByGrade(grade.id);
        setLectures(fetchedLectures);
    } catch (err) {
        setError(`Failed to load lectures for ${grade.name}. Please try again later.`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectLecture = (lecture: Lecture) => {
    setSelectedLecture(lecture);
  };

  const handleGoBackToLectures = () => {
    setSelectedLecture(null);
  };

  const handleGoBackToGrades = () => {
    setSelectedGrade(null);
    setLectures([]);
    setSelectedLecture(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner message={loadingMessage} />;
    }

    if (error) {
      return (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
          <p className="font-bold">Oops! Something went wrong.</p>
          <p>{error}</p>
        </div>
      );
    }
    
    if (selectedLecture) {
      return <LectureViewer lecture={selectedLecture} onGoBack={handleGoBackToLectures} />;
    }

    if (selectedGrade) {
        return <LectureList 
            lectures={lectures} 
            gradeName={selectedGrade.name}
            onSelectLecture={handleSelectLecture}
            onGoBack={handleGoBackToGrades}
        />;
    }

    if (grades.length === 0) {
        return (
            <div className="text-center text-gray-500 bg-gray-100 p-8 rounded-lg">
                <p className="text-2xl font-bold mb-2">No Grade Levels Found</p>
                <p>It looks like no curriculum has been set up yet. Please check back later!</p>
            </div>
        );
    }

    return <GradeSelector grades={grades} onSelectGrade={handleSelectGrade} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 text-slate-800 font-sans">
      <header className="p-4 border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#grad1)"/>
                    <path d="M2 7V17L12 22V12L2 7Z" fill="url(#grad2)"/>
                    <path d="M22 7V17L12 22V12L22 7Z" fill="url(#grad3)"/>
                    <defs>
                        <linearGradient id="grad1" x1="12" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#60A5FA"/>
                            <stop offset="1" stopColor="#818CF8"/>
                        </linearGradient>
                        <linearGradient id="grad2" x1="2" y1="14.5" x2="12" y2="14.5" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#3B82F6"/>
                            <stop offset="1" stopColor="#6366F1"/>
                        </linearGradient>
                        <linearGradient id="grad3" x1="22" y1="14.5" x2="12" y2="14.5" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#A78BFA"/>
                            <stop offset="1" stopColor="#8B5CF6"/>
                        </linearGradient>
                    </defs>
                </svg>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                    Gemini Academy
                </h1>
            </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Gemini Academy. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;