import { PrismaClient, Prisma } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

const headers = {
  "Content-Type": "application/json",
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_FRONTEND_URL 
  ? new URL(process.env.NEXT_PUBLIC_FRONTEND_URL).origin 
  : '*',
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, PATCH",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (basic validation)
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s()-]{10,15}$/;
  return phoneRegex.test(phone);
}

// Validate and sanitize customer data for update
function validateCustomerUpdateData(data: any) {
  const sanitizedData: any = {};

  // Email validation
  if (data.email) {
    if (!isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }
    sanitizedData.email = data.email;
  }

  // Phone validation
  if (data.phone) {
    if (!isValidPhone(data.phone)) {
      throw new Error("Invalid phone number format");
    }
    sanitizedData.phone = data.phone;
  }

  // Optional fields that can be updated
  const optionalFields = [
    'name', 
    'alternatePhone', 
    'streetAddress', 
    'city', 
    'state', 
    'postalCode', 
    'country', 
    'landmark', 
    'town'
  ];

  optionalFields.forEach(field => {
    if (data[field] !== undefined) {
      sanitizedData[field] = data[field] || null;
    }
  });

  return sanitizedData;
}

// Create or Update Customer
export async function POST(req: Request) {
  try {
    const requestBody = await req.json();
    console.log("Incoming POST Request:", requestBody);

    // Validate core required fields
    const requiredFields = ["userId", "name", "email"];
    for (const field of requiredFields) {
      if (!requestBody[field]) {
        return new Response(JSON.stringify({ 
          message: `Missing required field: ${field}`,
          missingField: field 
        }), { status: 400, headers });
      }
    }

    // Additional validations
    if (!isValidEmail(requestBody.email)) {
      return new Response(JSON.stringify({ 
        message: "Invalid email format",
        field: "email"
      }), { status: 400, headers });
    }

    // Optional phone validation if provided
    if (requestBody.phone && !isValidPhone(requestBody.phone)) {
      return new Response(JSON.stringify({ 
        message: "Invalid phone number format",
        field: "phone"
      }), { status: 400, headers });
    }

    // Prepare data for creation/update
    const customerData = {
      userId: requestBody.userId,
      name: requestBody.name,
      email: requestBody.email,
      phone: requestBody.phone || null,
      alternatePhone: requestBody.alternatePhone || null,
      streetAddress: requestBody.streetAddress || null,
      city: requestBody.city || null,
      state: requestBody.state || null,
      postalCode: requestBody.postalCode || null,
      country: requestBody.country || "India",
      landmark: requestBody.landmark || null,
      town: requestBody.town || null,
    };

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { userId: requestBody.userId },
    });

    let responseMessage;
    let statusCode;

    if (existingCustomer) {
      // Selectively update only provided fields
      const updatedCustomer = await prisma.customer.update({
        where: { userId: requestBody.userId },
        data: Object.fromEntries(
          Object.entries(customerData).filter(([_, v]) => v !== null)
        ),
      });

      console.log("Customer updated successfully:", updatedCustomer);
      responseMessage = { 
        message: "Customer updated successfully!", 
        customer: updatedCustomer 
      };
      statusCode = 200;
    } else {
      // Create new customer
      const newCustomer = await prisma.customer.create({ 
        data: customerData 
      });

      console.log("Customer created successfully:", newCustomer);
      responseMessage = { 
        message: "Customer created successfully!", 
        customer: newCustomer 
      };
      statusCode = 201;
    }

    return new Response(JSON.stringify(responseMessage), { 
      status: statusCode, 
      headers 
    });

  } catch (error) {
    console.error("Error in POST:", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === 'P2002') {
        return new Response(JSON.stringify({ 
          message: "A customer with this email or user ID already exists",
          errorCode: error.code 
        }), { status: 409, headers });
      }
    }

    // Generic error handling
    return new Response(JSON.stringify({ 
      message: "Failed to create/update customer", 
      error: error instanceof Error ? error.message : String(error)
    }), { status: 500, headers });
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH method for partial customer update
export async function PATCH(req: Request) {
  try {
    const requestBody = await req.json();
    console.log("Incoming PATCH Request:", requestBody);

    // Validate userId is present
    if (!requestBody.userId) {
      return new Response(JSON.stringify({ 
        message: "Missing userId",
        missingField: "userId"
      }), { status: 400, headers });
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { userId: requestBody.userId },
    });

    if (!existingCustomer) {
      return new Response(JSON.stringify({ 
        message: "Customer not found",
        userId: requestBody.userId
      }), { status: 404, headers });
    }

    // Validate and sanitize update data
    let sanitizedData;
    try {
      sanitizedData = validateCustomerUpdateData(requestBody);
    } catch (validationError) {
      return new Response(JSON.stringify({ 
        message: validationError instanceof Error ? validationError.message : "Validation failed",
        field: validationError instanceof Error ? validationError.message.includes('email') ? 'email' : 'phone' : null
      }), { status: 400, headers });
    }

    // Perform partial update
    const updatedCustomer = await prisma.customer.update({
      where: { userId: requestBody.userId },
      data: sanitizedData
    });

    console.log("Customer partially updated successfully:", updatedCustomer);
    
    return new Response(JSON.stringify({ 
      message: "Customer updated successfully!", 
      customer: updatedCustomer 
    }), { 
      status: 200, 
      headers 
    });

  } catch (error) {
    console.error("Error in PATCH:", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === 'P2002') {
        return new Response(JSON.stringify({ 
          message: "A customer with this email already exists",
          errorCode: error.code 
        }), { status: 409, headers });
      }
    }

    // Generic error handling
    return new Response(JSON.stringify({ 
      message: "Failed to update customer", 
      error: error instanceof Error ? error.message : String(error)
    }), { status: 500, headers });
  } finally {
    await prisma.$disconnect();
  }
}

// Define customer schema for validation
const customerSchema = z.object({
  id: z.number(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  landmark: z.string().optional(),
  town: z.string().optional()
});

// GET Customer Data (Fetch by userId)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    console.log(`Received GET request for userId: ${userId}`);

    if (!userId) {
      console.warn('GET request: Missing userId');
      return new Response(JSON.stringify({ 
        message: "Missing userId", 
        details: "No user ID provided in the request" 
      }), { status: 400, headers });
    }

    // Fetch customer with ALL possible fields
    const customer = await prisma.customer.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        alternatePhone: true,
        streetAddress: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        landmark: true,
        town: true
      }
    });

    if (!customer) {
      console.warn(`No customer found for userId: ${userId}`);
      
      return new Response(JSON.stringify({ 
        message: "Customer not found", 
        details: { searchedUserId: userId }
      }), { status: 404, headers });
    }

    // Enhance logging with full customer details
    console.log(`Customer found: ${JSON.stringify(customer, null, 2)}`);

    // Validate customer data against schema before returning
    try {
      // Use partial validation to allow optional fields
      const validatedCustomer = customerSchema.partial().parse(customer);
      
      return new Response(JSON.stringify(validatedCustomer), { 
        status: 200, 
        headers: {
          ...headers,
          'X-Validation-Status': 'Passed'
        }
      });
    } catch (validationError) {
      // Log detailed validation errors
      console.error('Customer Data Validation Failed:', {
        rawData: customer,
        validationErrors: validationError instanceof z.ZodError 
          ? validationError.errors 
          : 'Unknown validation error'
      });

      // Return partial data with validation warning
      return new Response(JSON.stringify({
        ...customer,
        _validationWarning: 'Some fields did not pass validation'
      }), { 
        status: 206, // Partial Content
        headers: {
          ...headers,
          'X-Validation-Status': 'Partial'
        }
      });
    }

  } catch (error) {
    // Comprehensive error logging
    console.error("Detailed Error in GET Customer:", {
      errorName: error instanceof Error ? error.name : 'Unknown Error',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });

    // Prisma-specific error handling
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return new Response(JSON.stringify({ 
        message: "Database query error", 
        errorCode: error.code,
        errorDetails: error.message
      }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ 
      message: "Failed to fetch customer data", 
      error: error instanceof Error ? error.message : String(error)
    }), { status: 500, headers });
  } finally {
    await prisma.$disconnect();
  }
}

// Handle OPTIONS request
export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}