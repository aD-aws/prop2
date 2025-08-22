'use client';

import React, { useState } from 'react';
import { FeedbackSubmissionRequest } from '../../lib/types';

interface FeedbackSubmissionFormProps {
  projectId: string;
  builderId: string;
  builderName: string;
  onSubmit: (feedback: FeedbackSubmissionRequest) => Promise<void>;
  onCancel: () => void;
}

export const FeedbackSubmissionForm: React.FC<FeedbackSubmissionFormProps> = ({
  projectId,
  builderId,
  builderName,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    rating: 5,
    overallSatisfaction: 5,
    qualityRating: 5,
    timelinessRating: 5,
    communicationRating: 5,
    cleanlinessRating: 5,
    professionalismRating: 5,
    valueForMoneyRating: 5,
    writtenFeedback: '',
    wouldRecommend: true,
    improvementSuggestions: '',
    isPublic: true
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  const handleRatingChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + photos.length > 10) {
      alert('Maximum 10 photos allowed');
      return;
    }

    setPhotos(prev => [...prev, ...files]);

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotoPreview(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreview(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const feedbackRequest: FeedbackSubmissionRequest = {
        projectId,
        ...formData,
        photos
      };

      await onSubmit(feedbackRequest);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating: React.FC<{ 
    value: number; 
    onChange: (value: number) => void;
    label: string;
  }> = ({ value, onChange, label }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl ${
              star <= value ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Rate Your Experience with {builderName}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <StarRating
          value={formData.rating}
          onChange={(value) => handleRatingChange('rating', value)}
          label="Overall Rating"
        />

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StarRating
            value={formData.qualityRating}
            onChange={(value) => handleRatingChange('qualityRating', value)}
            label="Quality of Work"
          />
          
          <StarRating
            value={formData.timelinessRating}
            onChange={(value) => handleRatingChange('timelinessRating', value)}
            label="Timeliness"
          />
          
          <StarRating
            value={formData.communicationRating}
            onChange={(value) => handleRatingChange('communicationRating', value)}
            label="Communication"
          />
          
          <StarRating
            value={formData.cleanlinessRating}
            onChange={(value) => handleRatingChange('cleanlinessRating', value)}
            label="Cleanliness"
          />
          
          <StarRating
            value={formData.professionalismRating}
            onChange={(value) => handleRatingChange('professionalismRating', value)}
            label="Professionalism"
          />
          
          <StarRating
            value={formData.valueForMoneyRating}
            onChange={(value) => handleRatingChange('valueForMoneyRating', value)}
            label="Value for Money"
          />
        </div>

        {/* Written Feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Written Feedback
          </label>
          <textarea
            value={formData.writtenFeedback}
            onChange={(e) => setFormData(prev => ({ ...prev, writtenFeedback: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us about your experience..."
            required
          />
        </div>

        {/* Recommendation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Would you recommend this builder?
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.wouldRecommend}
                onChange={() => setFormData(prev => ({ ...prev, wouldRecommend: true }))}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.wouldRecommend}
                onChange={() => setFormData(prev => ({ ...prev, wouldRecommend: false }))}
                className="mr-2"
              />
              No
            </label>
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Completion Photos (Optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload up to 10 photos showing the completed work
          </p>
        </div>

        {/* Photo Previews */}
        {photoPreview.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Photo Previews</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photoPreview.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Suggestions for Improvement (Optional)
          </label>
          <textarea
            value={formData.improvementSuggestions}
            onChange={(e) => setFormData(prev => ({ ...prev, improvementSuggestions: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any suggestions for how the builder could improve?"
          />
        </div>

        {/* Privacy Setting */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              Allow this feedback to be shown to other homeowners (your name will not be displayed)
            </span>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};