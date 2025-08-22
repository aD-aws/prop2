'use client';

import React, { useState, useEffect } from 'react';
import { leadManagementService } from '@/lib/services/leadManagementService';
import { paymentService } from '@/lib/services/paymentService';

interface Lead {
  id: string;
  projectId: string;
  projectType: string;
  postcode: string;
  estimatedBudget: number;
  description: string;
  price: number;
  createdAt: Date;
}

interface LeadOffer {
  id: string;
  leadId: string;
  builderId: string;
  offeredAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'declined';
}

interface BuilderLeadDashboardProps {
  builderId: string;
}

export default function BuilderLeadDashboard({ builderId }: BuilderLeadDashboardProps) {
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
  const [currentOffers, setCurrentOffers] = useState<LeadOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOffer, setProcessingOffer] = useState<string | null>(null);

  useEffect(() => {
    loadLeadData();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadLeadData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [builderId]);

  const loadLeadData = async () => {
    try {
      const [leads, offers] = await Promise.all([
        leadManagementService.getBuilderAvailableLeads(builderId),
        leadManagementService.getBuilderCurrentOffers(builderId)
      ]);
      
      setAvailableLeads(leads);
      setCurrentOffers(offers);
    } catch (error) {
      console.error('Error loading lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setProcessingOffer(offerId);
    
    try {
      const result = await leadManagementService.acceptLeadOffer(offerId, builderId);
      
      if (result.success && result.paymentIntentId) {
        // Redirect to payment confirmation - for now just show success
        alert('Lead offer accepted successfully! Payment processing...');
        // Reload the data to reflect changes
        loadLeadData();
      } else {
        alert(result.error || 'Failed to accept offer');
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to accept offer');
    } finally {
      setProcessingOffer(null);
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const timeLeft = new Date(expiresAt).getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading leads...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Offers Section */}
      {currentOffers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Current Lead Offers ({currentOffers.length})
          </h2>
          <div className="space-y-4">
            {currentOffers.map((offer) => {
              const lead = availableLeads.find(l => l.id === offer.leadId);
              if (!lead) return null;
              
              const isExpired = new Date() > new Date(offer.expiresAt);
              
              return (
                <div
                  key={offer.id}
                  className={`border rounded-lg p-4 ${
                    isExpired ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{lead.projectType}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {lead.postcode}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {formatBudget(lead.estimatedBudget)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{lead.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Lead Price: {formatBudget(lead.price)}</span>
                        <span>Offered: {new Date(offer.offeredAt).toLocaleDateString()}</span>
                        <span className={isExpired ? 'text-red-600 font-medium' : 'text-orange-600'}>
                          {formatTimeRemaining(offer.expiresAt)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {!isExpired && (
                        <button
                          onClick={() => handleAcceptOffer(offer.id)}
                          disabled={processingOffer === offer.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingOffer === offer.id ? 'Processing...' : `Accept (${formatBudget(lead.price)})`}
                        </button>
                      )}
                      {isExpired && (
                        <span className="text-red-600 font-medium">Expired</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Leads Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Available Leads in Your Area ({availableLeads.length})
        </h2>
        
        {availableLeads.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No leads available</h3>
            <p className="text-gray-500">
              There are currently no leads available in your service areas and specializations.
              Check back later or expand your service areas in your profile.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableLeads.map((lead) => (
              <div key={lead.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-medium text-gray-900">{lead.projectType}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {lead.postcode}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{lead.description}</p>
                <div className="space-y-1 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>Budget:</span>
                    <span className="font-medium text-gray-900">{formatBudget(lead.estimatedBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lead Price:</span>
                    <span className="font-medium text-green-600">{formatBudget(lead.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Posted:</span>
                    <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    This lead will be offered to builders based on ratings and availability.
                    Maintain high ratings to receive priority access.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{currentOffers.length}</div>
            <div className="text-sm text-gray-500">Active Offers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{availableLeads.length}</div>
            <div className="text-sm text-gray-500">Available Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {currentOffers.filter(o => new Date() > new Date(o.expiresAt)).length}
            </div>
            <div className="text-sm text-gray-500">Expired Offers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {availableLeads.reduce((sum, lead) => sum + lead.price, 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-500">Total Lead Value (£)</div>
          </div>
        </div>
      </div>
    </div>
  );
}