
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
            return "bg-white hover:bg-indigo-50 hover:border-indigo-400 text-gray-800";
        }
        if (option === question.answer) {
            return "bg-green-500 text-white border-green-600";
        }
        if (option === selectedOption) {
            return "bg-red-500 text-white border-red-600";
        }
        return "bg-gray-100 text-gray-400 border-gray-300 opacity-60";
    };

    return (
        <div className="w-full h-full flex flex-col p-8 md:p-12 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 justify-center">
            <div className="flex-shrink-0 mb-8 text-center">
                <span className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg">
                    Quiz Question {questionNumber}/{totalQuestions}
                </span>
                <h3 className="text-3xl md:text-4xl font-bold mt-6 text-gray-800 max-w-3xl mx-auto">
                    {question.question}
                </h3>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full mb-4">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleOptionSelect(option)}
                        disabled={isAnswered}
                        className={`p-6 rounded-2xl text-left text-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none border-2 shadow-lg flex items-center gap-4 ${getOptionClass(option)}`}
                    >
                        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xl">
                            {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">{option}</span>
                    </button>
                ))}
            </div>
            {isAnswered && (
                <div className="flex-shrink-0 mt-4 text-center">
                    {selectedOption === question.answer ? (
                        <div className="bg-green-500 text-white px-8 py-4 rounded-2xl text-2xl font-bold inline-block shadow-xl">
                            🎉 Correct!
                        </div>
                    ) : (
                        <div className="bg-red-500 text-white px-8 py-4 rounded-2xl text-xl font-bold inline-block shadow-xl">
                            ❌ Incorrect. The correct answer is: {question.answer}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
