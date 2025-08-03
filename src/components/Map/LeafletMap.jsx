// src/components/Map/LeafletMap.jsx
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import BASEMAPS from './MapStyle'; // ← 반드시 import

function LeafletMap({
  center,
  zoom,
  basemap = "carto", // default 값
  mapRef,
  children,
  ...rest
}) {
  // 방어 코드: 존재하지 않는 basemap 선택 시 기본값 fall back
  const base = BASEMAPS[basemap] || BASEMAPS.carto;
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      ref={mapRef}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', margin: 0, padding: 0, zIndex: 0
      }}
      {...rest}
    >
      <TileLayer
        attribution={base.attribution}
        url={base.url}
      />
      {children}
    </MapContainer>
  );
}

export default LeafletMap;