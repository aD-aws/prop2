'use client';

import React, { useState } from 'react';

interface CustomProjectFormProps {
  onSubmit: (description: string) => void;
  onCancel: () => void;
}

export function CustomProjectForm({ onSubmit, onCancel }: CustomProjectFormProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateDescription = (text: string): string[] => {
    const validationErrors: string[] = [];
    
    if (text.trim().length < 10) {
      validationErrors.push('Please provide at least 10 characters describing your project');
    }
    
    if (text.trim().length > 1000) {
      validationErrors.push('Description must be less than 1000 characters');
    }
    
    // Check for meaningful content (not just repeated characters or spaces)
    const meaningfulContent = text.trim().replace(/\s+/g, ' ');
    if (meaningfulContent.length < text.trim().length * 0.5) {
      validationErrors.push('Please provide a more detailed description of your project');
    }
    
    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateDescription(description);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      await onSubmit(description.trim());
    } catch {
      setErrors(['An error occurred while processing your project description. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const exampleProjects = [
    "I want to convert my garage into a home office with proper insulation, electrical work, and heating",
    "Planning to renovate my Victorian terrace kitchen with period-appropriate features and modern appliances",
    "Need to install a home cinema room in my basement with soundproofing and custom seating",
    "Looking to create an accessible bathroom for elderly parent with walk-in shower and grab rails",
    "Want to build a garden studio for art work with skylights and proper ventilation"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Describe Your Project</h2>
              <p className="text-gray-600 mt-1">
                Tell us about your unique home improvement project and our AI will help categorize and plan it
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Describe your project in detail. Include what you want to achieve, which rooms or areas are involved, any specific requirements, and your goals for the project..."
                rows={6}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.length > 0 ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              <div className="mt-1 text-sm text-gray-500">
                {description.length}/1000 characters
              </div>
            </div>

            {/* Validation Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Please fix the following issues:</h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Examples */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Example project descriptions:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                {exampleProjects.map((example, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Processing Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">How our AI categorization works:</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Our AI will analyze your description and suggest the most appropriate project category. 
                    If it matches an existing type with high confidence, we&apos;ll use that. Otherwise, we&apos;ll 
                    create a custom project plan tailored to your specific needs.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || description.trim().length < 10}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Analyze Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}