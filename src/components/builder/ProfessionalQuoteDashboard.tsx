'use client';

import React, { useEffect, useState } from 'react';
import { builderQuoteGenerationService, BuilderQuoteProject } from '@/lib/services/builderQuoteGenerationService';
import { Button } from '@/components/ui/Button';

interface ProfessionalQuoteDashboardProps {
  builderId: string;
}

export default function ProfessionalQuoteDashboard({ builderId }: ProfessionalQuoteDashboardProps) {
  const [projects, setProjects] = useState<BuilderQuoteProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [builderId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const builderProjects = await builderQuoteGenerationService.getBuilderProjects(builderId);
      setProjects(builderProjects);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: BuilderQuoteProject['status']) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      sow_generating: { color: 'bg-blue-100 text-blue-800', label: 'Generating SoW' },
      ready: { color: 'bg-green-100 text-green-800', label: 'Ready' },
      sent: { color: 'bg-purple-100 text-purple-800', label: 'Sent' },
      viewed: { color: 'bg-indigo-100 text-indigo-800', label: 'Viewed' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  const copyQuoteLink = (token: string) => {
    const url = `${window.location.origin}/quote/view/${token}`;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Professional Quotes</h2>
        <div className="text-sm text-gray-600">
          {projects.length} {projects.length === 1 ? 'quote' : 'quotes'} created
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes created yet</h3>
          <p className="text-gray-600 mb-4">
            Create professional quotes for your clients using our AI-powered tools
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client & Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.clientName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.projectType}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-xs">
                          {project.propertyAddress}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {project.quote ? formatCurrency(project.quote.totalAmount) : '-'}
                      </div>
                      {project.quote && (
                        <div className="text-xs text-gray-500">
                          {project.quote.timeline} days
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.viewedAt ? (
                        <div>
                          <div>Viewed</div>
                          <div className="text-xs">{formatDate(project.viewedAt)}</div>
                        </div>
                      ) : project.status === 'sent' ? (
                        'Sent to client'
                      ) : (
                        formatDate(project.updatedAt)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {(project.status === 'sent' || project.status === 'viewed') && (
                          <Button
                            onClick={() => copyQuoteLink(project.invitationToken)}
                            className="text-xs px-2 py-1"
                          >
                            Copy Link
                          </Button>
                        )}
                        <Button
                          onClick={() => window.open(`/quote/view/${project.invitationToken}`, '_blank')}
                          className="text-xs px-2 py-1 bg-gray-500 hover:bg-gray-600"
                        >
                          Preview
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Total Quotes</div>
            <div className="text-2xl font-bold">{projects.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Sent to Clients</div>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'sent' || p.status === 'viewed').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Viewed by Clients</div>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'viewed').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Total Quote Value</div>
            <div className="text-2xl font-bold">
              {formatCurrency(
                projects
                  .filter(p => p.quote)
                  .reduce((sum, p) => sum + (p.quote?.totalAmount || 0), 0)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}