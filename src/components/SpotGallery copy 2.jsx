import "../axiosConfig"; // ← axios 인터셉터를 글로벌로 적용!
import { useState, useEffect } from "react";
import axios from "axios";
import EditIcon from "./icons/EditIcon";
import DeleteIcon from "./icons/DeleteIcon";
import { useSwipeable } from "react-swipeable";

import CloseIcon from "./icons/CloseIcon";
import { createPortal } from "react-dom";



// SpotGallery({ spotId, user, spot }) 로 props 전달을 권장
function SpotGallery({ spotId, user, spot, setGalleryDetailOpen }) {
  // Responsive columns
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const apply = () => setColumns(window.innerWidth <= 520 ? 2 : 3);
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [detailIdx, setDetailIdx] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 상세보기 열렸을 때 배경 스크롤 잠금
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    if (detailIdx !== null) {
      root.style.overflow = "hidden";
    }
    return () => {
      root.style.overflow = prev;
    };
  }, [detailIdx]);

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

  // 항상 columns 열, 좌→우, 위→아래 (행렬)
  const rows = [];
  for (let i = 0; i < galleryList.length; i += columns) {
    rows.push(galleryList.slice(i, i + columns));
  }
  if (rows.length > 0 && rows[rows.length - 1].length < columns) {
    const lastRow = rows[rows.length - 1];
    while (lastRow.length < columns) lastRow.push(null);
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
    width: "100%",
    aspectRatio: "1/1",
    borderRadius: 16,
    overflow: "hidden",
    background: "#f8fafc",
    boxShadow: "0 2px 8px rgba(30,40,80,0.07)",
    marginBottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "box-shadow 0.18s cubic-bezier(.4,0,.2,1), background 0.18s cubic-bezier(.4,0,.2,1)",
  };
  const imgStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    userSelect: "none",
    borderRadius: 16,
    transition: "filter 0.2s cubic-bezier(.4,0,.2,1)",
  };

  // "+사진 추가" 버튼
  const AddPhotoTile = () => (
    <label
      style={{
        ...tileStyle,
        cursor: uploading ? "default" : "pointer",
        color: uploading ? "#bbb" : "#197ad6",
        fontWeight: 700,
        fontSize: 19,
        justifyContent: "center",
        opacity: uploading ? 0.65 : 1,
        border: "1.5px dashed #b6d2ef",
        background: "#f7fafd",
        boxShadow: "0 2px 8px rgba(30,40,80,0.05)",
        position: "relative",
        transition: "border-color 0.2s, background 0.18s cubic-bezier(.4,0,.2,1)",
        pointerEvents: uploading ? "none" : "auto",
      }}
      tabIndex={uploading ? -1 : 0}
    >
      {uploading ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}>
          <div className="spin" style={{
            width: 32, height: 32,
            border: "3px solid #e7ecf3",
            borderTop: "3px solid #197ad6",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
            marginBottom: 6,
          }} />
          <span style={{
            fontWeight: 600,
            fontSize: 16,
            color: "#197ad6",
            letterSpacing: "0.01em"
          }}>업로드중...</span>
        </div>
      ) : (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "#197ad6",
        }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ marginBottom: 4 }}>
            <rect x="2" y="2" width="30" height="30" rx="10" fill="#eaf6ff" />
            <path d="M17 10v14M24 17H10" stroke="#197ad6" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          <span style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#197ad6",
            letterSpacing: "0.01em"
          }}>사진 추가</span>
        </div>
      )}
      <input
        type="file"
        accept="image/*,.heic,.heif,.webp,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.svg"
        style={{ display: "none" }}
        disabled={uploading}
        onChange={handleFileChange}
      />
      {/* Spinner keyframes (inline for portability) */}
      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
        `}
      </style>
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
        switch (e.key) {
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

    return createPortal(
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100dvh",
          background: "rgba(20,28,48,0.90)",
          zIndex: 99999,
          overflow: "hidden",
          touchAction: "pan-y",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(3.5px)",
          WebkitBackdropFilter: "blur(3.5px)",
          transition: "background 0.22s cubic-bezier(.4,0,.2,1)",
        }}
        {...handlers}
      >
        <div style={{
          width: "100vw", height: "100dvh", overflow: "hidden", position: "relative",
        }}>
          {/* 개선된 슬라이드 컨테이너 */}
          <div
            style={{
              display: "flex",
              width: `${photos.length * 100}vw`,
              height: "100dvh",
              transform: `translateX(-${detailIdx * 100}vw)`,
              transition: isTransitioning ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
              willChange: "transform",
            }}
          >
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                style={{
                  width: "100vw",
                  height: "100dvh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  position: "relative",
                  opacity: Math.abs(i - detailIdx) <= 1 ? 1 : 0.82,
                  transform: `scale(${i === detailIdx ? 1 : 0.96})`,
                  transition: "opacity 0.4s cubic-bezier(.4,0,.2,1), transform 0.4s cubic-bezier(.4,0,.2,1)",
                }}
              >
                {photo?.imageUrl && /\.(heic|heif)$/i.test(photo.imageUrl) ? (
                  <div
                    style={{
                      width: 340,
                      height: 340,
                      color: "#7b8190",
                      background: "#f6f8fb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 18,
                      borderRadius: 20,
                      boxShadow: "0 8px 32px rgba(30,40,80,0.13)",
                      textAlign: "center",
                    }}
                  >
                    미리보기 불가<br />HEIC 파일
                  </div>
                ) : (
                  <img
                    src={photo?.imageUrl}
                    alt=""
                    style={{
                      width: "auto",
                      maxWidth: "95vw",
                      maxHeight: "86dvh",
                      objectFit: "contain",
                      background: "transparent",
                      userSelect: "none",
                      borderRadius: 16,
                      margin: "0 auto",
                      display: "block",
                      boxShadow: "0 10px 32px rgba(30,40,80,0.13)",
                      filter: i === detailIdx ? "none" : "brightness(0.86)",
                      transition: "filter 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s cubic-bezier(.4,0,.2,1)",
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
              bottom: 38,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 10,
              zIndex: 10001,
              alignItems: "center",
              pointerEvents: "auto",
            }}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => changeSlide(i)}
                  style={{
                    width: i === detailIdx ? 20 : 10,
                    height: 7,
                    borderRadius: 5,
                    border: "none",
                    background: i === detailIdx ? "#197ad6" : "rgba(230,240,255,0.65)",
                    boxShadow: i === detailIdx ? "0 1.5px 5px rgba(30,40,80,0.09)" : "none",
                    cursor: "pointer",
                    transition: "all 0.23s cubic-bezier(.4,0,.2,1)",
                    outline: "none",
                    opacity: i === detailIdx ? 1 : 0.9,
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
              position: "absolute",
              top: 22,
              right: 22,
              background: "rgba(255,255,255,0.11)",
              border: 0,
              borderRadius: "50%",
              padding: 0,
              width: 46,
              height: 46,
              cursor: "pointer",
              zIndex: 10002,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              boxShadow: "0 1.5px 10px rgba(30,40,80,0.10)",
              transition: "background 0.22s cubic-bezier(.4,0,.2,1)",
            }}
            aria-label="닫기"
          >
            <CloseIcon size={24} color="#197ad6" />
          </button>

          {/* 사진 정보 (선택사항) */}
          <div style={{
            position: "absolute",
            top: 22,
            left: 22,
            color: "#197ad6",
            fontSize: 15,
            fontWeight: 600,
            background: "rgba(255,255,255,0.88)",
            padding: "7px 14px",
            borderRadius: 50,
            boxShadow: "0 1.5px 8px rgba(30,40,80,0.09)",
            zIndex: 10001,
            letterSpacing: "0.01em",
            userSelect: "none",
          }}>
            {detailIdx + 1} / {photos.length}
          </div>
        </div>
      </div>,
      document.body
    );
  };
  // 사진 타일 (삭제, 상세)
  function PhotoTile({ photo, galleryIdx }) {
    if (!photo) return <div style={{ ...tileStyle, background: "transparent", boxShadow: "none" }} />;
    if (photo.addPhoto) return <AddPhotoTile />;
    if (photo.isPreview) return (
      <div style={{
        ...tileStyle,
        background: "#f8fafc",
        boxShadow: "0 2px 8px rgba(30,40,80,0.07)",
        border: "1.5px dashed #b6d2ef",
        opacity: 0.7,
      }}>
        <img
          src={photo.imageUrl}
          alt=""
          style={{
            ...imgStyle,
            opacity: 0.5,
            filter: "blur(1.6px)",
            pointerEvents: "none",
          }}
          draggable={false}
        />
      </div>
    );
    // HEIC/HEIF 미리보기 안내
    if (photo.imageUrl && /\.(heic|heif)$/i.test(photo.imageUrl)) {
      return (
        <div style={{
          ...tileStyle,
          background: "#f6f8fb",
          color: "#7b8190",
        }}>
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#7b8190",
            fontWeight: 700,
            fontSize: 15,
            background: "#f6f8fb",
            textAlign: "center",
            borderRadius: 16,
            letterSpacing: "0.01em",
          }}>
            미리보기 불가<br />HEIC 파일
          </div>
          {editMode && canDelete(photo) && (
            <button
              onClick={() => handleDelete(photo.id)}
              style={{
                position: "absolute",
                top: 7,
                right: 7,
                background: "#fff",
                borderRadius: "50%",
                border: "2px solid #e8443e",
                color: "#e8443e",
                width: 30,
                height: 30,
                fontWeight: 900,
                fontSize: 17,
                boxShadow: "0 2px 8px rgba(30,40,80,0.07)",
                cursor: "pointer",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.18s cubic-bezier(.4,0,.2,1), border-color 0.18s cubic-bezier(.4,0,.2,1)",
              }}
              aria-label="사진 삭제"
              onMouseEnter={e => { e.target.style.background = "#ffeaea"; }}
              onMouseLeave={e => { e.target.style.background = "#fff"; }}
            >×</button>
          )}
        </div>
      );
    }
    return (
      <div
        style={{
          ...tileStyle,
          background: "#f8fafc",
          boxShadow: "0 2px 8px rgba(30,40,80,0.07)",
          position: "relative",
          cursor: editMode ? "default" : "pointer",
          transition: "box-shadow 0.18s cubic-bezier(.4,0,.2,1), background 0.18s cubic-bezier(.4,0,.2,1)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(30,40,80,0.11)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(30,40,80,0.07)";
        }}
      >
        <img
          src={photo.imageUrl}
          alt=""
          style={{
            ...imgStyle,
            cursor: editMode ? "default" : "pointer",
            filter: editMode ? "brightness(0.98)" : "none",
          }}
          draggable={false}
          onClick={() => !editMode && openDetailModal(galleryIdx)}
          onError={e => {
            e.target.onerror = null;
            e.target.src = "/etc/img-not-found.png";
          }}
        />
        {editMode && canDelete(photo) && (
          <button
            onClick={() => handleDelete(photo.id)}
            style={{
              position: "absolute",
              top: 7,
              right: 7,
              background: "#fff",
              borderRadius: "50%",
              border: "2px solid #e8443e",
              color: "#e8443e",
              width: 30,
              height: 30,
              fontWeight: 900,
              fontSize: 17,
              boxShadow: "0 2px 8px rgba(30,40,80,0.07)",
              cursor: "pointer",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.18s cubic-bezier(.4,0,.2,1), border-color 0.18s cubic-bezier(.4,0,.2,1)",
            }}
            aria-label="사진 삭제"
            onMouseEnter={e => { e.target.style.background = "#ffeaea"; }}
            onMouseLeave={e => { e.target.style.background = "#fff"; }}
          >
            <DeleteIcon size={20} color="#e8443e" />
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
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 10,
      }}>
        <button
          onClick={() => setEditMode(edit => !edit)}
          style={{
            background: editMode ? "#ffeaea" : "#fff",
            border: "1.5px solid",
            borderColor: editMode ? "#e8443e" : "#197ad6",
            borderRadius: "50%",
            width: 44,
            height: 44,
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.18s cubic-bezier(.4,0,.2,1), border-color 0.18s cubic-bezier(.4,0,.2,1)",
            boxShadow: "0 2px 8px rgba(30,40,80,0.07)",
          }}
          aria-label={editMode ? "편집 완료" : "편집"}
          tabIndex={0}
        >
          <EditIcon size={23} color={editMode ? "#e8443e" : "#197ad6"} />
        </button>
      </div>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 15,
      }}>
        {rows.map((row, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            style={{
              display: "flex",
              gap: 15,
              marginBottom: 0,
              alignItems: "stretch",
            }}
          >
            {row.map((photo, colIdx) => (
              <PhotoTile
                key={`photo-${photo?.id || photo?.addPhoto || photo?.isPreview ? `${rowIdx}-${colIdx}` : `empty-${rowIdx}-${colIdx}`}`}
                photo={photo}
                galleryIdx={rowIdx * columns + colIdx}
              />
            ))}
          </div>
        ))}
      </div>
      {/* 상세 모달 */}
      <DetailModal />
    </div>
  );
}

export default SpotGallery;