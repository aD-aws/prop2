'use client';

import React from 'react';
import { BuilderRating, ProjectFeedback } from '../../lib/types';

interface BuilderRatingDisplayProps {
  builderRating: BuilderRating;
  showDetailedFeedback?: boolean;
  compact?: boolean;
}

export const BuilderRatingDisplay: React.FC<BuilderRatingDisplayProps> = ({
  builderRating,
  showDetailedFeedback = false,
  compact = false
}) => {
  const StarDisplay: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({ 
    rating, 
    size = 'md' 
  }) => {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    return (
      <div className={`flex items-center ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${
              star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-gray-600">
          {rating.toFixed(1)} ({builderRating.totalReviews} reviews)
        </span>
      </div>
    );
  };

  const RatingBar: React.FC<{ 
    label: string; 
    rating: number; 
    maxRating?: number 
  }> = ({ label, rating, maxRating = 5 }) => {
    const percentage = (rating / maxRating) * 100;
    
    return (
      <div className="flex items-center space-x-3 mb-2">
        <span className="text-sm text-gray-600 w-24 text-right">{label}:</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-8">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const FeedbackCard: React.FC<{ feedback: ProjectFeedback }> = ({ feedback }) => (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-2">
        <StarDisplay rating={feedback.rating} size="sm" />
        <span className="text-sm text-gray-500">
          {new Date(feedback.createdAt).toLocaleDateString()}
        </span>
      </div>
      
      <p className="text-gray-700 mb-2">{feedback.writtenFeedback}</p>
      
      {feedback.wouldRecommend && (
        <div className="flex items-center text-green-600 text-sm">
          <span className="mr-1">✓</span>
          Would recommend this builder
        </div>
      )}
      
      {feedback.completionPhotos.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Completion Photos</h5>
          <div className="grid grid-cols-3 gap-2">
            {feedback.completionPhotos.slice(0, 3).map((photo, index) => (
              <img
                key={photo.id}
                src={photo.url}
                alt={`Completion photo ${index + 1}`}
                className="w-full h-16 object-cover rounded"
              />
            ))}
            {feedback.completionPhotos.length > 3 && (
              <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
                +{feedback.completionPhotos.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center space-x-4">
        <StarDisplay rating={builderRating.overallRating} size="sm" />
        <span className="text-sm text-green-600">
          {builderRating.recommendationPercentage.toFixed(0)}% recommend
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Builder Rating</h3>
        <StarDisplay rating={builderRating.overallRating} size="lg" />
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {builderRating.recommendationPercentage.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Would recommend</div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {builderRating.totalReviews}
            </div>
            <div className="text-sm text-gray-600">Total reviews</div>
          </div>
        </div>
      </div>

      {/* Detailed Ratings */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Ratings</h4>
        <RatingBar label="Quality" rating={builderRating.qualityAverage} />
        <RatingBar label="Timeliness" rating={builderRating.timelinessAverage} />
        <RatingBar label="Communication" rating={builderRating.communicationAverage} />
        <RatingBar label="Cleanliness" rating={builderRating.cleanlinessAverage} />
        <RatingBar label="Professionalism" rating={builderRating.professionalismAverage} />
        <RatingBar label="Value" rating={builderRating.valueForMoneyAverage} />
      </div>

      {/* Rating Distribution */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = builderRating.ratingDistribution[
              `${stars === 5 ? 'five' : stars === 4 ? 'four' : stars === 3 ? 'three' : stars === 2 ? 'two' : 'one'}Stars` as keyof typeof builderRating.ratingDistribution
            ];
            const percentage = builderRating.totalReviews > 0 ? (count / builderRating.totalReviews) * 100 : 0;
            
            return (
              <div key={stars} className="flex items-center space-x-3">
                <span className="text-sm w-8">{stars}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Feedback */}
      {showDetailedFeedback && builderRating.recentFeedback.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h4>
          {builderRating.recentFeedback
            .filter(feedback => feedback.isPublic)
            .map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
        </div>
      )}
    </div>
  );
};