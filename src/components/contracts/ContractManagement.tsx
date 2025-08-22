'use client';

import React, { useState, useEffect } from 'react';
import { Contract, Project, UserType } from '../../lib/types';
import { contractService } from '../../lib/services/contractService';
import { ContractViewer } from './ContractViewer';

interface ContractManagementProps {
  project: Project;
  userType: UserType;
  userId: string;
}

export const ContractManagement: React.FC<ContractManagementProps> = ({
  project,
  userType,
  userId
}) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContracts();
  }, [project.id]);

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      const projectContracts = await contractService.getProjectContracts(project.id);
      setContracts(projectContracts);
      
      if (projectContracts.length > 0) {
        setSelectedContract(projectContracts[0]);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      setError('Failed to load contracts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContractStatusUpdate = (contractId: string, status: string) => {
    setContracts(prev => 
      prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, status: status as any, updatedAt: new Date() }
          : contract
      )
    );
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading contracts...</span>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Contracts will appear here once generated for this project.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contract List */}
      {contracts.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Project Contracts</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                  selectedContract?.id === contract.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedContract(contract)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Contract #{contract.id.slice(-8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created {contract.createdAt.toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      £{contract.totalAmount.toLocaleString()}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                      contract.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {contract.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Contract Viewer */}
      {selectedContract && (
        <ContractViewer
          contract={selectedContract}
          userType={userType}
          userId={userId}
          onStatusUpdate={(status) => handleContractStatusUpdate(selectedContract.id, status)}
          onError={handleError}
        />
      )}

      {/* Contract History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Contract History</h3>
        </div>
        <div className="px-4 py-3">
          <div className="flow-root">
            <ul className="-mb-8">
              {contracts.map((contract, contractIdx) => (
                <li key={contract.id}>
                  <div className="relative pb-8">
                    {contractIdx !== contracts.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          contract.status === 'signed' ? 'bg-green-500' :
                          contract.status === 'draft' ? 'bg-gray-400' :
                          'bg-yellow-500'
                        }`}>
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Contract #{contract.id.slice(-8)} {' '}
                            <span className="font-medium text-gray-900">
                              {contract.status.replace('_', ' ')}
                            </span>
                          </p>
                          <p className="text-xs text-gray-400">
                            £{contract.totalAmount.toLocaleString()} • {contract.projectTimeline} days
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={contract.createdAt.toISOString()}>
                            {contract.createdAt.toLocaleDateString('en-GB')}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};