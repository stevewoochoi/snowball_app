import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

function SpotMarker({ spot, zoom }) {
  const markerSize = Math.max(20, Math.min(80, Math.floor(6 * zoom - 44)));
  const categorySize = Math.round(markerSize * 0.85);
  const iconHtml = `
    <div style="position:relative;width:${markerSize}px;height:${markerSize}px;">
      <img src="${spot.building?.iconUrl || ''}" style="width:${markerSize}px;height:${markerSize}px;display:block;" />
      ${spot.category?.iconUrl ? `
        <img src="${spot.category.iconUrl}" 
          style="width:${categorySize}px;height:${categorySize}px;position:absolute;left:55%;transform:translateX(-50%);top:-${Math.round(categorySize * 0.5)}px;z-index:2;" />
      ` : ''}
    </div>
  `;

  return (
    <Marker
      key={spot.id}
      position={[spot.lat, spot.lng]}
      icon={new L.DivIcon({
        html: iconHtml,
        className: '',
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize],
        popupAnchor: [0, -markerSize]
      })}
    >
      <Popup>
        <b>{spot.name}</b><br />
        건물: {spot.building && spot.building.name}<br />
        카테고리: {spot.category && spot.category.name}
      </Popup>
    </Marker>
  );
}

export default SpotMarker;