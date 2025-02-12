import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { getAllReports } from "@/utils/db/actions.ts"; // Import the function to fetch reports

const markerIcon = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const markerIconRetina = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const markerShadow = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

// Set default icon for Leaflet markers
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const MapComponent = () => {
  const [mapCenter, setMapCenter] = useState([25.4300, 81.7720]); // IIIT Allahabad coordinates
  const [zoomLevel, setZoomLevel] = useState(17);
  const [markers, setMarkers] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);

  // Fetch reports and update markers and heatmap points
  useEffect(() => {
    const fetchReports = async () => {
      const reports = await getAllReports(); // Fetch reports from the database
      if (reports && reports.length > 0) {
        const newMarkers = [];
        const newHeatmapPoints = [];

        reports.forEach((report) => {
          const { latitude, longitude, hazardLevel } = report;
          newMarkers.push([latitude, longitude]);
          newHeatmapPoints.push([latitude, longitude,  10]); // Default hazardLevel to 1 if undefined
        });

        setMarkers(newMarkers);
        setHeatmapPoints(newHeatmapPoints);
      }
    };

    fetchReports();
  }, []);

  // Dynamic heatmap layer with colors and zoom adjustments
  const HeatmapLayer = () => {
    const map = useMap();
    const heatLayerRef = useRef(null);

    const createOrUpdateHeatLayer = () => {
      const colorScale = {
        0.3: "yellow",   // Low intensity
        0.6: "orange",   // Medium intensity
        1.0: "red"       // High intensity
      };

      const intensityExtractor = (level) => {
        return level >= 7 ? 0.8 : level >= 4 ? 0.5 : 0.3; // Slightly lower intensities
      };

      const heatmapData = heatmapPoints.map((point) => [
        point[0],
        point[1],
        intensityExtractor(point[2]),
      ]);

      if (!heatLayerRef.current) {
        // Initialize heat layer if it doesn’t exist
        heatLayerRef.current = L.heatLayer(heatmapData, {
          radius: 30,     // Moderate radius for visibility
          blur: 15,       // Smooth blur effect
          maxZoom: 17,    // Ensure visibility across zooms
          gradient: colorScale,
        }).addTo(map);
      } else {
        // Update heatmap data without re-creating the layer
        heatLayerRef.current.setLatLngs(heatmapData);
      }
    };

    useEffect(() => {
      createOrUpdateHeatLayer();

      const updateRadiusAndBlurOnZoom = () => {
        const currentZoom = map.getZoom();
        if (heatLayerRef.current) {
          heatLayerRef.current.setOptions({
            radius: Math.max(25, 35 - currentZoom * 1.2), // Adjust radius on zoom
            blur: Math.max(10, 15 - currentZoom * 0.8),   // Slight blur for smoothing
          });
        }
        createOrUpdateHeatLayer(); // Refresh heatmap data on zoom
      };

      map.on("zoomend", updateRadiusAndBlurOnZoom);

      return () => {
        map.off("zoomend", updateRadiusAndBlurOnZoom);
        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        }
      };
    }, [map, heatmapPoints]);

    return null;
  };

  return (
    <div>
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        style={{ height:"500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={25}
        />

        {/* Render Markers */}
        {markers.map((position, index) => (
          <Marker key={index} position={position} />
        ))}

        {/* Heatmap Layer */}
        <HeatmapLayer />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
