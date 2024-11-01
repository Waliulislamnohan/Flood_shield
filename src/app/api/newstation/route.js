import fs from 'fs';
import path from 'path';

// Set the file path to the 'public' directory
const filePath = path.join(process.cwd(), 'public', 'stations.json');

// Function to read stations from the JSON file
const readStationsFromFile = () => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading file:", error);
    return [];
  }
};

// Function to write stations to the JSON file
const writeStationsToFile = (stations) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(stations, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing file:", error);
  }
};


export async function POST(req) {
  try {
    const body = await req.json();
    const stations = readStationsFromFile();
    stations.push(body); // Add new station data to the list
    writeStationsToFile(stations); // Save updated list to file

    console.log("New station added:", body);

    return new Response(JSON.stringify({ message: "Station added successfully!" }), {
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


export async function GET() {
  const stations = readStationsFromFile();

  return new Response(JSON.stringify(stations), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
