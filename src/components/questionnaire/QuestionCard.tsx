'use client';

import React, { useState } from 'react';
import { Question } from '../../lib/services/questionnaireService';
import { Button } from '../ui/Button';

interface QuestionCardProps {
  question: Question;
  onAnswer: (questionId: string, answer: any) => void;
  isLoading: boolean;
  isLastQuestion: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  isLoading,
  isLastQuestion
}) => {
  const [answer, setAnswer] = useState<any>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateAnswer = (value: any): boolean => {
    setValidationError(null);

    if (!question.validation) return true;

    if (question.validation.required && (value === null || value === undefined || value === '')) {
      setValidationError('This question is required');
      return false;
    }

    if (question.type === 'number' && isNaN(Number(value))) {
      setValidationError('Please enter a valid number');
      return false;
    }

    if (question.validation.min !== undefined && Number(value) < question.validation.min) {
      setValidationError(`Value must be at least ${question.validation.min}`);
      return false;
    }

    if (question.validation.max !== undefined && Number(value) > question.validation.max) {
      setValidationError(`Value must be at most ${question.validation.max}`);
      return false;
    }

    if (question.validation.pattern && typeof value === 'string') {
      const regex = new RegExp(question.validation.pattern);
      if (!regex.test(value)) {
        setValidationError('Please enter a valid format');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateAnswer(answer)) {
      onAnswer(question.id, answer);
      setAnswer(''); // Reset for next question
    }
  };

  const handleInputChange = (value: any) => {
    setAnswer(value);
    setValidationError(null);
  };

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your answer..."
            disabled={isLoading}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={answer}
            onChange={(e) => handleInputChange(Number(e.target.value))}
            min={question.validation?.min}
            max={question.validation?.max}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter a number..."
            disabled={isLoading}
          />
        );

      case 'select':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answer === option}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(answer) && answer.includes(option)}
                  onChange={(e) => {
                    const currentAnswers = Array.isArray(answer) ? answer : [];
                    if (e.target.checked) {
                      handleInputChange([...currentAnswers, option]);
                    } else {
                      handleInputChange(currentAnswers.filter(a => a !== option));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex space-x-4">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={answer === true}
                onChange={() => handleInputChange(true)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={isLoading}
              />
              <span className="ml-3 text-gray-700">Yes</span>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={answer === false}
                onChange={() => handleInputChange(false)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={isLoading}
              />
              <span className="ml-3 text-gray-700">No</span>
            </label>
          </div>
        );

      case 'range':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min={question.validation?.min || 0}
              max={question.validation?.max || 100}
              value={answer || question.validation?.min || 0}
              onChange={(e) => handleInputChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={isLoading}
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{question.validation?.min || 0}</span>
              <span className="font-medium">{answer || question.validation?.min || 0}</span>
              <span>{question.validation?.max || 100}</span>
            </div>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your answer..."
            disabled={isLoading}
          />
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Question Text */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {question.text}
        </h2>
        {question.validation?.required && (
          <p className="text-sm text-red-600">* Required</p>
        )}
      </div>

      {/* Input Field */}
      <div className="mb-6">
        {renderInput()}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{validationError}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !answer}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : isLastQuestion ? (
            'Complete'
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>
  );
};