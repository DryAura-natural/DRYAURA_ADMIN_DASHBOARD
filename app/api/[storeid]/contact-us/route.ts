import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:3001',  // Frontend development
  'http://localhost:3000',  // Admin development
  'https://dryaura.in',     // Production frontend
  'https://admin.dryaura.in', // Production admin
  process.env.NEXT_PUBLIC_SITE_URL || ''
].filter(Boolean);

// CORS configuration
const corsHeaders = (origin?: string | null) => {
  const isAllowedOrigin = ALLOWED_ORIGINS.some(
    allowedOrigin => origin?.includes(allowedOrigin)
  );

  return {
   'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_FRONTEND_URL 
  ? new URL(process.env.NEXT_PUBLIC_FRONTEND_URL).origin 
  : '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
};

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || req.headers.get('referer') || null;

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}



const sendStatusUpdateEmail = async (
  contactSubmission: any, 
  newStatus: string
) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtpout.secureserver.net",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || process.env.ADMIN_EMAIL,
      pass: process.env.SMTP_PASS || process.env.ADMIN_EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  const mailOptions = {
    from: `DRYAURA Support <${process.env.SMTP_USER}>`,
    to: contactSubmission.email,
    subject: `🔔 Status Update for Your Inquiry`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F0F4F8;">
        <div style="background-color: #3D1D1D; color: white; padding: 20px; text-align: center;">
          <img src="https://cloud.appwrite.io/v1/storage/buckets/67a9cbfa001285dc191f/files/67a9d16d0027ce92d6a9/view?project=67a96cd2001e32766970&mode=admin" alt="Dryaura Logo" style="max-width: 150px;">
          <h1 style="margin: 10px 0 0;">Inquiry Status Update</h1>
        </div>

        <div style="background-color: white; padding: 20px; margin-top: 20px;">
          <h2 style="color: #3D1D1D;">Hello ${contactSubmission.name || 'Valued Customer'},</h2>
          
          <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #3D1D1D; margin-top: 0;">📋 Inquiry Details</h3>
            <p><strong>Inquiry ID:</strong> ${contactSubmission.id}</p>
            <p><strong>Current Status:</strong> ${newStatus}</p>
            <p><strong>Submitted On:</strong> ${contactSubmission.createdAt.toLocaleString()}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #E9F5E9; border-radius: 8px;">
            <h3 style="color: #3D1D1D;">🌟 What This Means</h3>
            ${getStatusDescription(newStatus)}
          </div>

          <p style="margin-top: 20px; color: #2C3E50;">
            If you have any questions, please reply to this email or contact our support team.
          </p>
        </div>

        <div style="background-color: #3D1D1D; color: white; text-align: center; padding: 10px; margin-top: 20px;">
          <p style="margin: 0; font-size: 12px;">© 2024 Dryaura. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent to ${contactSubmission.email}`);
  } catch (error) {
    console.error('Error sending status update email:', error);
  }
};

// Helper function to provide status descriptions
const getStatusDescription = (status: string) => {
  const statusDescriptions: Record<string, string> = {
    'PENDING': `
      <p>Your inquiry has been received and is being processed. 
      Our team is reviewing the details and will get back to you soon.</p>
    `,
    'IN_PROGRESS': `
      <p>We are actively working on your inquiry. 
      Our team is dedicated to providing you with the best possible solution.</p>
    `,
    'RESOLVED': `
      <p>Great news! Your inquiry has been successfully resolved. 
      We appreciate your patience and hope we met your expectations.</p>
    `,
    'CLOSED': `
      <p>This inquiry has been closed. If you have any further questions, 
      please don't hesitate to reach out to our support team.</p>
    `,
    'ESCALATED': `
      <p>Your inquiry requires additional attention and has been escalated 
      to our senior support team for immediate resolution.</p>
    `
  };

  return statusDescriptions[status] || `
    <p>Your inquiry status has been updated to ${status}. 
    Our team continues to work diligently on your request.</p>
  `;
};


export async function POST(
  req: NextRequest, 
  { params }: { params: { storeid: string } }
) {
  // Get origin and check if it's allowed
  const origin = req.headers.get('origin') || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.some(
    allowedOrigin => origin?.includes(allowedOrigin)
  );

  // If origin is not allowed, return an error
  if (!isAllowedOrigin) {
    return NextResponse.json({ 
      message: 'Origin not allowed',
      success: false 
    }, { 
      status: 403,
      headers: { 'Access-Control-Allow-Origin': 'null' }
    });
  }

  try {
    // Validate store exists
    const store = await prisma.store.findUnique({
      where: { id: params.storeid }
    });

    if (!store) {
      return NextResponse.json({ 
        message: 'Invalid store ID',
        success: false 
      }, { 
        status: 400,
        headers: corsHeaders(origin)
      });
    }

    // Parse the incoming request body
    const body = await req.json();

    // Create transporter for sending emails with detailed GoDaddy SMTP configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // Use SSL
      auth: {
        user: process.env.SMTP_USER || process.env.ADMIN_EMAIL,
        pass: process.env.SMTP_PASS || process.env.ADMIN_EMAIL_PASSWORD
      },
      // Add additional configuration for better reliability
      tls: {
        rejectUnauthorized: true
      }
    });

    // Prepare email content
    const mailOptions = {
      from: {
        name: 'Dryaura Customer Support',
        address: process.env.ADMIN_EMAIL || 'customercare@dryaura.in'
      },
      to: process.env.ADMIN_NOTIFICATION_EMAIL || 'support@dryaura.in',
      subject: `New Contact Form Submission - ${body.queryType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Store ID:</strong> ${params.storeid}</p>
          <p><strong>Query Type:</strong> ${body.queryType}</p>
          <p><strong>Timestamp:</strong> ${new Date(body.timestamp).toLocaleString()}</p>
          
          <h3>Personal Details</h3>
          <p><strong>Name:</strong> ${body.firstName} ${body.lastName}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          <p><strong>Phone:</strong> ${body.phoneNumber}</p>
          
          ${body.whatsappNumber ? `<p><strong>WhatsApp:</strong> ${body.whatsappNumber}</p>` : ''}
          
          ${body.orderNumber ? `<p><strong>Order Number:</strong> ${body.orderNumber}</p>` : ''}
          ${body.issueType ? `<p><strong>Issue Type:</strong> ${body.issueType}</p>` : ''}
          
          ${body.queryType === 'Bulk Order Inquiry' && body.bulkOrderDetails ? `
          <h3>Bulk Order Details</h3>
          <p><strong>Order Specifics:</strong></p>
          <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
          ${body.bulkOrderDetails}
          </pre>
          ` : ''}
          
          <h3>Message</h3>
          <p>${body.message}</p>
          
          <p><em>Source: ${body.source}</em></p>
        </div>
      `
    };

    const sendMailToCustomer = {
      from: {
        name: 'Dryaura Customer Support',
        address: process.env.ADMIN_EMAIL || 'customercare@dryaura.in'
      },
      to: body.email,
      subject: `🌟 Your Inquiry Received - ${body.queryType}`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dryaura - Inquiry Confirmation</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 5px;
            background-color: #F4F4F4;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 30px;
            border-top: 5px solid #4E2828;
          }
          .header {
            background-color: #4E2828;
            color: white;
            text-align: center;
            padding: 15px;
            border-radius: 5px 5px 0 0;
          }
          .section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #F9F9F9;
            border-radius: 5px;
          }
          .emoji-header {
            font-size: 24px;
            margin-right: 10px;
          }
          .footer {
            text-align: center;
            color: #777;
            font-size: 12px;
            margin-top: 20px;
          }
          .highlight {
            color: #4E2828;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Dryaura Customer Support</h1>
          </div>
          
          <div class="section">
            <h2>
              <span class="emoji-header">👋</span> 
              Hello ${body.firstName || 'Valued Customer'}!
            </h2>
            <p>Thank you for reaching out to Dryaura. We've received your inquiry and are excited to help you! 🚀</p>
          </div>
          
          <div class="section">
            <h3>📋 Inquiry Details</h3>
            <p><strong>Query Type:</strong> <span class="highlight">${body.queryType}</span></p>
            <p><strong>Received On:</strong> ${new Date(body.timestamp).toLocaleString()}</p>
            <p><strong>Store ID:</strong> ${params.storeid}</p>
          </div>
          
          <div class="section">
            <h3>👤 Your Information</h3>
            <p><strong>Name:</strong> ${body.firstName} ${body.lastName}</p>
            <p><strong>Email:</strong> ${body.email}</p>
            <p><strong>Phone:</strong> ${body.phoneNumber}</p>
            
            ${body.whatsappNumber ? `
            <p>
              <strong>WhatsApp:</strong> ${body.whatsappNumber} 
              <span class="emoji-header">📱</span>
            </p>` : ''}
            
            ${body.orderNumber ? `
            <p>
              <strong>Order Number:</strong> ${body.orderNumber} 
              <span class="emoji-header">🛍️</span>
            </p>` : ''}
            
            ${body.issueType ? `
            <p>
              <strong>Issue Type:</strong> ${body.issueType} 
              <span class="emoji-header">❗</span>
            </p>` : ''}
          </div>
          
          <div class="section">
            <h3>💬 Your Message</h3>
            <p><em>"${body.message}"</em></p>
          </div>
          
          <div class="section">
            <h3>🕒 What Happens Next?</h3>
            <p>Our support team is reviewing your inquiry. We aim to respond within 
            <strong class="highlight">24-48 hours</strong>. Keep an eye on your email! 📧</p>
          </div>
          
          <div class="footer">
            <p>
              Source: ${body.source} | 
              © ${new Date().getFullYear()} Dryaura. All rights reserved. 
              <br>Need immediate help? Call us at our support line.
            </p>
          </div>
        </div>
      </body>
      </html>
      `
    };

    try {
      // Send email with detailed error handling
      const info = await transporter.sendMail(mailOptions);
      await transporter.sendMail(sendMailToCustomer);
      console.log('Email sent successfully:', info.response);
      console.log('Message ID:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    } catch (emailError) {
      // Enhanced error logging
      const errorDetails = {
        timestamp: new Date().toISOString(),
        type: emailError instanceof Error ? emailError.name : 'Unknown error type',
        message: emailError instanceof Error ? emailError.message : 'No error message available',
        stack: emailError instanceof Error ? emailError.stack : 'No stack trace',
        context: {
          operation: 'Send Customer Notification Email',
          recipient: body.email,
          submissionId: submission.id
        }
      };

      // Log detailed error to console
      console.error('Email Sending Error:', JSON.stringify(errorDetails, null, 2));

      // Optional: Send error to error tracking service if configured
      if (process.env.ERROR_TRACKING_ENABLED === 'true') {
        // Placeholder for error tracking service integration
        // Example: Sentry.captureException(emailError);
      }

      // Update submission status to reflect email sending failure
      await prisma.contactSubmission.update({
        where: { id: submission.id },
        data: {
          status: 'EMAIL_FAILED',
          statusUpdateReason: `Email notification failed: ${errorDetails.message}`
        }
      });

      // Return a structured error response
      return NextResponse.json({
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: 'Failed to send customer notification email',
          details: {
            type: errorDetails.type,
            message: errorDetails.message
          }
        }
      }, { 
        status: 500,
        headers: corsHeaders(origin)
      });
    }

    // Save to database
    const submission = await prisma.contactSubmission.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phoneNumber: body.phoneNumber,
        message: body.message,
        queryType: body.queryType,
        orderNumber: body.orderNumber || null,
        issueType: body.issueType || null,
        whatsappNumber: body.whatsappNumber || null,
        bulkOrderDetails: body.queryType === 'Bulk Order Inquiry' 
          ? body.bulkOrderDetails || null 
          : null,
        source: body.source,
        storeId: params.storeid,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ 
      message: 'Your message has been received. We will get back to you soon!',
      success: true 
    }, { 
      status: 200,
      headers: corsHeaders(origin)
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json({ 
      message: 'Failed to submit the form. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
};

export async function GET(
  req: NextRequest, 
  { params }: { params: { storeid: string } }
) {
  // Get the request origin
  const origin = req.headers.get('origin') || req.headers.get('referer') || null;

  // Parse URL and extract userId
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  // Validate store ID and user ID
  if (!params.storeid) {
    return NextResponse.json(
      { error: 'Invalid store ID' }, 
      { 
        status: 400,
        headers: corsHeaders(origin)
      }
    );
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' }, 
      { 
        status: 400,
        headers: corsHeaders(origin)
      }
    );
  }

  try {
    // Fetch submissions for the specific user and store
    const submissions = await prisma.contactSubmission.findMany({
      where: { 
        customerId: userId,
        storeId: params.storeid
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        queryType: true,
        status: true,
        statusUpdateReason: true,
        createdAt: true
      }
    });

    // Return submissions with CORS headers
    return NextResponse.json(
      { submissions }, 
      { 
        status: 200,
        headers: corsHeaders(origin)
      }
    );

  } catch (error) {
    console.error('Error fetching contact submissions:', error);

    // Return error with CORS headers
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { 
        status: 500,
        headers: corsHeaders(origin)
      }
    );
  }
}