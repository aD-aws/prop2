'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = false,
  className = ''
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        {showPercentage && (
          <span className="text-sm text-gray-600">{Math.round(clampedProgress)}%</span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      
      {/* Progress milestones */}
      <div className="flex justify-between mt-1">
        <div className="flex flex-col items-center">
          <div className={`w-2 h-2 rounded-full ${clampedProgress >= 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500 mt-1">Start</span>
        </div>
        <div className="flex flex-col items-center">
          <div className={`w-2 h-2 rounded-full ${clampedProgress >= 25 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500 mt-1">25%</span>
        </div>
        <div className="flex flex-col items-center">
          <div className={`w-2 h-2 rounded-full ${clampedProgress >= 50 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500 mt-1">50%</span>
        </div>
        <div className="flex flex-col items-center">
          <div className={`w-2 h-2 rounded-full ${clampedProgress >= 75 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500 mt-1">75%</span>
        </div>
        <div className="flex flex-col items-center">
          <div className={`w-2 h-2 rounded-full ${clampedProgress >= 100 ? 'bg-green-600' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500 mt-1">Complete</span>
        </div>
      </div>
    </div>
  );
};