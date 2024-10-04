// pages/forecast-map.js

"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Marker,
  Popup,
  useMap,
  GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import L from "leaflet";

// Import Chart.js components
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import styles from "../components/maps.module.css"; // Adjust the path as needed

const { BaseLayer, Overlay } = LayersControl;

// Register Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

// Component to change the map view dynamically
export function ChangeView({ coords }) {
  const map = useMap();
  map.setView(coords, 12); // Zoom level set to 12
  return null;
}

export default function MapWithForecast() {
  const [stations, setStations] = useState([]);
  const [borders, setBorders] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  const [geoData, setGeoData] = useState({
    lat: 23.685,
    lng: 90.3563,
  });
  const center = [geoData.lat, geoData.lng];

  // Utility function to check if cached data is valid
  const isCacheValid = (timestamp) => {
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Fetch the data from the APIs with caching
  useEffect(() => {
    const fetchStations = async () => {
      const cacheKey = "stationsData";
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (isCacheValid(parsedData.timestamp)) {
          setStations(parsedData.data);
          return; // Use cached data if valid
        }
      }

      try {
        const response = await fetch(
          "https://ffwc-api.bdservers.site/data_load/stations/",
          { mode: "cors" } // Handle CORS
        );
        const data = await response.json();
        setStations(data); // Store station data in state

        // Cache the data
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (error) {
        console.error("Error fetching station data:", error);

        // Use cached data if available
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setStations(parsedData.data);
        }
      }
    };

    const fetchBorders = async () => {
      const cacheKey = "bordersData";
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (isCacheValid(parsedData.timestamp)) {
          setBorders(parsedData.data);
          return;
        }
      }

      try {
        const response = await fetch(
          "https://ffwc.rimes.int/assets/geojson/BD_Bndry_without_island.json",
          { mode: "cors" }
        );
        const data = await response.json();
        setBorders(data);

        // Cache the data
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (error) {
        console.error("Error fetching borders GeoJSON data:", error);
        if (cachedData) {
          setBorders(JSON.parse(cachedData).data);
        }
      }
    };

    fetchStations();
    fetchBorders();
  }, []);

  // Function to fetch forecast data for a station
  const fetchForecastData = async (stationId) => {
    const cacheKey = `forecastData_${stationId}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      if (isCacheValid(parsedData.timestamp)) {
        setForecastData(parsedData.data[stationId]);
        return; // Use cached data if valid
      }
    }

    try {
      const response = await fetch(
        "https://ffwc-api.bdservers.site/data_load/seven-days-forecast-waterlevel-24-hours/",
        { mode: "cors" } // Handle CORS
      );
      const data = await response.json();

      // Store forecast data for the selected station
      setForecastData(data[stationId]);

      // Cache the data
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (error) {
      console.error("Error fetching forecast data:", error);

      // Use cached data if available
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setForecastData(parsedData.data[stationId]);
      }
    }
  };

  // Styling for borders
  const borderStyle = {
    color: "#FF0000", // Red color for borders
    weight: 2,
    opacity: 1,
    fillOpacity: 0.1,
  };

  // Function to handle station marker click
  const handleMarkerClick = (station) => {
    setSelectedStation(station);
    fetchForecastData(station.id);
    setGeoData({ lat: parseFloat(station.lat), lng: parseFloat(station.long) });
  };

  // Prepare data for Chart.js
  const chartData = useMemo(() => {
    if (!forecastData) return null;

    const labels = Object.keys(forecastData);
    const values = Object.values(forecastData).map((value) =>
      parseFloat(value)
    );

    return {
      labels,
      datasets: [
        {
          label: "Forecasted Water Level (m)",
          data: values,
          fill: false,
          backgroundColor: "blue",
          borderColor: "blue",
        },
      ],
    };
  }, [forecastData]);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Satellite - Google">
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              subdomains={["mt0", "mt1", "mt2", "mt3"]}
              attribution="&copy; Google"
            />
          </BaseLayer>
          <BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>

          {/* Render borders if data is available */}
          {borders && (
            <Overlay checked name="Borders">
              <GeoJSON data={borders} style={borderStyle} />
            </Overlay>
          )}
        </LayersControl>

        {/* Markers for stations */}
        {stations.map((station) => {
          const customIcon = new L.Icon({
            iconUrl: "/gps.png", // Use your marker icon
            iconSize: [30, 30], // Size of the marker icon
            iconAnchor: [17, 55], // Anchor point for the marker
            popupAnchor: [1, -45], // Popup position relative to the marker
          });

          return (
            <Marker
              key={station.id}
              position={[parseFloat(station.lat), parseFloat(station.long)]}
              icon={customIcon}
              eventHandlers={{
                click: () => handleMarkerClick(station),
              }}
            >
              <Popup>
                <div>
                  <p>
                    <strong>Station Name:</strong> {station.name}
                  </p>
                  <p>
                    <strong>River:</strong> {station.river}
                  </p>
                  <p>
                    <strong>Basin:</strong> {station.basin}
                  </p>
                  <p>
                    <strong>Division:</strong> {station.division}
                  </p>
                  <p>
                    <strong>District:</strong> {station.district}
                  </p>
                  <p>
                    <strong>Upazilla:</strong> {station.upazilla}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Change view when a station is selected */}
        {selectedStation && (
          <ChangeView
            coords={[
              parseFloat(selectedStation.lat),
              parseFloat(selectedStation.long),
            ]}
          />
        )}
      </MapContainer>

      {/* Display Chart.js Line Chart when forecast data is available */}
      {forecastData && chartData && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            width: "400px",
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
          }}
        >
          <h3>{selectedStation.name} - 5-Day Forecast</h3>
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
}

// Component to handle GeoTIFF Layer integration into Leaflet Map (if needed)
// ...
