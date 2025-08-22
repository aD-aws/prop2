'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProjectType, Document } from '@/lib/types';
import { builderVerificationService } from '@/lib/services/builderVerificationService';

interface BuilderRegistrationData {
  companyName: string;
  companiesHouseNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
  };
  specializations: ProjectType[];
  serviceAreas: string[];
  insuranceDocuments: File[];
  referenceProjects: Array<{
    address: string;
    projectType: string;
    completionDate: string;
    contactAllowed: boolean;
    visitAllowed: boolean;
    description: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  }>;
  businessDescription: string;
  yearsInBusiness: number;
  numberOfEmployees: number;
  website?: string;
}

interface BuilderRegistrationFormProps {
  builderId: string;
  onSubmit: (data: BuilderRegistrationData) => Promise<void>;
  onCancel: () => void;
}

export function BuilderRegistrationForm({ builderId, onSubmit, onCancel }: BuilderRegistrationFormProps) {
  const [formData, setFormData] = useState<BuilderRegistrationData>({
    companyName: '',
    companiesHouseNumber: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      county: '',
      postcode: '',
    },
    specializations: [],
    serviceAreas: [],
    insuranceDocuments: [],
    referenceProjects: [
      {
        address: '',
        projectType: '',
        completionDate: '',
        contactAllowed: false,
        visitAllowed: false,
        description: '',
      },
      {
        address: '',
        projectType: '',
        completionDate: '',
        contactAllowed: false,
        visitAllowed: false,
        description: '',
      },
    ],
    businessDescription: '',
    yearsInBusiness: 0,
    numberOfEmployees: 1,
    website: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [companiesHouseVerified, setCompaniesHouseVerified] = useState(false);

  const projectTypeOptions: Array<{ value: ProjectType; label: string }> = [
    { value: 'loft_conversion_dormer', label: 'Loft Conversions' },
    { value: 'rear_extension_single_storey', label: 'Extensions' },
    { value: 'kitchen_full_refit', label: 'Kitchen Renovations' },
    { value: 'bathroom_full_refit', label: 'Bathroom Renovations' },
    { value: 'roofing_re_roofing', label: 'Roofing' },
    { value: 'electrical_rewiring', label: 'Electrical Work' },
    { value: 'plumbing_bathroom', label: 'Plumbing' },
    { value: 'flooring_hardwood_solid', label: 'Flooring' },
    { value: 'windows_upvc', label: 'Windows & Doors' },
    { value: 'garden_landscaping', label: 'Landscaping' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0] as keyof BuilderRegistrationData],
            [keys[1]]: value,
          },
        };
      }
    });
  };

  const handleSpecializationChange = (projectType: ProjectType, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specializations: checked
        ? [...prev.specializations, projectType]
        : prev.specializations.filter(s => s !== projectType),
    }));
  };

  const handleServiceAreaChange = (area: string) => {
    const areas = area.split(',').map(a => a.trim()).filter(a => a);
    setFormData(prev => ({ ...prev, serviceAreas: areas }));
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      setFormData(prev => ({
        ...prev,
        insuranceDocuments: [...prev.insuranceDocuments, ...Array.from(files)],
      }));
    }
  };

  const removeInsuranceDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      insuranceDocuments: prev.insuranceDocuments.filter((_, i) => i !== index),
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

  const addReferenceProject = () => {
    setFormData(prev => ({
      ...prev,
      referenceProjects: [
        ...prev.referenceProjects,
        {
          address: '',
          projectType: '',
          completionDate: '',
          contactAllowed: false,
          visitAllowed: false,
          description: '',
        },
      ],
    }));
  };

  const removeReferenceProject = (index: number) => {
    if (formData.referenceProjects.length > 2) {
      setFormData(prev => ({
        ...prev,
        referenceProjects: prev.referenceProjects.filter((_, i) => i !== index),
      }));
    }
  };

  const verifyCompaniesHouse = async () => {
    if (!formData.companiesHouseNumber) {
      setError('Please enter a Companies House number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // This would call the verification service
      // For now, we'll simulate the verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCompaniesHouseVerified(true);
    } catch (error) {
      setError('Failed to verify Companies House number. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.companyName &&
          formData.companiesHouseNumber &&
          companiesHouseVerified &&
          formData.contactPerson &&
          formData.phone &&
          formData.email
        );
      case 2:
        return !!(
          formData.address.line1 &&
          formData.address.city &&
          formData.address.postcode &&
          formData.specializations.length > 0 &&
          formData.serviceAreas.length > 0
        );
      case 3:
        return formData.insuranceDocuments.length >= 2;
      case 4:
        return formData.referenceProjects.filter(ref => 
          ref.address && ref.projectType && ref.completionDate && ref.description
        ).length >= 2;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
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
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name *</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Companies House Number *</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              value={formData.companiesHouseNumber}
              onChange={(e) => handleInputChange('companiesHouseNumber', e.target.value)}
              className="flex-1 block w-full border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 12345678"
              required
            />
            <Button
              type="button"
              onClick={verifyCompaniesHouse}
              loading={isLoading}
              disabled={companiesHouseVerified}
              className="rounded-l-none"
            >
              {companiesHouseVerified ? 'Verified ✓' : 'Verify'}
            </Button>
          </div>
          {companiesHouseVerified && (
            <p className="mt-1 text-sm text-green-600">Companies House information verified successfully</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => handleInputChange('contactPerson', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Business Details</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Address *</label>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Address Line 1"
              value={formData.address.line1}
              onChange={(e) => handleInputChange('address.line1', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Address Line 2 (Optional)"
              value={formData.address.line2}
              onChange={(e) => handleInputChange('address.line2', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="City"
                value={formData.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <input
                type="text"
                placeholder="County"
                value={formData.address.county}
                onChange={(e) => handleInputChange('address.county', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <input
              type="text"
              placeholder="Postcode"
              value={formData.address.postcode}
              onChange={(e) => handleInputChange('address.postcode', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Specializations * (Select all that apply)</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {projectTypeOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.specializations.includes(option.value)}
                  onChange={(e) => handleSpecializationChange(option.value, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Service Areas * (Postcodes, comma-separated)</label>
          <input
            type="text"
            placeholder="e.g., SW1, W1, NW1, SE1"
            value={formData.serviceAreas.join(', ')}
            onChange={(e) => handleServiceAreaChange(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">Enter the postcode areas where you provide services</p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Insurance Documentation</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload Insurance Documents * (Minimum 2 required)
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Please upload your Public Liability and Employers' Liability insurance certificates
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {formData.insuranceDocuments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</h4>
            <div className="space-y-2">
              {formData.insuranceDocuments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <Button
                    type="button"
                    onClick={() => removeInsuranceDocument(index)}
                    className="text-red-600 hover:text-red-800"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Reference Projects</h3>
      <p className="text-sm text-gray-600">
        Please provide details of at least 2 recent projects that we can use as references.
      </p>
      
      <div className="space-y-6">
        {formData.referenceProjects.map((project, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">Reference Project {index + 1}</h4>
              {formData.referenceProjects.length > 2 && (
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
                    value={project.completionDate}
                    onChange={(e) => updateReferenceProject(index, 'completionDate', e.target.value)}
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
                  placeholder="Describe the work completed..."
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

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Review & Submit</h3>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Registration Summary</h4>
        <div className="space-y-2 text-sm">
          <p><strong>Company:</strong> {formData.companyName}</p>
          <p><strong>Companies House:</strong> {formData.companiesHouseNumber} {companiesHouseVerified && '✓'}</p>
          <p><strong>Contact:</strong> {formData.contactPerson}</p>
          <p><strong>Specializations:</strong> {formData.specializations.length} selected</p>
          <p><strong>Service Areas:</strong> {formData.serviceAreas.join(', ')}</p>
          <p><strong>Insurance Documents:</strong> {formData.insuranceDocuments.length} uploaded</p>
          <p><strong>Reference Projects:</strong> {formData.referenceProjects.filter(p => p.address && p.projectType).length} provided</p>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>We'll verify your Companies House information</li>
          <li>Our team will review your insurance documentation</li>
          <li>We'll contact your reference projects for verification</li>
          <li>A manual review will be conducted by our vetting team</li>
          <li>You'll receive notification of the vetting decision within 5-7 business days</li>
        </ol>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Builder Registration & Vetting</h2>
        <p className="text-gray-600 mt-2">Complete your registration to join our verified builder network</p>
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
          <span>Company Info</span>
          <span>Business Details</span>
          <span>Insurance</span>
          <span>References</span>
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
                Submit Registration
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}