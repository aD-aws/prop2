'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Project, BuilderProfile } from '../../lib/types';

interface BuilderWithId extends BuilderProfile {
  id: string;
}
import { leadPurchaseService } from '../../lib/services/leadPurchaseService';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LeadPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  availableBuilders: BuilderWithId[];
  onSuccess: (builderId: string) => void;
}

const LeadPurchaseContent: React.FC<LeadPurchaseModalProps> = ({
  isOpen,
  onClose,
  project,
  availableBuilders,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [selectedBuilders, setSelectedBuilders] = useState<string[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  React.useEffect(() => {
    calculateTotalCost();
  }, [selectedBuilders, project]);

  const calculateTotalCost = () => {
    const cost = selectedBuilders.length * leadPurchaseService.calculateLeadPrice(
      project.projectType,
      project.sowDocument?.estimatedCosts.totalEstimate
    );
    setTotalCost(cost);
  };

  const handleBuilderToggle = (builderId: string) => {
    setSelectedBuilders(prev => 
      prev.includes(builderId)
        ? prev.filter(id => id !== builderId)
        : [...prev, builderId]
    );
  };

  const handlePurchase = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || selectedBuilders.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Process each lead purchase
      for (const builderId of selectedBuilders) {
        const { leadPurchase, clientSecret } = await leadPurchaseService.purchaseLead({
          builderId,
          projectId: project.id,
          stripeCustomerId: 'cus_placeholder', // This should be the actual customer ID
        });

        // Confirm payment
        const { error } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (error) {
          throw new Error(`Payment failed for builder ${builderId}: ${error.message}`);
        }

        // Grant access
        await leadPurchaseService.grantProjectAccess(leadPurchase.id);
        onSuccess(builderId);
      }

      onClose();
    } catch (error) {
      console.error('Lead purchase error:', error);
      alert(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const leadPrice = leadPurchaseService.calculateLeadPrice(
    project.projectType,
    project.sowDocument?.estimatedCosts.totalEstimate
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Purchase Additional Builder Leads</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Invite additional qualified builders to quote on your project. Each lead costs £{leadPrice.toFixed(2)}.
          </p>
        </div>

        <form onSubmit={handlePurchase} className="p-6 space-y-6">
          {/* Builder Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Builders to Invite</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableBuilders.map((builder) => (
                <div
                  key={builder.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedBuilders.includes(builder.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleBuilderToggle(builder.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedBuilders.includes(builder.id)}
                          onChange={() => handleBuilderToggle(builder.id)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{builder.companyName}</h4>
                          <p className="text-sm text-gray-600">
                            {builder.firstName} {builder.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 ml-7">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {builder.rating && (
                            <div className="flex items-center">
                              <span className="text-yellow-400 mr-1">★</span>
                              <span>{builder.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {builder.completedProjects && (
                            <span>{builder.completedProjects} projects completed</span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">
                            Specializes in: {builder.specializations.slice(0, 3).join(', ')}
                            {builder.specializations.length > 3 && '...'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">£{leadPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {availableBuilders.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No additional builders available for your project type and location.
              </p>
            )}
          </div>

          {/* Cost Summary */}
          {selectedBuilders.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">
                  Total ({selectedBuilders.length} builder{selectedBuilders.length !== 1 ? 's' : ''})
                </span>
                <span className="text-xl font-bold text-gray-900">
                  £{totalCost.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Each builder will receive your project details and can submit a quote.
              </p>
            </div>
          )}

          {/* Payment Details */}
          {selectedBuilders.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Details
              </label>
              <div className="border border-gray-300 rounded-md p-3">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {/* Terms */}
          {selectedBuilders.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">What happens next:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Selected builders will be notified of your project</li>
                <li>• They can view your project details and submit quotes</li>
                <li>• You'll receive notifications when new quotes are submitted</li>
                <li>• Compare all quotes in your dashboard</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading || selectedBuilders.length === 0}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Purchase for £${totalCost.toFixed(2)}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const LeadPurchaseModal: React.FC<LeadPurchaseModalProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <LeadPurchaseContent {...props} />
    </Elements>
  );
};

export default LeadPurchaseModal;