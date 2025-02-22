// pages/api/subscribe.ts

import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

// Mock function to simulate saving the email to a database
const saveEmailToDatabase = async (email: string): Promise<boolean> => {
  // Here you would typically save the email to your database
  console.log(`Email saved: ${email}`);
  return true; // Simulate a successful save
};

const sendCongratulatoryEmail = async (email: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST as string, // Replace with your SMTP server
    port: Number(process.env.SMTP_PORT), // Replace with your SMTP port
    auth: {
      user: process.env.SMTP_USER as string, // Replace with your email
      pass: process.env.SMTP_PASS as string, // Replace with your email password
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER, // Replace with your email
    to: email,
    subject: 'Congratulations on Subscribing!',
    text: 'Thank you for subscribing to our newsletter! We are excited to have you on board.',
  };

  await transporter.sendMail(mailOptions);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email } = req.body;

    // Basic validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    try {
      // Save the email to the database (mocked)
      await saveEmailToDatabase(email);

      // Send a congratulatory email
      await sendCongratulatoryEmail(email);

      // Send a success response
      return res.status(200).json({ message: 'Subscription successful! Thank you for subscribing.' });
    } catch (error) {
      console.error('Error saving email or sending email:', error);
      return res.status(500).json({ message: 'There was an error. Please try again.' });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}