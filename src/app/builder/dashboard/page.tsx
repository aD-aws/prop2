'use client';

import React from 'react';

export default function BuilderDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Builder Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Active Projects</h3>
                <p className="text-3xl font-bold text-blue-600">12</p>
                <p className="text-sm text-blue-700">Currently in progress</p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Completed Projects</h3>
                <p className="text-3xl font-bold text-green-600">45</p>
                <p className="text-sm text-green-700">Successfully finished</p>
              </div>
              
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Pending Quotes</h3>
                <p className="text-3xl font-bold text-yellow-600">8</p>
                <p className="text-sm text-yellow-700">Awaiting response</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium text-gray-900">New project invitation</p>
                    <p className="text-sm text-gray-600">Kitchen renovation in SW1</p>
                  </div>
                  <span className="text-sm text-gray-500">2 hours ago</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium text-gray-900">Quote submitted</p>
                    <p className="text-sm text-gray-600">Bathroom refit project</p>
                  </div>
                  <span className="text-sm text-gray-500">1 day ago</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium text-gray-900">Project completed</p>
                    <p className="text-sm text-gray-600">Loft conversion in NW3</p>
                  </div>
                  <span className="text-sm text-gray-500">3 days ago</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Welcome to your builder dashboard. This page will be enhanced with authentication and dynamic content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}