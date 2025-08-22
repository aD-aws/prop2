import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface EmailNotification {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

interface SMSNotification {
  phoneNumber: string;
  message: string;
}

interface WhatsAppNotification {
  phoneNumber: string;
  message: string;
  templateName?: string;
  templateParams?: Record<string, string>;
}

interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private sesClient: SESClient;
  private snsClient: SNSClient;
  private readonly FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@homeimprovementplatform.co.uk';

  constructor() {
    this.sesClient = new SESClient({ region: process.env.AWS_REGION });
    this.snsClient = new SNSClient({ region: process.env.AWS_REGION });
  }

  /**
   * Send email notification
   */
  async sendEmail(notification: EmailNotification): Promise<void> {
    try {
      const command = new SendEmailCommand({
        Source: this.FROM_EMAIL,
        Destination: {
          ToAddresses: [notification.to]
        },
        Message: {
          Subject: {
            Data: notification.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: notification.htmlBody,
              Charset: 'UTF-8'
            },
            Text: {
              Data: notification.textBody,
              Charset: 'UTF-8'
            }
          }
        }
      });

      await this.sesClient.send(command);
      console.log(`Email sent successfully to ${notification.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(notification: SMSNotification): Promise<void> {
    try {
      const command = new PublishCommand({
        PhoneNumber: notification.phoneNumber,
        Message: notification.message
      });

      await this.snsClient.send(command);
      console.log(`SMS sent successfully to ${notification.phoneNumber}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Notify builder about new lead offer
   */
  async notifyBuilderOfLeadOffer(builderData: {
    email: string;
    name: string;
    phoneNumber?: string;
  }, leadData: {
    id: string;
    projectType: string;
    postcode: string;
    estimatedBudget: number;
    price: number;
    expiresAt: Date;
  }): Promise<void> {
    const subject = `New Lead Available: ${leadData.projectType} in ${leadData.postcode}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Lead Opportunity</h2>
        
        <p>Hello ${builderData.name},</p>
        
        <p>A new lead matching your specializations is available:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">${leadData.projectType}</h3>
          <p><strong>Location:</strong> ${leadData.postcode}</p>
          <p><strong>Estimated Budget:</strong> £${leadData.estimatedBudget.toLocaleString()}</p>
          <p><strong>Lead Price:</strong> £${leadData.price}</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>⏰ Time Sensitive:</strong> This offer expires on ${leadData.expiresAt.toLocaleString()}
          </p>
        </div>
        
        <p>To accept this lead and gain access to the full project details:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/builder/leads" 
             style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Lead Details
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Remember: You have 12 hours to accept this lead before it's offered to the next builder.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 12px;">
          This email was sent because you have an active subscription with our platform.
          <a href="${process.env.FRONTEND_URL}/builder/settings">Manage your preferences</a>
        </p>
      </div>
    `;

    const textBody = `
New Lead Opportunity

Hello ${builderData.name},

A new lead matching your specializations is available:

Project: ${leadData.projectType}
Location: ${leadData.postcode}
Estimated Budget: £${leadData.estimatedBudget.toLocaleString()}
Lead Price: £${leadData.price}

⏰ IMPORTANT: This offer expires on ${leadData.expiresAt.toLocaleString()}

To accept this lead, visit: ${process.env.FRONTEND_URL}/builder/leads

You have 12 hours to accept this lead before it's offered to the next builder.
    `;

    await this.sendEmail({
      to: builderData.email,
      subject,
      htmlBody,
      textBody
    });

    // Also send SMS if phone number is available
    if (builderData.phoneNumber) {
      const smsMessage = `New lead: ${leadData.projectType} in ${leadData.postcode}. Budget: £${leadData.estimatedBudget.toLocaleString()}. Lead price: £${leadData.price}. Expires: ${leadData.expiresAt.toLocaleString()}. View: ${process.env.FRONTEND_URL}/builder/leads`;
      
      await this.sendSMS({
        phoneNumber: builderData.phoneNumber,
        message: smsMessage
      });
    }
  }

  /**
   * Notify homeowner that a builder has been found
   */
  async notifyHomeownerBuilderFound(homeownerData: {
    email: string;
    name: string;
    phoneNumber?: string;
  }, projectData: {
    id: string;
    projectType: string;
    postcode: string;
  }, builderData: {
    id: string;
    companyName: string;
    rating: number;
  }): Promise<void> {
    const subject = `Great News! Builder Found for Your ${projectData.projectType}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Builder Found!</h2>
        
        <p>Hello ${homeownerData.name},</p>
        
        <p>Excellent news! We've found a qualified builder for your project:</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #1f2937;">${projectData.projectType}</h3>
          <p><strong>Location:</strong> ${projectData.postcode}</p>
          <p><strong>Builder:</strong> ${builderData.companyName}</p>
          <p><strong>Rating:</strong> ⭐ ${builderData.rating}/5.0</p>
        </div>
        
        <p>The builder will be in touch soon to discuss your project and provide a detailed quote.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/projects/${projectData.id}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Project Details
          </a>
        </div>
        
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1e40af;">What happens next?</h4>
          <ul style="color: #1e40af; margin-bottom: 0;">
            <li>The builder will contact you within 24 hours</li>
            <li>They'll arrange a site visit if needed</li>
            <li>You'll receive a detailed quote based on your SoW</li>
            <li>You can compare quotes and select your preferred builder</li>
          </ul>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 12px;">
          Need help? Contact our support team at support@homeimprovementplatform.co.uk
        </p>
      </div>
    `;

    const textBody = `
🎉 Builder Found!

Hello ${homeownerData.name},

Great news! We've found a qualified builder for your ${projectData.projectType} project in ${projectData.postcode}.

Builder: ${builderData.companyName}
Rating: ${builderData.rating}/5.0

The builder will contact you within 24 hours to discuss your project and provide a quote.

View your project: ${process.env.FRONTEND_URL}/projects/${projectData.id}

What happens next:
- Builder will contact you within 24 hours
- Site visit arranged if needed
- Detailed quote provided
- Compare quotes and select your builder
    `;

    await this.sendEmail({
      to: homeownerData.email,
      subject,
      htmlBody,
      textBody
    });

    // Also send SMS if phone number is available
    if (homeownerData.phoneNumber) {
      const smsMessage = `🎉 Builder found for your ${projectData.projectType}! ${builderData.companyName} (${builderData.rating}⭐) will contact you within 24hrs. View: ${process.env.FRONTEND_URL}/projects/${projectData.id}`;
      
      await this.sendSMS({
        phoneNumber: homeownerData.phoneNumber,
        message: smsMessage
      });
    }
  }

  /**
   * Notify homeowner that no builders are available
   */
  async notifyHomeownerNoBuilders(homeownerData: {
    email: string;
    name: string;
  }, projectData: {
    projectType: string;
    postcode: string;
  }): Promise<void> {
    const subject = `Update on Your ${projectData.projectType} Project`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Project Update</h2>
        
        <p>Hello ${homeownerData.name},</p>
        
        <p>We wanted to update you on your ${projectData.projectType} project in ${projectData.postcode}.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0; color: #991b1b;">
            Unfortunately, we don't currently have any available builders in your area who specialize in this type of project.
          </p>
        </div>
        
        <h3 style="color: #1f2937;">What you can do:</h3>
        <ul>
          <li><strong>Expand your search area:</strong> Consider builders from nearby postcodes</li>
          <li><strong>Adjust project scope:</strong> Modify your requirements to attract more builders</li>
          <li><strong>Wait for new builders:</strong> We're constantly adding new qualified builders to our platform</li>
          <li><strong>Try again later:</strong> Builder availability changes frequently</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/find-builders" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Find Builders
          </a>
        </div>
        
        <p>We apologize for any inconvenience and appreciate your understanding.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 12px;">
          Need assistance? Contact our support team at support@homeimprovementplatform.co.uk
        </p>
      </div>
    `;

    const textBody = `
Project Update

Hello ${homeownerData.name},

We wanted to update you on your ${projectData.projectType} project in ${projectData.postcode}.

Unfortunately, we don't currently have any available builders in your area who specialize in this type of project.

What you can do:
- Expand your search area to nearby postcodes
- Adjust project scope to attract more builders  
- Wait for new builders to join our platform
- Try again later as availability changes

Find builders: ${process.env.FRONTEND_URL}/find-builders

We apologize for any inconvenience.
    `;

    await this.sendEmail({
      to: homeownerData.email,
      subject,
      htmlBody,
      textBody
    });
  }

  /**
   * Notify builder with project access details
   */
  async notifyBuilderProjectAccess(builderData: {
    email: string;
    name: string;
  }, projectData: {
    id: string;
    projectType: string;
    postcode: string;
  }, invitationCode: string): Promise<void> {
    const subject = `Project Access Granted: ${projectData.projectType}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Project Access Granted</h2>
        
        <p>Hello ${builderData.name},</p>
        
        <p>Congratulations! You now have access to the following project:</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">${projectData.projectType}</h3>
          <p><strong>Location:</strong> ${projectData.postcode}</p>
          <p><strong>Project ID:</strong> ${projectData.id}</p>
        </div>
        
        <p>You can now:</p>
        <ul>
          <li>View the complete Scope of Work (SoW)</li>
          <li>Review project timeline and requirements</li>
          <li>Submit your quote and proposal</li>
          <li>Communicate with the homeowner</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/builder/projects/${projectData.id}?code=${invitationCode}" 
             style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Access Project
          </a>
        </div>
        
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af;">
            <strong>💡 Tip:</strong> Submit your quote promptly to increase your chances of winning this project.
          </p>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 12px;">
          This project will remain accessible in your dashboard for future reference.
        </p>
      </div>
    `;

    const textBody = `
Project Access Granted

Hello ${builderData.name},

Congratulations! You now have access to a new project:

Project: ${projectData.projectType}
Location: ${projectData.postcode}
Project ID: ${projectData.id}

You can now view the SoW, review requirements, and submit your quote.

Access project: ${process.env.FRONTEND_URL}/builder/projects/${projectData.id}?code=${invitationCode}

Submit your quote promptly to increase your chances of winning this project.
    `;

    await this.sendEmail({
      to: builderData.email,
      subject,
      htmlBody,
      textBody
    });
  }

  /**
   * Notify homeowner that no more builders are available
   */
  async notifyHomeownerNoMoreBuilders(homeownerData: {
    email: string;
    name: string;
  }, projectData: {
    projectType: string;
    postcode: string;
  }): Promise<void> {
    const subject = `Final Update on Your ${projectData.projectType} Project`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Project Update</h2>
        
        <p>Hello ${homeownerData.name},</p>
        
        <p>We have a final update on your ${projectData.projectType} project in ${projectData.postcode}.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0; color: #991b1b;">
            After offering your project to all available qualified builders in your area, none were able to take on the project at this time.
          </p>
        </div>
        
        <h3 style="color: #1f2937;">Next steps:</h3>
        <ul>
          <li><strong>Create a new lead:</strong> Try again with adjusted requirements or expanded area</li>
          <li><strong>Direct builder search:</strong> Use our builder directory to contact builders directly</li>
          <li><strong>Wait and retry:</strong> New builders join regularly, try again in a few weeks</li>
          <li><strong>Get support:</strong> Contact our team for personalized assistance</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/find-builders" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            Find Builders
          </a>
          <a href="${process.env.FRONTEND_URL}/support" 
             style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Get Support
          </a>
        </div>
        
        <p>We sincerely apologize that we couldn't connect you with a builder this time. We're continuously working to expand our network of qualified professionals.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 12px;">
          Questions? Contact our support team at support@homeimprovementplatform.co.uk
        </p>
      </div>
    `;

    const textBody = `
Final Project Update

Hello ${homeownerData.name},

After offering your ${projectData.projectType} project in ${projectData.postcode} to all available qualified builders, none were able to take on the project at this time.

Next steps:
- Create a new lead with adjusted requirements
- Use our builder directory for direct contact
- Wait and retry in a few weeks
- Contact our support team for assistance

Find builders: ${process.env.FRONTEND_URL}/find-builders
Get support: ${process.env.FRONTEND_URL}/support

We apologize we couldn't connect you with a builder this time.
    `;

    await this.sendEmail({
      to: homeownerData.email,
      subject,
      htmlBody,
      textBody
    });
  }
}

export const notificationService = new NotificationService();