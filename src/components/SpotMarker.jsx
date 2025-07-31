import { Marker } from 'react-leaflet';
import L from 'leaflet';

function SpotMarker({ spot, zoom, onClick, isMovable, onMove }) {
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
      draggable={!!isMovable}
      eventHandlers={{
        click: (e) => {
          // 이동모드면 클릭으로 상세 열리지 않게!
          if (!isMovable && onClick) onClick(spot);
        },
        dragend: (e) => {
          if (isMovable && onMove) {
            const { lat, lng } = e.target.getLatLng();
            onMove({ lat, lng });
          }
        }
      }}
    />
  );
}

export default SpotMarker;