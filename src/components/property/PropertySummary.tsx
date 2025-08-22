'use client';

import React from 'react';
import { Property } from '../../lib/types';

interface PropertySummaryProps {
  property: Property;
  showFullDetails?: boolean;
}

export default function PropertySummary({ property, showFullDetails = false }: PropertySummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
      
      {/* Address */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Address</h4>
        <div className="text-gray-700">
          <p>{property.address.line1}</p>
          {property.address.line2 && <p>{property.address.line2}</p>}
          <p>{property.address.city}{property.address.county && `, ${property.address.county}`}</p>
          <p>{property.address.postcode}</p>
          <p>{property.address.country}</p>
        </div>
      </div>

      {/* Council Area */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Local Authority</h4>
        <p className="text-gray-700">{property.councilArea}</p>
      </div>

      {/* Special Status */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Property Status</h4>
        <div className="space-y-2">
          {property.isListedBuilding ? (
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Listed Building
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Not Listed
              </span>
            </div>
          )}
          
          {property.isInConservationArea ? (
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Conservation Area
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Not in Conservation Area
              </span>
            </div>
          )}
        </div>
      </div>

      {showFullDetails && (
        <>
          {/* Planning History */}
          {property.planningHistory && property.planningHistory.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Planning History</h4>
              <div className="space-y-3">
                {property.planningHistory.slice(0, 5).map((application, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {application.reference}
                        </p>
                        <p className="text-sm text-gray-700">{application.description}</p>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(application.submittedDate).toLocaleDateString()}
                          {application.decisionDate && (
                            <> • Decided: {new Date(application.decisionDate).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        application.status === 'Approved' 
                          ? 'bg-green-100 text-green-800'
                          : application.status === 'Refused'
                          ? 'bg-red-100 text-red-800'
                          : application.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {application.status}
                      </span>
                    </div>
                  </div>
                ))}
                {property.planningHistory.length > 5 && (
                  <p className="text-sm text-gray-500 italic">
                    +{property.planningHistory.length - 5} more applications
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Building Regulations */}
          {property.buildingRegulations && property.buildingRegulations.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Building Regulations</h4>
              <div className="space-y-2">
                {property.buildingRegulations.map((regulation, index) => (
                  <div key={index} className="bg-gray-50 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{regulation.type}</p>
                        <p className="text-sm text-gray-700">{regulation.description}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        regulation.mandatory 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {regulation.mandatory ? 'Mandatory' : 'Recommended'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Property ID for reference */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Property ID: {property.id}
        </p>
      </div>
    </div>
  );
}