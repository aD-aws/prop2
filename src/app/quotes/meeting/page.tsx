'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BuilderSelectionService, BuilderSelection, MeetingFeedback } from '@/lib/services/builderSelectionService';
import { QuoteManagementService } from '@/lib/services/quoteManagementService';
import { Quote } from '@/lib/types';

export default function MeetingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectionId = searchParams.get('selectionId');

  const [selection, setSelection] = useState<BuilderSelection | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'schedule' | 'feedback' | 'complete'>('schedule');

  // Meeting scheduling form
  const [meetingForm, setMeetingForm] = useState({
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    attendees: ['']
  });

  // Meeting feedback form
  const [feedbackForm, setFeedbackForm] = useState<MeetingFeedback>({
    overallImpression: 'neutral' as const,
    professionalism: 3,
    communication: 3,
    expertise: 3,
    trustworthiness: 3,
    concerns: [],
    positives: [],
    willingToProceed: false,
    additionalNotes: ''
  });

  const [newConcern, setNewConcern] = useState('');
  const [newPositive, setNewPositive] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectionId) {
      loadSelectionData();
    } else {
      setError('Selection ID is required');
      setLoading(false);
    }
  }, [selectionId]);

  const loadSelectionData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectionId) {
        setError('Selection ID is required');
        return;
      }

      // Load selection
      const selectionResult = await BuilderSelectionService.getSelection(selectionId);
      if (!selectionResult.success) {
        setError(selectionResult.error || 'Failed to load selection');
        return;
      }

      setSelection(selectionResult.selection!);

      // Load quote details
      const quoteResult = await QuoteManagementService.getQuote(selectionResult.selection!.selectedQuoteId);
      if (quoteResult.success && quoteResult.quote) {
        setQuote(quoteResult.quote);
      }

      // Determine current step based on selection status
      if (selectionResult.selection!.status === 'quote_selected') {
        setCurrentStep('schedule');
      } else if (selectionResult.selection!.status === 'meet_scheduled') {
        setCurrentStep('feedback');
      } else {
        setCurrentStep('complete');
      }

    } catch (err) {
      console.error('Error loading selection data:', err);
      setError('Failed to load selection data');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      const result = await BuilderSelectionService.scheduleMeeting(selectionId!, {
        scheduledDate: new Date(meetingForm.scheduledDate + 'T' + meetingForm.scheduledTime),
        scheduledTime: meetingForm.scheduledTime,
        location: meetingForm.location,
        attendees: meetingForm.attendees.filter(email => email.trim())
      });

      if (!result.success) {
        alert(`Failed to schedule meeting: ${result.error}`);
        return;
      }

      setCurrentStep('feedback');
      await loadSelectionData(); // Refresh data
    } catch (err) {
      console.error('Error scheduling meeting:', err);
      alert('Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      const result = await BuilderSelectionService.completeMeeting(
        selectionId!,
        feedbackForm,
        feedbackForm.additionalNotes
      );

      if (!result.success) {
        alert(`Failed to complete meeting: ${result.error}`);
        return;
      }

      setCurrentStep('complete');
      await loadSelectionData(); // Refresh data
    } catch (err) {
      console.error('Error completing meeting:', err);
      alert('Failed to complete meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToContract = async () => {
    try {
      setSubmitting(true);

      const result = await BuilderSelectionService.proceedToContract(selectionId!);

      if (!result.success) {
        alert(`Failed to proceed to contract: ${result.error}`);
        return;
      }

      // Redirect to contract page
      router.push(`/contracts/${result.contractId}`);
    } catch (err) {
      console.error('Error proceeding to contract:', err);
      alert('Failed to proceed to contract');
    } finally {
      setSubmitting(false);
    }
  };

  const addConcern = () => {
    if (newConcern.trim()) {
      setFeedbackForm(prev => ({
        ...prev,
        concerns: [...prev.concerns, newConcern.trim()]
      }));
      setNewConcern('');
    }
  };

  const addPositive = () => {
    if (newPositive.trim()) {
      setFeedbackForm(prev => ({
        ...prev,
        positives: [...prev.positives, newPositive.trim()]
      }));
      setNewPositive('');
    }
  };

  const removeConcern = (index: number) => {
    setFeedbackForm(prev => ({
      ...prev,
      concerns: prev.concerns.filter((_, i) => i !== index)
    }));
  };

  const removePositive = (index: number) => {
    setFeedbackForm(prev => ({
      ...prev,
      positives: prev.positives.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error || !selection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <svg className="h-12 w-12 text-red-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mt-4">Error</h3>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <button
              onClick={() => router.back()}
              className="hover:text-gray-700 transition-colors"
            >
              ← Back to Quotes
            </button>
            <span>/</span>
            <span className="text-gray-900">Meet Before Contract</span>
          </nav>
          
          <h1 className="text-3xl font-bold text-gray-900">Meet Your Selected Builder</h1>
          <p className="text-gray-600 mt-2">
            Schedule and complete your meeting with Builder #{selection.builderId.slice(-6)}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${currentStep === 'schedule' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'schedule' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {currentStep === 'schedule' ? '1' : '✓'}
              </div>
              <span className="ml-2 font-medium">Schedule Meeting</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              ['feedback', 'complete'].includes(currentStep) ? 'bg-green-200' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center ${
              currentStep === 'feedback' ? 'text-blue-600' : 
              currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'feedback' ? 'bg-blue-100' : 
                currentStep === 'complete' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {currentStep === 'complete' ? '✓' : '2'}
              </div>
              <span className="ml-2 font-medium">Meeting Feedback</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              currentStep === 'complete' ? 'bg-green-200' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center ${
              currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'complete' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {currentStep === 'complete' ? '✓' : '3'}
              </div>
              <span className="ml-2 font-medium">Proceed to Contract</span>
            </div>
          </div>
        </div>

        {/* Quote Summary */}
        {quote && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Quote Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Price</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(quote.pricing.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Timeline</p>
                <p className="text-lg font-semibold text-gray-900">{quote.timeline} days</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Start Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(quote.startDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completion</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(quote.projectedCompletionDate)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'schedule' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Your Meeting</h3>
            <form onSubmit={handleScheduleMeeting} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Date
                  </label>
                  <input
                    type="date"
                    id="scheduledDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={meetingForm.scheduledDate}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Time
                  </label>
                  <input
                    type="time"
                    id="scheduledTime"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={meetingForm.scheduledTime}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Location
                </label>
                <input
                  type="text"
                  id="location"
                  required
                  placeholder="e.g., Property address, builder's office, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={meetingForm.location}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 'feedback' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Feedback</h3>
            <form onSubmit={handleCompleteMeeting} className="space-y-6">
              {/* Overall Impression */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Impression
                </label>
                <div className="flex space-x-4">
                  {(['positive', 'neutral', 'negative'] as const).map((impression) => (
                    <label key={impression} className="flex items-center">
                      <input
                        type="radio"
                        name="overallImpression"
                        value={impression}
                        checked={feedbackForm.overallImpression === impression}
                        onChange={(e) => setFeedbackForm(prev => ({ 
                          ...prev, 
                          overallImpression: e.target.value as 'positive' | 'neutral' | 'negative'
                        }))}
                        className="mr-2"
                      />
                      <span className="capitalize">{impression}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Scales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'professionalism', label: 'Professionalism' },
                  { key: 'communication', label: 'Communication' },
                  { key: 'expertise', label: 'Technical Expertise' },
                  { key: 'trustworthiness', label: 'Trustworthiness' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {label} (1-5)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={feedbackForm[key as keyof typeof feedbackForm] as number}
                      onChange={(e) => setFeedbackForm(prev => ({ 
                        ...prev, 
                        [key]: parseInt(e.target.value)
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Concerns */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concerns (if any)
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a concern..."
                    value={newConcern}
                    onChange={(e) => setNewConcern(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addConcern}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {feedbackForm.concerns.map((concern, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded">
                      <span className="text-sm text-red-800">{concern}</span>
                      <button
                        type="button"
                        onClick={() => removeConcern(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Positives */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Positive Aspects
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a positive aspect..."
                    value={newPositive}
                    onChange={(e) => setNewPositive(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addPositive}
                    className="bg-green-100 text-green-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-200"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {feedbackForm.positives.map((positive, index) => (
                    <div key={index} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded">
                      <span className="text-sm text-green-800">{positive}</span>
                      <button
                        type="button"
                        onClick={() => removePositive(index)}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Willing to Proceed */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={feedbackForm.willingToProceed}
                    onChange={(e) => setFeedbackForm(prev => ({ 
                      ...prev, 
                      willingToProceed: e.target.checked 
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    I am satisfied with this builder and willing to proceed with the contract
                  </span>
                </label>
              </div>

              {/* Additional Notes */}
              <div>
                <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  id="additionalNotes"
                  rows={3}
                  placeholder="Any additional comments about the meeting..."
                  value={feedbackForm.additionalNotes}
                  onChange={(e) => setFeedbackForm(prev => ({ 
                    ...prev, 
                    additionalNotes: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Complete Meeting'}
                </button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              {selection.status === 'meeting_approved' ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Meeting Completed Successfully!</h3>
                  <p className="text-gray-600 mb-6">
                    You're ready to proceed with the contract generation for this builder.
                  </p>
                  <button
                    onClick={handleProceedToContract}
                    disabled={submitting}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Proceed to Contract'}
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Meeting Not Approved</h3>
                  <p className="text-gray-600 mb-6">
                    Based on your feedback, you've chosen not to proceed with this builder. You can return to quote comparison to select a different builder.
                  </p>
                  <button
                    onClick={() => router.push(`/quotes/comparison?projectId=${selection.projectId}`)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Quote Comparison
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}