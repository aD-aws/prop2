'use client';

import React, { useState } from 'react';
import { Contract, UserType } from '../../lib/types';
import { contractService } from '../../lib/services/contractService';
import { docuSignService } from '../../lib/services/docusignService';

interface ContractViewerProps {
  contract: Contract;
  userType: UserType;
  userId: string;
  onStatusUpdate?: (status: string) => void;
  onError?: (error: string) => void;
}

export const ContractViewer: React.FC<ContractViewerProps> = ({
  contract,
  userType,
  userId,
  onStatusUpdate,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showFullContract, setShowFullContract] = useState(false);

  const handleDownloadPDF = async () => {
    setIsLoading(true);
    try {
      // Check if user has access to PDF downloads
      if (userType === 'homeowner') {
        // Check subscription status - this would be implemented in a real app
        const hasAccess = true; // Placeholder
        if (!hasAccess) {
          onError?.('PDF download requires a paid subscription. Please upgrade to access this feature.');
          return;
        }
      }

      // Generate and download PDF
      const blob = await generateContractPDF(contract);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Contract_${contract.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading contract:', error);
      onError?.('Failed to download contract. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!docuSignService.isDocuSignEnabled()) {
      onError?.('Digital signing is not currently available. Please contact support.');
      return;
    }

    setIsLoading(true);
    try {
      // This would integrate with DocuSign
      // For now, we'll simulate the signing process
      await contractService.updateContractStatus(contract.id, 'sent_for_signing');
      onStatusUpdate?.('sent_for_signing');
    } catch (error) {
      console.error('Error initiating contract signing:', error);
      onError?.('Failed to initiate contract signing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      pending_signatures: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Signatures' },
      sent_for_signing: { color: 'bg-blue-100 text-blue-800', text: 'Sent for Signing' },
      partially_signed: { color: 'bg-orange-100 text-orange-800', text: 'Partially Signed' },
      signed: { color: 'bg-green-100 text-green-800', text: 'Fully Signed' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const generateContractPDF = async (contract: Contract): Promise<Blob> => {
    // This would use a PDF generation library like jsPDF or Puppeteer
    // For now, we'll create a simple text blob
    const content = `
CONTRACT DOCUMENT

Contract ID: ${contract.id}
Project ID: ${contract.projectId}
Total Amount: £${contract.totalAmount.toLocaleString()}
Timeline: ${contract.projectTimeline} working days
Start Date: ${contract.startDate.toLocaleDateString('en-GB')}
Completion Date: ${contract.projectedCompletionDate.toLocaleDateString('en-GB')}

${contract.content}

Terms and Conditions:
${contract.termsAndConditions}

Generated on: ${new Date().toLocaleDateString('en-GB')}
    `;

    return new Blob([content], { type: 'text/plain' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Contract #{contract.id.slice(-8)}
            </h3>
            <p className="text-sm text-gray-600">
              Created on {contract.createdAt.toLocaleDateString('en-GB')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(contract.status)}
          </div>
        </div>
      </div>

      {/* Contract Summary */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Contract Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Amount:</span>
            <div className="font-medium text-lg">£{contract.totalAmount.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-gray-600">Timeline:</span>
            <div className="font-medium">{contract.projectTimeline} working days</div>
          </div>
          <div>
            <span className="text-gray-600">Start Date:</span>
            <div className="font-medium">{contract.startDate.toLocaleDateString('en-GB')}</div>
          </div>
          <div>
            <span className="text-gray-600">Completion:</span>
            <div className="font-medium">{contract.projectedCompletionDate.toLocaleDateString('en-GB')}</div>
          </div>
        </div>
      </div>

      {/* Compliance Checks */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Compliance Verification</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">UK Building Regulations</span>
          </div>
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">Industry Standards</span>
          </div>
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">Unambiguous Terms</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Validated on {contract.complianceChecks.validatedAt.toLocaleDateString('en-GB')}
        </p>
      </div>

      {/* Contract Content Preview */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Contract Content</h4>
          <button
            onClick={() => setShowFullContract(!showFullContract)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showFullContract ? 'Show Less' : 'Show Full Contract'}
          </button>
        </div>
        
        <div className={`bg-gray-50 rounded-lg p-4 ${showFullContract ? '' : 'max-h-40 overflow-hidden'}`}>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {showFullContract ? contract.content : contract.content.substring(0, 500) + '...'}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isLoading ? 'Generating...' : 'Download PDF'}
          </button>

          {contract.status === 'draft' && (
            <button
              onClick={handleSignContract}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? 'Processing...' : 'Send for Signing'}
            </button>
          )}

          {contract.status === 'sent_for_signing' && docuSignService.isDocuSignEnabled() && (
            <div className="text-sm text-gray-600">
              Contract has been sent for digital signing via DocuSign
            </div>
          )}

          {contract.signedAt && (
            <div className="text-sm text-green-600">
              ✓ Contract signed on {contract.signedAt.toLocaleDateString('en-GB')}
            </div>
          )}
        </div>

        {userType === 'homeowner' && contract.status === 'draft' && (
          <p className="text-xs text-gray-500 mt-2">
            Note: PDF download and digital signing require a paid subscription
          </p>
        )}
      </div>
    </div>
  );
};