"use client";
import React, { useState, useEffect } from "react";
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

// **NEW:** Import required libraries for GeoTIFF handling
import georaster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

// **NEW:** Import axios for fetching binary data
import axios from "axios";

import styles from "./maps.module.css"; // Ensure this path is correct

const { BaseLayer, Overlay } = LayersControl;

// Component to change the map view dynamically
export function ChangeView({ coords }) {
  const map = useMap();
  map.setView(coords, 7);
  return null;
}

// Custom icon for station markers
const customIcon = new L.Icon({
  iconUrl: "/gps.png", // Ensure you have this icon in the public folder
  iconSize: [30, 30], // Size of the marker icon
  iconAnchor: [17, 55], // Anchor point for the marker
  popupAnchor: [1, -45], // Popup position relative to the marker
});

export default function MapCoordinates() {
  const [stations, setStations] = useState([]);
  const [geoData, setGeoData] = useState({
    lat: 23.685,
    lng: 90.3563,
  });
  const [borders, setBorders] = useState(null);
  const [rivers, setRivers] = useState(null);
  const [floodData, setFloodData] = useState(null);
  const [showFlood, setShowFlood] = useState(false); // State to control flood layer visibility
  const [geoRasterLayer, setGeoRasterLayer] = useState(null); // **NEW**

  const center = [geoData.lat, geoData.lng];

  // Fetch the station data from the API
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch(
          "https://ffwc-api.bdservers.site/data_load/stations/"
        );
        const data = await response.json();
        setStations(data); // Store station data in state
      } catch (error) {
        console.error("Error fetching station data:", error);
      }
    };
    fetchStations();
  }, []);

  // Fetch the borders GeoJSON data
  useEffect(() => {
    const fetchBorders = async () => {
      try {
        const response = await fetch(
          "https://ffwc.rimes.int/assets/geojson/BD_Bndry_without_island.json"
        );
        const data = await response.json();
        setBorders(data);
      } catch (error) {
        console.error("Error fetching borders GeoJSON data:", error);
      }
    };
    fetchBorders();
  }, []);

  // Fetch the rivers GeoJSON data
  useEffect(() => {
    const fetchRivers = async () => {
      try {
        const response = await fetch(
          "https://ffwc.rimes.int/assets/geojson/rivers-level-2.json"
        );
        const data = await response.json();
        setRivers(data);
      } catch (error) {
        console.error("Error fetching rivers GeoJSON data:", error);
      }
    };
    fetchRivers();
  }, []);

  // Fetch the flood-prone areas GeoJSON data
  useEffect(() => {
    const fetchFloodData = async () => {
      try {
        const response = await fetch(
          "https://ffwc.rimes.int/assets/geojson/bd_adm2.json"
        );
        const data = await response.json();
        setFloodData(data);
      } catch (error) {
        console.error("Error fetching flood-prone areas GeoJSON data:", error);
      }
    };
    fetchFloodData();
  }, []);

  // **NEW:** Fetch and process the GeoTIFF data
  useEffect(() => {
    const fetchGeoTIFF = async () => {
      try {
        const response = await axios.get(
          "https://ffwc.rimes.int/assets/geotiff/inundation/inundation_2019_4326.tif",
          {
            responseType: "arraybuffer", // Important for binary data
          }
        );

        const tiff = await georaster(response.data);
        const layer = new GeoRasterLayer({
          georaster: tiff,
          opacity: 0.7,
          resolution: 256, // Adjust for performance vs. quality
          pixelValuesToColorFn: (values) => {
            if (values[0] === 1) {
              return "rgba(0, 0, 255, 0.5)"; // Blue color with transparency
            } else {
              return null; // No color for other values
            }
          },
        });

        setGeoRasterLayer(layer);
      } catch (error) {
        console.error("Error fetching GeoTIFF data:", error);
      }
    };

    fetchGeoTIFF();
  }, []);

  // Styling for borders
  const borderStyle = {
    color: "#FF0000", // Red color for borders
    weight: 2,
    opacity: 1,
    fillOpacity: 0.1,
  };

  // Styling for rivers
  const riverStyle = {
    color: "#0000FF", // Blue color for rivers
    weight: 1.5,
    opacity: 0.7,
  };

  // Styling for flood-prone areas
  const floodStyle = {
    color: "#FFA500", // Orange color for flood areas
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.4,
  };

  // Function to handle events on each flood feature
  const onEachFloodFeature = (feature, layer) => {
    // Attach a popup to each feature
    if (feature.properties && feature.properties.ADM2_EN) {
      layer.bindPopup(
        `<div>
          <strong>District:</strong> ${feature.properties.ADM2_EN}<br/>
          <strong>Division:</strong> ${feature.properties.ADM1_EN}
        </div>`
      );
    }

    // Optional hover effects
    layer.on({
      mouseover: (e) => {
        e.target.setStyle({
          weight: 3,
          color: "#FFFF00", // Highlight color
          fillOpacity: 0.7,
        });
      },
      mouseout: (e) => {
        e.target.setStyle({
          weight: 2,
          color: "#FFA500",
          fillOpacity: 0.4,
        });
      },
    });
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      {/* Button to toggle flood-prone areas */}
      <button
        className={styles.toggleButton}
        onClick={() => setShowFlood(!showFlood)}
      >
        {showFlood ? "Hide Flood Areas" : "Show Flood Areas"}
      </button>

      <MapContainer
        center={center}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Google Earth Engine">
            <TileLayer
              url="https://earthengine.googleapis.com/map/projects/ee-ramadhan/assets/PL_KLHK_Raster_v1/KLHK_PL_2021_raster_v1/{z}/{x}/{y}"
              attribution="&copy; Google Earth Engine"
            />
          </BaseLayer>
          <BaseLayer name="Satellite - Google">
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              subdomains={["mt0", "mt1", "mt2", "mt3"]}
              attribution="&copy; Google"
            />
          </BaseLayer>
          <BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>

          {/* **NEW:** Overlay for the GeoTIFF layer */}
          {geoRasterLayer && (
            <Overlay checked name="Inundation Layer">
              {/* Use the GeoTIFF layer as an overlay */}
              <GeoTIFFLayer layer={geoRasterLayer} />
            </Overlay>
          )}

          {/* Render borders if data is available */}
          {borders && (
            <Overlay checked name="Borders">
              <GeoJSON data={borders} style={borderStyle} />
            </Overlay>
          )}

          {/* Render rivers if data is available */}
          {rivers && (
            <Overlay checked name="Rivers">
              <GeoJSON data={rivers} style={riverStyle} />
            </Overlay>
          )}

          {/* Render flood-prone areas if showFlood is true */}
          {showFlood && floodData && (
            <Overlay checked name="Flood-Prone Areas">
              <GeoJSON
                data={floodData}
                style={floodStyle}
                onEachFeature={onEachFloodFeature}
              />
            </Overlay>
          )}
        </LayersControl>

        {/* Loop through the stations and create a Marker for each */}
        {stations.map((station) => (
          <Marker
            key={station.id}
            position={[parseFloat(station.lat), parseFloat(station.long)]}
            icon={customIcon}
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
                  <strong>Danger Level:</strong> {station.dangerlevel}
                </p>
                <p>
                  <strong>Highest Water Level:</strong>{" "}
                  {station.riverhighestwaterlevel}
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
        ))}

        {/* Change the view to the center coordinates */}
        <ChangeView coords={center} />
      </MapContainer>
    </div>
  );
}

// **NEW:** Component to render the GeoTIFF layer
function GeoTIFFLayer({ layer }) {
  const map = useMap();

  useEffect(() => {
    if (layer) {
      layer.addTo(map);
    }

    return () => {
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [layer, map]);

  return null;
}
