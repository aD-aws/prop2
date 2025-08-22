'use client';

import React, { useState, useEffect } from 'react';
import { leadManagementService } from '@/lib/services/leadManagementService';

interface Lead {
  id: string;
  projectId: string;
  projectType: string;
  postcode: string;
  estimatedBudget: number;
  description: string;
  status: 'available' | 'offered' | 'accepted' | 'expired' | 'sold';
  price: number;
  createdAt: Date;
  expiresAt?: Date;
}

interface LeadManagementProps {
  homeownerId: string;
  projectId?: string;
}

export default function LeadManagement({ homeownerId, projectId }: LeadManagementProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingLead, setCreatingLead] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    projectType: '',
    postcode: '',
    estimatedBudget: '',
    description: ''
  });

  useEffect(() => {
    loadLeads();
  }, [homeownerId]);

  const loadLeads = async () => {
    try {
      // This would be implemented to fetch homeowner's leads
      // For now, we'll use a placeholder
      setLeads([]);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLead(true);

    try {
      const leadData = {
        projectId: projectId || `project_${Date.now()}`,
        homeownerId,
        projectType: formData.projectType,
        postcode: formData.postcode.toUpperCase(),
        estimatedBudget: parseInt(formData.estimatedBudget),
        description: formData.description
      };

      const newLead = await leadManagementService.createLead(leadData);
      setLeads(prev => [newLead, ...prev]);
      setShowCreateForm(false);
      setFormData({
        projectType: '',
        postcode: '',
        estimatedBudget: '',
        description: ''
      });
      
      alert('Lead created successfully! We\'ll start offering it to qualified builders in your area.');
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead. Please try again.');
    } finally {
      setCreatingLead(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-blue-100 text-blue-800';
      case 'offered':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'available':
        return 'Looking for builders';
      case 'offered':
        return 'Offered to a builder';
      case 'sold':
        return 'Builder found!';
      case 'expired':
        return 'No builders available';
      default:
        return status;
    }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Builder Lead Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create New Lead
        </button>
      </div>

      {/* Create Lead Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Lead</h3>
          <form onSubmit={handleCreateLead} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type
                </label>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select project type</option>
                  <option value="Kitchen Renovation">Kitchen Renovation</option>
                  <option value="Bathroom Renovation">Bathroom Renovation</option>
                  <option value="Loft Conversion">Loft Conversion</option>
                  <option value="Extension">Extension</option>
                  <option value="Electrical Work">Electrical Work</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Roofing">Roofing</option>
                  <option value="Flooring">Flooring</option>
                  <option value="Painting & Decorating">Painting & Decorating</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
                  placeholder="e.g. SW1A 1AA"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Budget (£)
              </label>
              <input
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedBudget: e.target.value }))}
                placeholder="e.g. 15000"
                min="100"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your project requirements..."
                rows={3}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={creatingLead}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingLead ? 'Creating...' : 'Create Lead'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leads List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Leads</h3>
        
        {leads.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No leads created yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first lead to start connecting with qualified builders in your area.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Your First Lead
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <div key={lead.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{lead.projectType}</h4>
                    <p className="text-sm text-gray-600">{lead.postcode}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(lead.status)}`}>
                    {getStatusDescription(lead.status)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{lead.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Budget:</span>
                    <div className="font-medium">{formatBudget(lead.estimatedBudget)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Lead Price:</span>
                    <div className="font-medium text-green-600">{formatBudget(lead.price)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <div className="font-medium">{new Date(lead.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="font-medium">{getStatusDescription(lead.status)}</div>
                  </div>
                </div>

                {lead.status === 'offered' && lead.expiresAt && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      A builder is considering this lead. They have until{' '}
                      {new Date(lead.expiresAt).toLocaleString()} to accept.
                    </p>
                  </div>
                )}

                {lead.status === 'sold' && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      Great news! A qualified builder has accepted this lead and will be in touch soon.
                    </p>
                  </div>
                )}

                {lead.status === 'expired' && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      No builders were available for this lead. You may want to adjust your requirements or try again later.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How Lead Management Works</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• We offer your lead to the highest-rated builders in your area first</p>
          <p>• Builders have 12 hours to accept a lead offer before it moves to the next builder</p>
          <p>• Lead prices are calculated as 2% of your estimated budget (minimum £50, maximum £500)</p>
          <p>• Once a builder accepts, they gain access to your project and can submit quotes</p>
          <p>• You'll be notified immediately when a builder is found for your project</p>
        </div>
      </div>
    </div>
  );
}