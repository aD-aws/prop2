'use client';

import React, { useState, useEffect } from 'react';
import { Property, ProjectType } from '../../lib/types';
import { ComplianceService, ComplianceResult } from '../../lib/services/complianceService';
import { getProjectTypeCategory } from '../../lib/utils/projectTypeUtils';

interface ComplianceCheckerProps {
  property: Property;
  projectType: ProjectType;
  projectDetails?: Record<string, unknown>;
  onComplianceChecked: (result: ComplianceResult) => void;
}

export default function ComplianceChecker({ 
  property, 
  projectType, 
  projectDetails, 
  onComplianceChecked 
}: ComplianceCheckerProps) {
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCompliance();
  }, [property, projectType, projectDetails]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkCompliance = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ComplianceService.validateCompliance(
        projectType,
        property
      );
      
      setComplianceResult(result);
      onComplianceChecked(result);
    } catch (err) {
      console.error('Compliance check error:', err);
      setError(err instanceof Error ? err.message : 'Compliance check failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Checking Building Regulations Compliance
          </h3>
          <p className="text-gray-600">
            Analyzing your project against UK building regulations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Compliance Check Error
          </h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={checkCompliance}
            className="mt-3 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Retry Check
          </button>
        </div>
      </div>
    );
  }

  if (!complianceResult) {
    return null;
  }



  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Building Regulations Compliance Check
      </h3>

      {/* Project Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-2">Project Summary</h4>
        <p className="text-gray-700">
          <span className="font-medium">Project Type:</span> {getProjectTypeCategory(projectType)}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Property:</span> {property.address.line1}, {property.address.city}, {property.address.postcode}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Council Area:</span> {property.councilArea}
        </p>
      </div>

      {/* Key Requirements Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg border-2 ${
          complianceResult.planningPermissionRequired 
            ? 'border-amber-300 bg-amber-50' 
            : 'border-green-300 bg-green-50'
        }`}>
          <h5 className="font-medium text-gray-900 mb-1">Planning Permission</h5>
          <p className={`text-sm ${
            complianceResult.planningPermissionRequired 
              ? 'text-amber-700' 
              : 'text-green-700'
          }`}>
            {complianceResult.planningPermissionRequired ? 'Required' : 'Not Required'}
          </p>
        </div>

        <div className={`p-4 rounded-lg border-2 ${
          complianceResult.buildingControlRequired 
            ? 'border-amber-300 bg-amber-50' 
            : 'border-green-300 bg-green-50'
        }`}>
          <h5 className="font-medium text-gray-900 mb-1">Building Control</h5>
          <p className={`text-sm ${
            complianceResult.buildingControlRequired 
              ? 'text-amber-700' 
              : 'text-green-700'
          }`}>
            {complianceResult.buildingControlRequired ? 'Required' : 'Not Required'}
          </p>
        </div>

        <div className={`p-4 rounded-lg border-2 ${
          complianceResult.partyWallAgreementRequired 
            ? 'border-amber-300 bg-amber-50' 
            : 'border-green-300 bg-green-50'
        }`}>
          <h5 className="font-medium text-gray-900 mb-1">Party Wall Agreement</h5>
          <p className={`text-sm ${
            complianceResult.partyWallAgreementRequired 
              ? 'text-amber-700' 
              : 'text-green-700'
          }`}>
            {complianceResult.partyWallAgreementRequired ? 'Required' : 'Not Required'}
          </p>
        </div>

        <div className={`p-4 rounded-lg border-2 ${
          complianceResult.structuralEngineerRequired 
            ? 'border-amber-300 bg-amber-50' 
            : 'border-green-300 bg-green-50'
        }`}>
          <h5 className="font-medium text-gray-900 mb-1">Structural Engineer</h5>
          <p className={`text-sm ${
            complianceResult.structuralEngineerRequired 
              ? 'text-amber-700' 
              : 'text-green-700'
          }`}>
            {complianceResult.structuralEngineerRequired ? 'Required' : 'Not Required'}
          </p>
        </div>
      </div>

      {/* Special Considerations */}
      {complianceResult.specialConsiderations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-3">Special Considerations</h4>
          <ul className="space-y-2">
            {complianceResult.specialConsiderations.map((consideration, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-blue-800 text-sm">{consideration}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mandatory Requirements */}
      {complianceResult.mandatoryRequirements.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Mandatory Building Regulations</h4>
          <div className="space-y-3">
            {complianceResult.mandatoryRequirements.map((requirement, index) => (
              <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h5 className="font-medium text-red-900 mb-1">{requirement.type}</h5>
                <p className="text-red-800 text-sm">{requirement.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Requirements */}
      {complianceResult.recommendedRequirements.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Recommended Considerations</h4>
          <div className="space-y-3">
            {complianceResult.recommendedRequirements.map((requirement, index) => (
              <div key={index} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <h5 className="font-medium text-yellow-900 mb-1">{requirement.type}</h5>
                <p className="text-yellow-800 text-sm">{requirement.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applicable Regulations Details */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Applicable Building Regulations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceResult.applicableRegulations.map((regulation, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">{regulation.regulation}</h5>
              <p className="text-gray-700 text-sm mb-3">{regulation.description}</p>
              <div className="space-y-1">
                {regulation.requirements.slice(0, 3).map((req, reqIndex) => (
                  <p key={reqIndex} className="text-xs text-gray-600 flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {req}
                  </p>
                ))}
                {regulation.requirements.length > 3 && (
                  <p className="text-xs text-gray-500 italic">
                    +{regulation.requirements.length - 3} more requirements
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-3">Next Steps</h4>
        <div className="space-y-2 text-sm text-green-800">
          <p>✓ Property assessment completed</p>
          <p>✓ Building regulations compliance checked</p>
          <p>→ Ready to proceed with AI-guided project planning</p>
        </div>
      </div>
    </div>
  );
}