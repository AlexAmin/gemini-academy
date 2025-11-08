
import React, { useState } from 'react';
import type { QuizQuestion } from '../types';

interface QuizSlideProps {
    question: QuizQuestion;
    questionNumber: number;
    totalQuestions: number;
}

export const QuizSlide: React.FC<QuizSlideProps> = ({ question, questionNumber, totalQuestions }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const handleOptionSelect = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        setIsAnswered(true);
    };

    const getOptionClass = (option: string) => {
        if (!isAnswered) {
            return "bg-slate-700 hover:bg-sky-700";
        }
        if (option === question.answer) {
            return "bg-green-600";
        }
        if (option === selectedOption) {
            return "bg-red-600";
        }
        return "bg-slate-800 opacity-60";
    };

    return (
        <div className="w-full h-full flex flex-col p-8 md:p-12 text-white bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="flex-shrink-0 mb-6">
                <p className="text-sky-300 font-semibold">Quiz - Question {questionNumber}/{totalQuestions}</p>
                <h3 className="text-2xl md:text-3xl font-bold mt-2">{question.question}</h3>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleOptionSelect(option)}
                        disabled={isAnswered}
                        className={`p-4 rounded-lg text-left text-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none ${getOptionClass(option)}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            {isAnswered && (
                <div className="flex-shrink-0 mt-6 text-center text-xl font-bold">
                    {selectedOption === question.answer ? (
                        <p className="text-green-400">Correct!</p>
                    ) : (
                        <p className="text-red-400">Incorrect. The correct answer is: {question.answer}</p>
                    )}
                </div>
            )}
        </div>
    );
};
