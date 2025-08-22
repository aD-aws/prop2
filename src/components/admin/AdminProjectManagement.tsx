'use client';

import React, { useState, useEffect } from 'react';
import {
  AdminInvitationData,
  adminAnalyticsService
} from '@/lib/services/adminAnalyticsService';

interface AdminProjectManagementProps {
  className?: string;
}

export default function AdminProjectManagement({ className = '' }: AdminProjectManagementProps) {
  const [projects, setProjects] = useState<AdminInvitationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    postcode: '',
    projectType: '',
    status: ''
  });
  const [selectedProject, setSelectedProject] = useState<AdminInvitationData | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedBuilders, setSelectedBuilders] = useState<string[]>([]);

  useEffect(() => {
    loadProjects();
  }, [filters]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const projectData = await adminAnalyticsService.getProjectsForInvitation(
        filters.postcode || undefined,
        filters.projectType || undefined,
        filters.status || undefined
      );

      setProjects(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteBuilders = async () => {
    if (!selectedProject || selectedBuilders.length === 0) return;

    try {
      setLoading(true);
      
      // Invite each selected builder
      for (const builderId of selectedBuilders) {
        await adminAnalyticsService.inviteBuilderToProject(
          selectedProject.projectId,
          builderId,
          'admin-user-id' // TODO: Get actual admin user ID
        );
      }

      // Refresh projects list
      await loadProjects();
      
      // Close modal and reset selection
      setShowInviteModal(false);
      setSelectedProject(null);
      setSelectedBuilders([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite builders');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'invited':
        return 'bg-blue-100 text-blue-800';
      case 'quoted':
        return 'bg-green-100 text-green-800';
      case 'contracted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
        <p className="text-gray-600 mt-1">Manage builder invitations and project assignments</p>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Postcode</label>
            <input
              type="text"
              value={filters.postcode}
              onChange={(e) => setFilters(prev => ({ ...prev, postcode: e.target.value }))}
              placeholder="Enter postcode..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Type</label>
            <select
              value={filters.projectType}
              onChange={(e) => setFilters(prev => ({ ...prev, projectType: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="loft-conversion">Loft Conversion</option>
              <option value="kitchen-renovation">Kitchen Renovation</option>
              <option value="bathroom-renovation">Bathroom Renovation</option>
              <option value="extension">Extension</option>
              <option value="garage-conversion">Garage Conversion</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="invited">Invited</option>
              <option value="quoted">Quoted</option>
              <option value="contracted">Contracted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-6 bg-red-50 border-l-4 border-red-400">
          <div className="text-red-700">
            <p>{error}</p>
            <button
              onClick={loadProjects}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Homeowner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Postcode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estimated Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Builders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.projectId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {project.homeownerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.projectType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.postcode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(project.estimatedValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>{project.invitedBuilders.length} invited</span>
                    <span className="text-gray-400">|</span>
                    <span>{project.availableBuilders.length} available</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowInviteModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Invite Builders
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {projects.length === 0 && !loading && (
        <div className="p-6 text-center text-gray-500">
          No projects found matching the current filters.
        </div>
      )}

      {/* Invite Builders Modal */}
      {showInviteModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Invite Builders to Project
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Project:</strong> {selectedProject.projectType}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Homeowner:</strong> {selectedProject.homeownerName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Postcode:</strong> {selectedProject.postcode}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Builders ({selectedProject.availableBuilders.length})
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                  {selectedProject.availableBuilders.map((builderId) => (
                    <label key={builderId} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedBuilders.includes(builderId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBuilders(prev => [...prev, builderId]);
                          } else {
                            setSelectedBuilders(prev => prev.filter(id => id !== builderId));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">Builder {builderId}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedProject(null);
                    setSelectedBuilders([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteBuilders}
                  disabled={selectedBuilders.length === 0 || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Inviting...' : `Invite ${selectedBuilders.length} Builder(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}