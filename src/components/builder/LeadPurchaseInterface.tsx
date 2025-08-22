'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Project, LeadOffer } from '../../lib/types';
import { builderSubscriptionService } from '../../lib/services/builderSubscriptionService';
import { leadPurchaseService } from '../../lib/services/leadPurchaseService';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LeadPurchaseInterfaceProps {
  builderId: string;
  offer: LeadOffer;
  project: Project;
  onSuccess: () => void;
  onCancel: () => void;
}

const LeadPurchaseContent: React.FC<LeadPurchaseInterfaceProps> = ({
  builderId,
  offer,
  project,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [canPurchase, setCanPurchase] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    checkPurchaseEligibility();
    const timer = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, [builderId]);

  const checkPurchaseEligibility = async () => {
    try {
      const eligible = await builderSubscriptionService.canBuilderPurchaseLeads(builderId);
      setCanPurchase(eligible);
    } catch (error) {
      console.error('Error checking purchase eligibility:', error);
      setCanPurchase(false);
    }
  };

  const updateTimeRemaining = () => {
    const now = new Date();
    const expiresAt = new Date(offer.expiresAt);
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Expired');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
  };

  const handlePurchase = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !canPurchase) {
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Process lead purchase
      const { leadPurchase, clientSecret } = await builderSubscriptionService.purchaseLeadForBuilder(
        builderId,
        project.id,
        'cus_placeholder' // This should be the actual Stripe customer ID
      );

      // Confirm payment
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      onSuccess();
    } catch (error) {
      console.error('Lead purchase error:', error);
      alert(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const getProjectTypeDisplay = (projectType: string) => {
    return projectType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isExpired = new Date() > new Date(offer.expiresAt);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold mb-2">Lead Purchase Opportunity</h2>
        <div className="flex justify-between items-center">
          <span className="text-blue-100">Project Lead Available</span>
          <div className="text-right">
            <p className="text-sm text-blue-100">Time remaining:</p>
            <p className={`font-bold ${isExpired ? 'text-red-300' : 'text-white'}`}>
              {timeRemaining}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Project Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Project Type:</span>
              <span className="font-medium text-gray-900">
                {getProjectTypeDisplay(project.projectType)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium text-gray-900">
                {project.sowDocument ? 'Available after purchase' : 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Value:</span>
              <span className="font-medium text-gray-900">
                {project.sowDocument?.estimatedCosts.totalEstimate 
                  ? formatCurrency(project.sowDocument.estimatedCosts.totalEstimate)
                  : 'Available after purchase'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900 capitalize">
                {project.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Lead Cost */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Cost</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-900 font-medium">Lead Purchase Price:</span>
              <span className="text-2xl font-bold text-blue-900">
                {formatCurrency(offer.price)}
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              One-time payment for immediate access to project details and homeowner contact
            </p>
          </div>
        </div>

        {/* What You Get */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What You Get</h3>
          <ul className="space-y-2">
            {[
              'Complete project scope of work (SoW)',
              'Detailed materials and labor requirements',
              'Homeowner contact information',
              'Property details and compliance requirements',
              'Interactive project timeline and Gantt chart',
              'Ability to submit and modify quotes',
              'Direct communication with homeowner',
            ].map((item, index) => (
              <li key={index} className="flex items-center text-sm text-gray-700">
                <svg className="h-4 w-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Subscription Check */}
        {!canPurchase && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-800">Subscription Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  You need an active subscription to purchase leads. 
                  <button className="underline ml-1 hover:text-yellow-900">
                    View subscription plans
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {canPurchase && !isExpired && (
          <form onSubmit={handlePurchase} className="space-y-6">
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

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Purchase Terms</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Payment is processed immediately upon confirmation</li>
                <li>• Access to project details is granted instantly after payment</li>
                <li>• No refunds once project details are accessed</li>
                <li>• You have 12 hours to accept this offer before it expires</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!stripe || loading || !canPurchase}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Purchase Lead for ${formatCurrency(offer.price)}`
                )}
              </button>
            </div>
          </form>
        )}

        {/* Expired State */}
        {isExpired && (
          <div className="text-center py-6">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Offer Expired</h3>
            <p className="text-gray-600 mb-4">
              This lead offer has expired and is no longer available for purchase.
            </p>
            <button
              onClick={onCancel}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const LeadPurchaseInterface: React.FC<LeadPurchaseInterfaceProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <LeadPurchaseContent {...props} />
    </Elements>
  );
};

export default LeadPurchaseInterface;