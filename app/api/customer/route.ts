import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*", // Adjust for production
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ✅ Create or Update Customer
export async function POST(req: Request) {
  try {
    const requestBody = await req.json();
    console.log("Incoming POST Request:", requestBody);

    // Validate required fields
    const requiredFields = ["userId", "name",  "email", "phone", "streetAddress", "city", "state", "postalCode", "country"];
    for (const field of requiredFields) {
      if (!requestBody[field]) {
        return new Response(JSON.stringify({ message: `Missing required field: ${field}` }), { status: 400, headers });
      }
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { userId: requestBody.userId },
    });

    let responseMessage;
    let statusCode;

    if (existingCustomer) {
      // Update existing customer (Only update provided fields)
      const updatedCustomer = await prisma.customer.update({
        where: { userId: requestBody.userId },
        data: requestBody, 
      });

      console.log("✅ Customer updated successfully:", updatedCustomer);
      responseMessage = { message: "Customer updated successfully!", customer: updatedCustomer };
      statusCode = 200;
    } else {
      // Create new customer
      const newCustomer = await prisma.customer.create({ data: requestBody });

      console.log("✅ Customer created successfully:", newCustomer);
      responseMessage = { message: "Customer created successfully!", customer: newCustomer };
      statusCode = 201;
    }

    return new Response(JSON.stringify(responseMessage), { status: statusCode, headers });

  } catch (error) {
    console.error("❌ Error in POST:", error);
    return new Response(JSON.stringify({ message: "Failed to create/update customer", error: error.message }), { status: 500, headers });
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ GET Customer Data (Fetch by userId)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ message: "Missing userId" }), { status: 400, headers });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return new Response(JSON.stringify({ message: "Customer not found" }), { status: 404, headers });
    }

    return new Response(JSON.stringify(customer), { status: 200, headers });

  } catch (error) {
    console.error("❌ Error in GET:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch customer data", error: error.message }), { status: 500, headers });
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ Handle OPTIONS request
export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
