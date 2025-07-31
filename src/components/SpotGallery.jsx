import "../axiosConfig"; // ← axios 인터셉터를 글로벌로 적용!
import { useState, useEffect } from "react";
import axios from "axios";
import EditIcon from "./icons/EditIcon";
import DeleteIcon from "./icons/DeleteIcon";
import { useSwipeable } from "react-swipeable";
import CloseIcon from "./icons/CloseIcon";



// SpotGallery({ spotId, user, spot }) 로 props 전달을 권장
function SpotGallery({ spotId, user, spot, setGalleryDetailOpen }) {
  const COLUMN_COUNT = 3;
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [detailIdx, setDetailIdx] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 최신순
  useEffect(() => {
    axios.get(`/api/spots/${spotId}/gallery`).then(res => {
      setPhotos((res.data || []).slice().reverse());
    });
  }, [spotId]);

  // 삭제 (논리 삭제)
  const handleDelete = async (photoId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await axios.patch(`/api/spots/${spotId}/gallery/${photoId}/delete`);
    setPhotos(photos => photos.filter(p => p.id !== photoId));
  };

  // 파일 선택 및 업로드
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (!selected) { setPreview(null); return; }
    if (!/\.(heic|heif)$/i.test(selected.name)) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
    uploadPhotoToS3(selected);
  };

  const uploadPhotoToS3 = async (selectedFile) => {
  setUploading(true);
  try {
    const ext = selectedFile.name.split('.').pop();
    const safeFileName = `spot_gallery/spot_${spotId}_${Date.now()}.${ext}`;
    // Presign URL 생성 (여기서는 토큰 필요 없음)
    let presignResponse;
    try {
      presignResponse = await axios.post("/api/s3/presign", {
        fileName: safeFileName,
        contentType: selectedFile.type
      });
    } catch (err) {
      alert("사진 업로드 실패: Presign URL 생성 오류");
      setUploading(false); setFile(null); setPreview(null); return;
    }
    const { url } = presignResponse.data;
    if (!url) throw new Error("Presign 응답에 URL 없음");

    // S3 업로드 (여기에도 토큰 필요 없음)
    try {
      await axios.put(url, selectedFile, {
        headers: { "Content-Type": selectedFile.type }
      });
    } catch (err) {
      alert("S3 업로드 실패: " + (err.response?.data?.message || err.message));
      setUploading(false); setFile(null); setPreview(null); return;
    }

    // DB 등록 (여기에 반드시 토큰 필요!)
    const publicUrl = url.split('?')[0];
    try {
      const token = localStorage.getItem("snowball_token");
      if (!token) {
        
        alert("로그인이 필요합니다! (간편체험 포함)");
        setUploading(false); setFile(null); setPreview(null); return;
      }
      await axios.post(
        `/api/spots/${spotId}/gallery/presigned`,
        { imageUrl: publicUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      alert("DB 등록 실패: " + (err.response?.data?.message || err.message));
    }
    setFile(null); setPreview(null);
    axios.get(`/api/spots/${spotId}/gallery`).then(res => {
      setPhotos((res.data || []).slice().reverse());
    });
  } catch (err) {
    alert("업로드 실패: " + (err.response?.data?.message || err.message));
    setFile(null); setPreview(null);
  }
  setUploading(false);
};
  // **그리드 데이터 구성**
  let galleryList = [];
  galleryList.push({ id: "addPhoto", addPhoto: true });
  if (preview) galleryList.push({ id: "preview", imageUrl: preview, isPreview: true });
  galleryList = galleryList.concat(photos);

  // 항상 3열, 좌→우, 위→아래 (행렬)
  const rows = [];
  for (let i = 0; i < galleryList.length; i += COLUMN_COUNT) {
    rows.push(galleryList.slice(i, i + COLUMN_COUNT));
  }
  if (rows.length > 0 && rows[rows.length - 1].length < COLUMN_COUNT) {
    const lastRow = rows[rows.length - 1];
    while (lastRow.length < COLUMN_COUNT) lastRow.push(null);
  }

  // 상세 모달: 누른 사진이 바로 보이게
  const openDetailModal = (galleryIdx) => {
    const gPhoto = galleryList[galleryIdx];
    if (!gPhoto || !gPhoto.id || gPhoto.addPhoto || gPhoto.isPreview) return;
    const pIdx = photos.findIndex(p => p.id === gPhoto.id);
    if (pIdx >= 0) {
      setDetailIdx(pIdx);
      if (setGalleryDetailOpen) setGalleryDetailOpen(true);
    }
  };

  // --- 타일 스타일 ---
  const tileStyle = {
    width: "100%", aspectRatio: "1/1", borderRadius: 14, overflow: "hidden",
    background: "#f5f6fa", boxShadow: "0 1px 10px #dde3ee", marginBottom: 12,
    display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
  };
  const imgStyle = {
    width: "100%", height: "100%", objectFit: "cover", userSelect: "none"
  };

  // "+사진 추가" 버튼
  const AddPhotoTile = () => (
    <label style={{
      ...tileStyle, cursor: uploading ? "default" : "pointer", color: "#bbb",
      fontWeight: 700, fontSize: 21, justifyContent: "center", opacity: uploading ? 0.6 : 1
    }}>
      {uploading ? "업로드중..." : "+ 사진 추가"}
      <input
        type="file"
        accept="image/*,.heic,.heif,.webp,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.svg"
        style={{ display: "none" }}
        disabled={uploading}
        onChange={handleFileChange}
      />
    </label>
  );

  const DetailModal = () => {
  if (detailIdx == null) return null;

  const handleClose = () => {
    setDetailIdx(null);
    setGalleryDetailOpen && setGalleryDetailOpen(false);
  };

  // 부드러운 애니메이션과 함께 슬라이드 변경
  const changeSlide = (newIdx) => {
    if (isTransitioning) return; // 애니메이션 중에는 무시
    if (newIdx < 0 || newIdx >= photos.length) return;
    
    setIsTransitioning(true);
    setDetailIdx(newIdx);
    
    // 애니메이션 완료 후 transitioning 상태 해제
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400); // transition 시간과 맞춤
  };

  // 스와이프 핸들러 - 개선된 버전
  const handlers = useSwipeable({
    onSwipedLeft: () => changeSlide(detailIdx + 1),
    onSwipedRight: () => changeSlide(detailIdx - 1),
    trackMouse: true,
    delta: 30, // 민감도 조정
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (detailIdx === null) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          changeSlide(detailIdx - 1);
          break;
        case 'ArrowRight':
          changeSlide(detailIdx + 1);
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [detailIdx]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(15,20,30,0.92)",
        zIndex: 9999,
        overflow: "hidden",
        touchAction: "pan-y",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)", // 배경 블러 효과
      }}
      {...handlers}
    >
      <div style={{
        width: "100vw", height: "100vh", overflow: "hidden", position: "relative",
      }}>
        {/* 개선된 슬라이드 컨테이너 */}
        <div
          style={{
            display: "flex",
            width: `${photos.length * 100}vw`,
            height: "100vh",
            transform: `translateX(-${detailIdx * 100}vw)`,
            transition: isTransitioning ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
            willChange: "transform", // 성능 최적화
          }}
        >
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                position: "relative",
                opacity: Math.abs(i - detailIdx) <= 1 ? 1 : 0.7, // 인접한 이미지만 완전 불투명
                transform: `scale(${i === detailIdx ? 1 : 0.95})`, // 현재 이미지만 원래 크기
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}
            >
              {photo?.imageUrl && /\.(heic|heif)$/i.test(photo.imageUrl) ? (
                <div
                  style={{
                    width: 340, height: 340, color: "#888", background: "#f7f7f7",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 18, borderRadius: 18,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                >
                  미리보기 불가<br />HEIC 파일
                </div>
              ) : (
                <img
                  src={photo?.imageUrl}
                  alt=""
                  style={{
                    width: "auto", maxWidth: "95vw",
                    maxHeight: "84vh",
                    objectFit: "contain",
                    background: "transparent",
                    userSelect: "none",
                    borderRadius: 12,
                    margin: "0 auto",
                    display: "block",
                    boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
                    filter: i === detailIdx ? "none" : "brightness(0.8)", // 현재 이미지만 밝게
                    transition: "filter 0.4s ease, box-shadow 0.4s ease",
                  }}
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>

        {/* 네비게이션 인디케이터 */}
        {photos.length > 1 && (
          <div style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
            zIndex: 10001,
          }}>
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => changeSlide(i)}
                style={{
                  width: i === detailIdx ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: "none",
                  background: i === detailIdx ? "#fff" : "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                aria-label={`사진 ${i + 1}로 이동`}
              />
            ))}
          </div>
        )}

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(255,255,255,0.1)", border: 0,
            borderRadius: "50%", padding: 0, width: 48, height: 48,
            cursor: "pointer", zIndex: 10002, 
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(4px)",
            transition: "background 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255,255,255,0.1)";
          }}
          aria-label="닫기"
        >
          <CloseIcon size={24} color="#fff" />
        </button>

        {/* 사진 정보 (선택사항) */}
        <div style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#fff",
          fontSize: 14,
          background: "rgba(0,0,0,0.3)",
          padding: "8px 12px",
          borderRadius: 20,
          backdropFilter: "blur(4px)",
          zIndex: 10001,
        }}>
          {detailIdx + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
};
  // 사진 타일 (삭제, 상세)
  function PhotoTile({ photo, galleryIdx }) {
    if (!photo) return <div style={{ ...tileStyle, background: "transparent", boxShadow: "none" }} />;
    if (photo.addPhoto) return <AddPhotoTile />;
    if (photo.isPreview) return (
      <div style={tileStyle}>
        <img
          src={photo.imageUrl}
          alt=""
          style={{
            ...imgStyle, opacity: 0.6, filter: "blur(1.5px)"
          }}
          draggable={false}
        />
      </div>
    );
    // HEIC/HEIF 미리보기 안내
    if (photo.imageUrl && /\.(heic|heif)$/i.test(photo.imageUrl)) {
      return (
        <div style={tileStyle}>
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#aaa", fontWeight: 700, fontSize: 16, background: "#f7f7f7", textAlign: "center"
          }}>
            미리보기 불가<br />HEIC 파일
          </div>
          {editMode && canDelete(photo) && (
            <button
              onClick={() => handleDelete(photo.id)}
              style={{
                position: "absolute", top: 7, right: 7, background: "#fff", borderRadius: "50%",
                border: "2px solid #f44", color: "#f44", width: 30, height: 30, fontWeight: 900, fontSize: 17,
                boxShadow: "0 1px 5px #ddd", cursor: "pointer", zIndex: 2
              }}
            >×</button>
          )}
        </div>
      );
    }
    return (
      <div style={tileStyle}>
        <img
          src={photo.imageUrl}
          alt=""
          style={{ ...imgStyle }}
          draggable={false}
          onClick={() => openDetailModal(galleryIdx)}
          onError={e => {
            e.target.onerror = null;
            e.target.src = "/etc/img-not-found.png";
          }}
        />
        {editMode && canDelete(photo) && (
          <button
            onClick={() => handleDelete(photo.id)}
            style={{
              position: "absolute", top: 0, right: 0, background: "transparent",
              border: "2px", borderRadius: "0%", padding: 0, cursor: "pointer", zIndex: 2
            }}
            aria-label="삭제"
          >
            <DeleteIcon size={40} color="#e8443e" />
          </button>
        )}
      </div>
    );
  }

  // 삭제 권한 체크: 업로더 or 스팟 오너
  function canDelete(photo) {
    if (!user) return false;
    if (photo.uploader && user.id === photo.uploader.id) return true;
    if (spot && spot.ownerId && user.id === spot.ownerId) return true;
    return false;
  }

  // 고유 key 보장
  return (
    <div>
      {/* 편집 토글 */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
  <button
    onClick={() => setEditMode(edit => !edit)} // 콜백 형태로 안전하게
    style={{
      background: editMode ? "#ffeaea" : "#fff",
      border: "1.5px solid",
      borderColor: editMode ? "#e8443e" : "#1a9ad6",
      borderRadius: "50%",
      width: 46, height: 46, padding: 0,
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background .15s"
    }}
    aria-label={editMode ? "편집 완료" : "편집"}
  >
    <EditIcon size={26} color={editMode ? "#e8443e" : "#197ad6"} />
  </button>
</div>
      {rows.map((row, rowIdx) => (
        <div key={`row-${rowIdx}`} style={{ display: "flex", gap: 12, marginBottom: 0 }}>
          {row.map((photo, colIdx) => (
            <PhotoTile
              key={`photo-${photo?.id || photo?.addPhoto || photo?.isPreview ? `${rowIdx}-${colIdx}` : `empty-${rowIdx}-${colIdx}`}`}
              photo={photo}
              galleryIdx={rowIdx * COLUMN_COUNT + colIdx}
            />
          ))}
        </div>
      ))}
      {/* 상세 모달 */}
      <DetailModal />
    </div>
  );
}

export default SpotGallery;