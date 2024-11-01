// src/app/api/create_station/route.js
export async function POST(req) {
  try {
    // Parse the JSON body from the request
    const body = await req.json();

    // Log the station data to the console
    console.log("Received data:", body);

    // Return a success response
    return new Response(JSON.stringify({ message: "Station data received successfully!" }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ message: "Error processing data" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
