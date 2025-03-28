// lib/email.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderStatusEmailProps {
  customerEmail: string;
  orderNumber: string;
  newStatus: string;
  storeName: string;
  additionalInfo?: string;
}

export async function sendOrderStatusEmail({
  customerEmail, 
  orderNumber, 
  newStatus,
  storeName,
  additionalInfo
}: OrderStatusEmailProps) {
  if (!customerEmail) {
    console.error('No email provided for order status update');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${storeName} <notifications@yourdomain.com>`,
      to: customerEmail,
      subject: `Order ${orderNumber} Status Update`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Status Update</h2>
          <p>Your order <strong>#${orderNumber}</strong> status has been updated to <strong>${newStatus}</strong>.</p>
           ${additionalInfo ? `
            <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; margin-top: 15px;">
              <p><strong>Additional Information:</strong> ${additionalInfo}</p>
            </div>
          ` : ''}
          <p>Thank you for shopping with ${storeName}!</p>
        </div>
      `
    });

    if (error) {
      console.error('Email sending error:', error);
      return null;
    }

    console.log('Order status email sent successfully');
    return data;
  } catch (error) {
    console.error('Unexpected error sending order status email:', error);
    return null;
  }
}