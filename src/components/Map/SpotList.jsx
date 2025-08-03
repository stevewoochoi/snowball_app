// src/components/Map/SpotList.jsx
import SpotMarker from './SpotMarker';

function SpotList({
  spots = [],
  zoom = 17,
  selectedSpot,
  moveSpot,
  onClickSpot,
  onDragEndSpot,
}) {
  return (
    <>
      {spots.map(spot => {
        const isMovable = moveSpot && moveSpot.id === spot.id;
        if (isMovable) return null; // 이동 중인 spot은 지도에 표시 X
        return (
          <SpotMarker
            key={spot.id}
            spot={spot}
            zoom={zoom}
            draggable={!!isMovable}
            onClick={isMovable ? undefined : () => onClickSpot(spot)}
            onDragend={e => {
              if (isMovable && onDragEndSpot) {
                const { lat, lng } = e.target.getLatLng();
                onDragEndSpot(spot, lat, lng);
              }
            }}
          />
        );
      })}
    </>
  );
}

export default SpotList;