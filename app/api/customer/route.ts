import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*", // Adjust this in production
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(req: Request) {
  try {
    const requestBody = await req.json();

    // Check if the body is null or empty
    if (!requestBody || Object.keys(requestBody).length === 0) {
      return new Response(
        JSON.stringify({ message: "Request body cannot be empty or malformed." }),
        { status: 400, headers }
      );
    }

    console.log("Request Body:", requestBody);

    const { userId, firstName, lastName, email, phone, streetAddress, city, state, postalCode, country } = requestBody;

    // Validate if required fields are provided
    if (!userId || !firstName || !lastName || !email || !phone || !streetAddress || !city || !state || !postalCode || !country) {
      console.error("Missing Fields:", requestBody); // Log missing fields
      return new Response(
        JSON.stringify({ message: "Missing required fields", received: requestBody }),
        { status: 400, headers }
      );
    }


    // Try saving customer data to the database
    const customer = await prisma.customer.create({
      data: {
        userId,
        firstName,
        lastName,
        email,
        phone,
        streetAddress,
        city,
        state,
        postalCode,
        country,
      },
    });

    console.log("Customer created successfully:", customer);

    return new Response(
      JSON.stringify({ message: "Customer data saved successfully!", customer }),
      { status: 200, headers }
    );
  } catch (error) {
    // Log the specific error message for better debugging
    console.error("Error while saving customer data:", error);

    return new Response(
      JSON.stringify({ message: "Failed to save customer data", error: error.message }),
      { status: 500, headers }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({ message: "Method Not Allowed" }),
    { status: 405, headers }
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
