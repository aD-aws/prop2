'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { InvitationService } from '@/lib/services/invitationService';
import { ProjectType } from '@/lib/types';

interface InvitationManagerProps {
  projectId: string;
  homeownerId: string;
  projectType: ProjectType;
  homeownerName: string;
}

export function InvitationManager({ 
  projectId, 
  homeownerId, 
  projectType, 
  homeownerName 
}: InvitationManagerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvitation, setGeneratedInvitation] = useState<{
    code: string;
    qrUrl: string;
    emailContent: { subject: string; body: string; inviteUrl: string };
    whatsappContent: { message: string; inviteUrl: string };
  } | null>(null);
  const [error, setError] = useState('');

  const generateInvitation = async (type: 'qr' | 'email' | 'whatsapp') => {
    setIsGenerating(true);
    setError('');

    try {
      const result = await InvitationService.generateInvitationCode(
        projectId,
        homeownerId,
        type
      );

      if (result.success && result.invitationCode) {
        const qrUrl = InvitationService.generateQRCodeURL(result.invitationCode);
        const emailContent = InvitationService.generateEmailInvitation(
          result.invitationCode,
          homeownerName,
          projectType.replace('_', ' ')
        );
        const whatsappContent = InvitationService.generateWhatsAppInvitation(
          result.invitationCode,
          homeownerName,
          projectType.replace('_', ' ')
        );

        setGeneratedInvitation({
          code: result.invitationCode,
          qrUrl,
          emailContent,
          whatsappContent,
        });
      } else {
        setError(result.error || 'Failed to generate invitation');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const openWhatsApp = () => {
    if (generatedInvitation) {
      const encodedMessage = encodeURIComponent(generatedInvitation.whatsappContent.message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };

  const openEmailClient = () => {
    if (generatedInvitation) {
      const { subject, body } = generatedInvitation.emailContent;
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      window.open(`mailto:?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Invite Builders to Quote
      </h3>
      
      <p className="text-sm text-gray-600 mb-6">
        Generate invitation codes to share with trusted builders. Each code can only be used once and expires in 7 days.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {!generatedInvitation ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              onClick={() => generateInvitation('qr')}
              loading={isGenerating}
              variant="outline"
              className="flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Generate QR Code
            </Button>
            
            <Button
              onClick={() => generateInvitation('email')}
              loading={isGenerating}
              variant="outline"
              className="flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Invitation
            </Button>
            
            <Button
              onClick={() => generateInvitation('whatsapp')}
              loading={isGenerating}
              variant="outline"
              className="flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
              </svg>
              WhatsApp Invitation
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Invitation Code Generated</h4>
            <div className="flex items-center space-x-2">
              <code className="bg-white px-3 py-2 rounded border text-lg font-mono">
                {generatedInvitation.code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedInvitation.code)}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Code */}
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-3">QR Code</h4>
              <div className="bg-white p-4 rounded-lg border inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={generatedInvitation.qrUrl} 
                  alt="Invitation QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Builders can scan this QR code to register
              </p>
            </div>

            {/* Sharing Options */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Share Invitation</h4>
                
                <div className="space-y-3">
                  <Button
                    onClick={openEmailClient}
                    variant="outline"
                    className="w-full flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </Button>
                  
                  <Button
                    onClick={openWhatsApp}
                    variant="outline"
                    className="w-full flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                    </svg>
                    Send WhatsApp
                  </Button>
                  
                  <Button
                    onClick={() => copyToClipboard(generatedInvitation.emailContent.inviteUrl)}
                    variant="outline"
                    className="w-full flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={() => setGeneratedInvitation(null)}
              variant="outline"
            >
              Generate Another Invitation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}