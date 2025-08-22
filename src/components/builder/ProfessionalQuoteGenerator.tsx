'use client';

import React, { useState } from 'react';
import { builderQuoteGenerationService, BuilderQuoteProject, QuoteBreakdown } from '@/lib/services/builderQuoteGenerationService';
import { projectTypeService } from '@/lib/services/projectTypeService';
import { Button } from '@/components/ui/Button';

interface ProfessionalQuoteGeneratorProps {
  builderId: string;
  onProjectCreated?: (project: BuilderQuoteProject) => void;
}

export default function ProfessionalQuoteGenerator({ builderId, onProjectCreated }: ProfessionalQuoteGeneratorProps) {
  const [step, setStep] = useState<'client-details' | 'project-details' | 'sow-generation' | 'quote-creation'>('client-details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [clientDetails, setClientDetails] = useState({
    clientName: '',
    clientEmail: '',
    propertyAddress: ''
  });

  const [projectDetails, setProjectDetails] = useState({
    projectType: '',
    description: '',
    requirements: {} as any
  });

  const [currentProject, setCurrentProject] = useState<BuilderQuoteProject | null>(null);
  const [quoteData, setQuoteData] = useState({
    totalAmount: 0,
    laborCosts: 0,
    materialCosts: 0,
    breakdown: [] as QuoteBreakdown[],
    timeline: 0,
    startDate: '',
    terms: '',
    validUntil: ''
  });

  const projectTypes = projectTypeService.getAllProjectTypes();

  const handleClientDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientDetails.clientName || !clientDetails.clientEmail || !clientDetails.propertyAddress) {
      setError('Please fill in all client details');
      return;
    }
    setError(null);
    setStep('project-details');
  };

  const handleProjectDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDetails.projectType || !projectDetails.description) {
      setError('Please fill in all project details');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const project = await builderQuoteGenerationService.createBuilderProject(builderId, {
        ...clientDetails,
        projectType: projectDetails.projectType,
        projectDetails: {
          description: projectDetails.description,
          requirements: projectDetails.requirements
        }
      });

      setCurrentProject(project);
      setStep('sow-generation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSoW = async () => {
    if (!currentProject) return;

    setLoading(true);
    setError(null);

    try {
      await builderQuoteGenerationService.generateSoWForBuilderProject(currentProject.id);
      
      // Refresh project data
      const projects = await builderQuoteGenerationService.getBuilderProjects(builderId);
      const updatedProject = projects.find(p => p.id === currentProject.id);
      
      if (updatedProject) {
        setCurrentProject(updatedProject);
        setStep('quote-creation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate SoW');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    setLoading(true);
    setError(null);

    try {
      await builderQuoteGenerationService.createQuoteForProject(currentProject.id, {
        ...quoteData,
        startDate: new Date(quoteData.startDate),
        validUntil: new Date(quoteData.validUntil)
      });

      // Send invitation to client
      await builderQuoteGenerationService.sendInvitationToClient(currentProject.id);

      if (onProjectCreated) {
        onProjectCreated(currentProject);
      }

      // Reset form
      setStep('client-details');
      setClientDetails({ clientName: '', clientEmail: '', propertyAddress: '' });
      setProjectDetails({ projectType: '', description: '', requirements: {} });
      setCurrentProject(null);
      setQuoteData({
        totalAmount: 0,
        laborCosts: 0,
        materialCosts: 0,
        breakdown: [],
        timeline: 0,
        startDate: '',
        terms: '',
        validUntil: ''
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create and send quote');
    } finally {
      setLoading(false);
    }
  };

  const addBreakdownItem = () => {
    setQuoteData(prev => ({
      ...prev,
      breakdown: [...prev.breakdown, {
        category: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        type: 'material'
      }]
    }));
  };

  const updateBreakdownItem = (index: number, field: keyof QuoteBreakdown, value: any) => {
    setQuoteData(prev => {
      const newBreakdown = [...prev.breakdown];
      newBreakdown[index] = { ...newBreakdown[index], [field]: value };
      
      // Recalculate total price for this item
      if (field === 'quantity' || field === 'unitPrice') {
        newBreakdown[index].totalPrice = newBreakdown[index].quantity * newBreakdown[index].unitPrice;
      }
      
      return { ...prev, breakdown: newBreakdown };
    });
  };

  const removeBreakdownItem = (index: number) => {
    setQuoteData(prev => ({
      ...prev,
      breakdown: prev.breakdown.filter((_, i) => i !== index)
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    const materialTotal = quoteData.breakdown
      .filter(item => item.type === 'material')
      .reduce((sum, item) => sum + item.totalPrice, 0);
    
    const laborTotal = quoteData.breakdown
      .filter(item => item.type === 'labor')
      .reduce((sum, item) => sum + item.totalPrice, 0);
    
    const otherTotal = quoteData.breakdown
      .filter(item => item.type === 'other')
      .reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      materialTotal,
      laborTotal,
      otherTotal,
      grandTotal: materialTotal + laborTotal + otherTotal
    };
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Professional Quote Generator</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { key: 'client-details', label: 'Client Details' },
          { key: 'project-details', label: 'Project Details' },
          { key: 'sow-generation', label: 'SoW Generation' },
          { key: 'quote-creation', label: 'Quote Creation' }
        ].map((stepItem, index) => (
          <div key={stepItem.key} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === stepItem.key ? 'bg-blue-600 text-white' :
              ['client-details', 'project-details', 'sow-generation', 'quote-creation'].indexOf(step) > index ? 'bg-green-600 text-white' :
              'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <span className="ml-2 text-sm font-medium">{stepItem.label}</span>
            {index < 3 && <div className="w-16 h-0.5 bg-gray-200 mx-4" />}
          </div>
        ))}
      </div>

      {/* Client Details Step */}
      {step === 'client-details' && (
        <form onSubmit={handleClientDetailsSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Client Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={clientDetails.clientName}
                  onChange={(e) => setClientDetails(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email *
                </label>
                <input
                  type="email"
                  value={clientDetails.clientEmail}
                  onChange={(e) => setClientDetails(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Address *
              </label>
              <textarea
                value={clientDetails.propertyAddress}
                onChange={(e) => setClientDetails(prev => ({ ...prev, propertyAddress: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full">
            Continue to Project Details
          </Button>
        </form>
      )}

      {/* Project Details Step */}
      {step === 'project-details' && (
        <form onSubmit={handleProjectDetailsSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Project Information</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type *
              </label>
              <select
                value={projectDetails.projectType}
                onChange={(e) => setProjectDetails(prev => ({ ...prev, projectType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a project type</option>
                {projectTypes.map(type => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                value={projectDetails.description}
                onChange={(e) => setProjectDetails(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the project requirements, scope, and any specific details..."
                required
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              type="button" 
              onClick={() => setStep('client-details')}
              className="flex-1 bg-gray-500 hover:bg-gray-600"
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating Project...' : 'Create Project'}
            </Button>
          </div>
        </form>
      )}

      {/* SoW Generation Step */}
      {step === 'sow-generation' && currentProject && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Generate Scope of Work</h2>
            
            <div className="mb-4">
              <h3 className="font-medium">Project Summary:</h3>
              <p className="text-gray-600">{currentProject.projectType} for {currentProject.clientName}</p>
              <p className="text-gray-600">{currentProject.propertyAddress}</p>
            </div>
            
            {currentProject.status === 'sow_generating' ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating detailed SoW and timeline...</p>
                <p className="text-sm text-gray-500 mt-2">This may take up to 30 minutes</p>
              </div>
            ) : currentProject.status === 'ready' ? (
              <div className="text-center py-8">
                <div className="text-green-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-green-600 font-medium">SoW Generated Successfully!</p>
                <p className="text-gray-600 mt-2">Ready to create your professional quote</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Button onClick={handleGenerateSoW} disabled={loading} className="px-8">
                  {loading ? 'Generating...' : 'Generate SoW & Timeline'}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  This will create a detailed scope of work with timeline optimization
                </p>
              </div>
            )}
          </div>
          
          {currentProject.status === 'ready' && (
            <Button onClick={() => setStep('quote-creation')} className="w-full">
              Continue to Quote Creation
            </Button>
          )}
        </div>
      )}

      {/* Quote Creation Step */}
      {step === 'quote-creation' && currentProject && (
        <form onSubmit={handleQuoteSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Create Professional Quote</h2>
            
            {/* Quote Breakdown */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Cost Breakdown</h3>
                <Button type="button" onClick={addBreakdownItem} className="text-sm">
                  Add Item
                </Button>
              </div>
              
              {quoteData.breakdown.map((item, index) => (
                <div key={index} className="grid grid-cols-6 gap-2 mb-2 items-end">
                  <div>
                    <input
                      type="text"
                      placeholder="Category"
                      value={item.category}
                      onChange={(e) => updateBreakdownItem(index, 'category', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateBreakdownItem(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <select
                      value={item.type}
                      onChange={(e) => updateBreakdownItem(index, 'type', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="material">Material</option>
                      <option value="labor">Labor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateBreakdownItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateBreakdownItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">£{item.totalPrice.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => removeBreakdownItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Totals */}
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>Materials: £{totals.materialTotal.toFixed(2)}</p>
                    <p>Labor: £{totals.laborTotal.toFixed(2)}</p>
                    <p>Other: £{totals.otherTotal.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">Total: £{totals.grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Timeline and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeline (Working Days)
                </label>
                <input
                  type="number"
                  value={quoteData.timeline}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, timeline: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Earliest Start Date
                </label>
                <input
                  type="date"
                  value={quoteData.startDate}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quote Valid Until
                </label>
                <input
                  type="date"
                  value={quoteData.validUntil}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, validUntil: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            {/* Terms and Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms and Conditions
              </label>
              <textarea
                value={quoteData.terms}
                onChange={(e) => setQuoteData(prev => ({ ...prev, terms: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your terms and conditions..."
                required
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              type="button" 
              onClick={() => setStep('sow-generation')}
              className="flex-1 bg-gray-500 hover:bg-gray-600"
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating & Sending Quote...' : 'Create & Send Quote'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}