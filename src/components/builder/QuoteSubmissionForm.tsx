'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Project, SoWDocument } from '@/lib/types';
import { QuoteSubmissionData } from '@/lib/services/builderDashboardService';

interface QuoteSubmissionFormProps {
  project: Project;
  builderId: string;
  onSubmit: (quoteData: QuoteSubmissionData) => Promise<void>;
  onCancel: () => void;
  existingQuote?: any; // For editing existing quotes
}

export function QuoteSubmissionForm({ 
  project, 
  builderId, 
  onSubmit, 
  onCancel, 
  existingQuote 
}: QuoteSubmissionFormProps) {
  const [formData, setFormData] = useState<QuoteSubmissionData>({
    projectId: project.id,
    builderId,
    pricing: {
      totalAmount: existingQuote?.pricing.totalAmount || 0,
      laborCosts: existingQuote?.pricing.laborCosts || 0,
      materialCosts: existingQuote?.pricing.materialCosts || 0,
      breakdown: existingQuote?.pricing.breakdown || [
        { category: 'Labor', description: '', amount: 0 },
        { category: 'Materials', description: '', amount: 0 },
      ],
    },
    timeline: existingQuote?.timeline || 0,
    startDate: existingQuote?.startDate ? new Date(existingQuote.startDate) : new Date(),
    amendments: existingQuote?.amendments || [],
    termsAndConditions: existingQuote?.termsAndConditions || '',
    insuranceDocuments: existingQuote?.insuranceDocuments || [],
    referenceProjects: existingQuote?.referenceProjects || [
      {
        address: '',
        projectType: '',
        completionDate: new Date(),
        contactAllowed: false,
        visitAllowed: false,
        description: '',
      },
    ],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        const parentKey = keys[0] as keyof QuoteSubmissionData;
        const parentValue = prev[parentKey];
        return {
          ...prev,
          [keys[0]]: {
            ...(typeof parentValue === 'object' && parentValue !== null ? parentValue : {}),
            [keys[1]]: value,
          },
        };
      }
      return prev;
    });
  };

  const addBreakdownItem = () => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        breakdown: [
          ...prev.pricing.breakdown,
          { category: '', description: '', amount: 0 },
        ],
      },
    }));
  };

  const updateBreakdownItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        breakdown: prev.pricing.breakdown.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const removeBreakdownItem = (index: number) => {
    if (formData.pricing.breakdown.length > 1) {
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          breakdown: prev.pricing.breakdown.filter((_, i) => i !== index),
        },
      }));
    }
  };

  const addAmendment = () => {
    setFormData(prev => ({
      ...prev,
      amendments: [
        ...(prev.amendments || []),
        {
          section: '',
          originalText: '',
          proposedText: '',
          reason: '',
        },
      ],
    }));
  };

  const updateAmendment = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      amendments: (prev.amendments || []).map((amendment, i) =>
        i === index ? { ...amendment, [field]: value } : amendment
      ),
    }));
  };

  const removeAmendment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amendments: (prev.amendments || []).filter((_, i) => i !== index),
    }));
  };

  const addReferenceProject = () => {
    setFormData(prev => ({
      ...prev,
      referenceProjects: [
        ...prev.referenceProjects,
        {
          address: '',
          projectType: '',
          completionDate: new Date(),
          contactAllowed: false,
          visitAllowed: false,
          description: '',
        },
      ],
    }));
  };

  const updateReferenceProject = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      referenceProjects: prev.referenceProjects.map((ref, i) =>
        i === index ? { ...ref, [field]: value } : ref
      ),
    }));
  };

  const removeReferenceProject = (index: number) => {
    if (formData.referenceProjects.length > 1) {
      setFormData(prev => ({
        ...prev,
        referenceProjects: prev.referenceProjects.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateTotals = () => {
    const breakdownTotal = formData.pricing.breakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        totalAmount: breakdownTotal,
        laborCosts: prev.pricing.breakdown
          .filter(item => item.category.toLowerCase().includes('labor'))
          .reduce((sum, item) => sum + (item.amount || 0), 0),
        materialCosts: prev.pricing.breakdown
          .filter(item => item.category.toLowerCase().includes('material'))
          .reduce((sum, item) => sum + (item.amount || 0), 0),
      },
    }));
  };

  const calculateCompletionDate = () => {
    if (formData.startDate && formData.timeline) {
      const completionDate = new Date(formData.startDate);
      let daysAdded = 0;
      
      while (daysAdded < formData.timeline) {
        completionDate.setDate(completionDate.getDate() + 1);
        // Skip weekends
        if (completionDate.getDay() !== 0 && completionDate.getDay() !== 6) {
          daysAdded++;
        }
      }
      
      return completionDate;
    }
    return null;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.pricing.breakdown.every(item => 
          item.category && item.description && item.amount > 0
        ) && formData.pricing.totalAmount > 0;
      case 2:
        return formData.timeline > 0 && formData.startDate !== null;
      case 3:
        return formData.referenceProjects.every(ref => 
          ref.address && ref.projectType && ref.description
        );
      case 4:
        return formData.termsAndConditions.trim().length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1) {
        calculateTotals();
      }
      setCurrentStep(prev => Math.min(prev + 1, 5));
      setError('');
    } else {
      setError('Please complete all required fields before proceeding');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setError('Please complete all required information');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit quote');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Pricing Breakdown</h3>
      
      <div className="space-y-4">
        {formData.pricing.breakdown.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">Item {index + 1}</h4>
              {formData.pricing.breakdown.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeBreakdownItem(index)}
                  className="text-red-600 hover:text-red-800"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <select
                  value={item.category}
                  onChange={(e) => updateBreakdownItem(index, 'category', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Labor">Labor</option>
                  <option value="Materials">Materials</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Permits">Permits</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateBreakdownItem(index, 'description', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe this cost item"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (£) *</label>
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateBreakdownItem(index, 'amount', parseFloat(e.target.value) || 0)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          onClick={addBreakdownItem}
          className="w-full border-dashed border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
        >
          + Add Another Item
        </Button>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              Total: £{formData.pricing.breakdown.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Timeline & Schedule</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Earliest Start Date *</label>
          <input
            type="date"
            value={formData.startDate.toISOString().split('T')[0]}
            onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Project Duration (Working Days) *</label>
          <input
            type="number"
            value={formData.timeline}
            onChange={(e) => handleInputChange('timeline', parseInt(e.target.value) || 0)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            min="1"
            required
          />
          <p className="mt-1 text-sm text-gray-500">Excludes weekends and holidays</p>
        </div>
      </div>
      
      {calculateCompletionDate() && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900">Projected Completion Date</h4>
          <p className="text-blue-800">
            {calculateCompletionDate()?.toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      )}

      {/* SoW Amendments */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Scope of Work Amendments (Optional)</h4>
        <p className="text-sm text-gray-600 mb-4">
          If you need to propose changes to the original scope of work, add them here.
        </p>
        
        {formData.amendments && formData.amendments.length > 0 && (
          <div className="space-y-4 mb-4">
            {formData.amendments.map((amendment, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="text-sm font-medium text-gray-900">Amendment {index + 1}</h5>
                  <Button
                    type="button"
                    onClick={() => removeAmendment(index)}
                    className="text-red-600 hover:text-red-800"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Section</label>
                    <input
                      type="text"
                      value={amendment.section}
                      onChange={(e) => updateAmendment(index, 'section', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Which section of the SoW?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Proposed Change</label>
                    <textarea
                      value={amendment.proposedText}
                      onChange={(e) => updateAmendment(index, 'proposedText', e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your proposed change..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason for Change</label>
                    <textarea
                      value={amendment.reason}
                      onChange={(e) => updateAmendment(index, 'reason', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Why is this change necessary?"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <Button
          type="button"
          onClick={addAmendment}
          className="w-full border-dashed border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
        >
          + Add Amendment
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Reference Projects</h3>
      <p className="text-sm text-gray-600">
        Provide examples of similar work you've completed to build confidence with the homeowner.
      </p>
      
      <div className="space-y-6">
        {formData.referenceProjects.map((project, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">Reference Project {index + 1}</h4>
              {formData.referenceProjects.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeReferenceProject(index)}
                  className="text-red-600 hover:text-red-800"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Address *</label>
                <input
                  type="text"
                  value={project.address}
                  onChange={(e) => updateReferenceProject(index, 'address', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 123 High Street, London"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Type *</label>
                  <input
                    type="text"
                    value={project.projectType}
                    onChange={(e) => updateReferenceProject(index, 'projectType', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Kitchen renovation"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completion Date *</label>
                  <input
                    type="date"
                    value={project.completionDate.toISOString().split('T')[0]}
                    onChange={(e) => updateReferenceProject(index, 'completionDate', new Date(e.target.value))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Description *</label>
                <textarea
                  value={project.description}
                  onChange={(e) => updateReferenceProject(index, 'description', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the work completed, challenges overcome, and results achieved..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={project.contactAllowed}
                    onChange={(e) => updateReferenceProject(index, 'contactAllowed', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Customer can be contacted for reference</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={project.visitAllowed}
                    onChange={(e) => updateReferenceProject(index, 'visitAllowed', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Site visit allowed for verification</span>
                </label>
              </div>
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          onClick={addReferenceProject}
          className="w-full border-dashed border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
        >
          + Add Another Reference Project
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Terms & Conditions</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Terms and Conditions *
        </label>
        <textarea
          value={formData.termsAndConditions}
          onChange={(e) => handleInputChange('termsAndConditions', e.target.value)}
          rows={12}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your terms and conditions for this project..."
          required
        />
        <p className="mt-2 text-sm text-gray-500">
          Include payment terms, warranty information, change order procedures, and any other important conditions.
        </p>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Review & Submit</h3>
      
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <div>
          <h4 className="font-medium text-gray-900">Quote Summary</h4>
          <div className="mt-2 space-y-1 text-sm">
            <p><strong>Total Amount:</strong> £{formData.pricing.totalAmount.toLocaleString()}</p>
            <p><strong>Timeline:</strong> {formData.timeline} working days</p>
            <p><strong>Start Date:</strong> {formData.startDate.toLocaleDateString()}</p>
            <p><strong>Completion Date:</strong> {calculateCompletionDate()?.toLocaleDateString()}</p>
            <p><strong>Reference Projects:</strong> {formData.referenceProjects.length}</p>
            <p><strong>Amendments:</strong> {formData.amendments?.length || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Before You Submit</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
          <li>Double-check all pricing and calculations</li>
          <li>Ensure your timeline is realistic and achievable</li>
          <li>Verify that your reference projects are accurate</li>
          <li>Review your terms and conditions carefully</li>
          <li>Make sure you can honor the proposed start date</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {existingQuote ? 'Edit Quote' : 'Submit Quote'}
        </h2>
        <p className="text-gray-600 mt-2">
          Project: {project.projectType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 5 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Pricing</span>
          <span>Timeline</span>
          <span>References</span>
          <span>Terms</span>
          <span>Review</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form Steps */}
      <div className="bg-white shadow rounded-lg p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={prevStep}
                className="bg-gray-300 text-gray-700 hover:bg-gray-400"
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="space-x-4">
            <Button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </Button>
            
            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                loading={isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {existingQuote ? 'Update Quote' : 'Submit Quote'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}