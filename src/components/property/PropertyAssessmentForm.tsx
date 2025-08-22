'use client';

import React, { useState } from 'react';
import { Address, Property } from '../../lib/types';
import { PropertyService } from '../../lib/services/propertyService';
import { CouncilApiService, CouncilPropertyInfo } from '../../lib/services/councilApiService';


interface PropertyAssessmentFormProps {
  onPropertyAssessed: (property: Property) => void;
  onError: (error: string) => void;
}

interface FormData {
  line1: string;
  line2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
}

export default function PropertyAssessmentForm({ onPropertyAssessed, onError }: PropertyAssessmentFormProps) {
  const [formData, setFormData] = useState<FormData>({
    line1: '',
    line2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [assessmentStep, setAssessmentStep] = useState<'form' | 'checking' | 'confirmation'>('form');
  const [councilData, setCouncilData] = useState<CouncilPropertyInfo | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const address: Address = {
      line1: formData.line1.trim(),
      line2: formData.line2.trim() || undefined,
      city: formData.city.trim(),
      county: formData.county.trim() || undefined,
      postcode: formData.postcode.trim(),
      country: formData.country.trim(),
    };

    const validation = PropertyService.validateAddress(address);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setAssessmentStep('checking');

    try {
      const address: Address = {
        line1: formData.line1.trim(),
        line2: formData.line2.trim() || undefined,
        city: formData.city.trim(),
        county: formData.county.trim() || undefined,
        postcode: formData.postcode.trim(),
        country: formData.country.trim(),
      };

      // Query council API for property information
      const councilResponse = await CouncilApiService.getPropertyInfo(address);
      
      if (!councilResponse.success) {
        throw new Error(councilResponse.error || 'Failed to retrieve property information');
      }

      setCouncilData(councilResponse.data || null);
      setAssessmentStep('confirmation');

    } catch (error) {
      console.error('Property assessment error:', error);
      onError(error instanceof Error ? error.message : 'Property assessment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmProperty = async () => {
    if (!councilData) return;

    setIsLoading(true);

    try {
      // Create property record
      const property: Omit<Property, 'id'> = {
        address: councilData.address,
        councilArea: councilData.councilArea,
        isListedBuilding: councilData.isListedBuilding,
        isInConservationArea: councilData.isInConservationArea,
        planningHistory: councilData.planningApplications || [],
        buildingRegulations: [],
      };

      const result = await PropertyService.createProperty(property);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create property record');
      }

      // Get the created property
      const propertyResult = await PropertyService.getPropertyById(result.propertyId!);
      
      if (!propertyResult.success || !propertyResult.property) {
        throw new Error('Failed to retrieve created property');
      }

      onPropertyAssessed(propertyResult.property);

    } catch (error) {
      console.error('Property creation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to create property record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProperty = () => {
    setAssessmentStep('form');
    setCouncilData(null);
  };

  if (assessmentStep === 'checking') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Checking Property Information
          </h3>
          <p className="text-gray-600">
            We&apos;re retrieving information about your property from the local council database...
          </p>
        </div>
      </div>
    );
  }

  if (assessmentStep === 'confirmation' && councilData) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Confirm Property Information
        </h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Address</h4>
            <p className="text-gray-700">
              {councilData.address.line1}
              {councilData.address.line2 && <><br />{councilData.address.line2}</>}
              <br />{councilData.address.city}
              {councilData.address.county && <>, {councilData.address.county}</>}
              <br />{councilData.address.postcode}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Council Area</h4>
            <p className="text-gray-700">{councilData.councilArea}</p>
          </div>

          {councilData.isListedBuilding && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <h4 className="font-medium text-amber-800 mb-2">Listed Building</h4>
              <p className="text-amber-700 text-sm">
                This property is a Grade {councilData.listingGrade} listed building.
                {councilData.listingDescription && (
                  <><br /><br />{councilData.listingDescription}</>
                )}
              </p>
            </div>
          )}

          {councilData.isInConservationArea && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-800 mb-2">Conservation Area</h4>
              <p className="text-blue-700 text-sm">
                This property is located in {councilData.conservationAreaName || 'a conservation area'}.
                Special planning considerations may apply.
              </p>
            </div>
          )}

          {councilData.planningApplications && councilData.planningApplications.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recent Planning Applications</h4>
              <div className="space-y-2">
                {councilData.planningApplications.slice(0, 3).map((app, index: number) => (
                  <div key={index} className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3">
                    <p className="font-medium">{app.reference} - {app.status}</p>
                    <p>{app.description}</p>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(app.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleConfirmProperty}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Property...' : 'Confirm Property'}
          </button>
          <button
            onClick={handleEditProperty}
            disabled={isLoading}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit Address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Property Assessment
      </h3>
      <p className="text-gray-600 mb-6">
        Please provide your property address so we can check for any planning restrictions, 
        conservation area requirements, or listed building considerations.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="line1" className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 *
          </label>
          <input
            type="text"
            id="line1"
            name="line1"
            value={formData.line1}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 123 High Street"
            required
          />
        </div>

        <div>
          <label htmlFor="line2" className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2
          </label>
          <input
            type="text"
            id="line2"
            name="line2"
            value={formData.line2}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Apartment 4B"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., London"
              required
            />
          </div>

          <div>
            <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
              County
            </label>
            <input
              type="text"
              id="county"
              name="county"
              value={formData.county}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Greater London"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
              Postcode *
            </label>
            <input
              type="text"
              id="postcode"
              name="postcode"
              value={formData.postcode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., SW1A 1AA"
              required
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Please correct the following errors:</h4>
            <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Checking Property...' : 'Check Property Information'}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          We&apos;ll check your property against local council records to identify any planning restrictions,
          conservation area requirements, or listed building considerations that may affect your project.
        </p>
      </div>
    </div>
  );
}