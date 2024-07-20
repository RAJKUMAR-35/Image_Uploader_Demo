import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import Cropper,{ ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import closeIcon from "../assets/closeIcon.svg";
import axios from "axios";

interface CropModalProps {
  isOpen: boolean;
  onCropModalClose: () => void;
  image: string | null;
  setCropData: (data: string) => void;
  setImageUrl: (data: string) => void;
}

const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onCropModalClose,
  image,
  setCropData,
  setImageUrl,
}) => {
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  
  const handleCrop = () => {
    if (cropperRef.current) {
      const cropper = cropperRef.current?.cropper;
      if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas({
          width: 200,
          height: 200,
          maxWidth: 200,
          maxHeight: 200,
          imageSmoothingEnabled: true,
          imageSmoothingQuality: "high",
        });

        if (croppedCanvas) {
          createCircularImage(croppedCanvas)
            .then((maskedDataURL) => {
              setCroppedImage(maskedDataURL);
            })
            .catch((error) => {
              console.error("Failed to create circular image:", error);
            });
        }
      }
    }
  };

  const handleConfirmCrop = async () => {
    if (croppedImage) {
      setCropData(croppedImage);
      const base64Data = croppedImage.split(",")[1];

      // Convert base64 to a Blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });
      const userId = localStorage.getItem("userId");
      const formData = new FormData();
      formData.append("image", blob, "image.png");
      const response = await axios.post(
        `http://localhost:5000/api/users/${userId}/uploadAvatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        setImageUrl(response.data.success);
      }
      onCropModalClose();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[#0A0A0A] bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white px-6 py-8 rounded-lg shadow-lg relative w-full max-w-[400px]">
        <div className="flex justify-between items-center w-full">
          <p className="text-neutral-900 font-semibold text-lg">
            Crop your picture
          </p>
          <button
            className="text-gray-500 hover:text-gray-700 text-3xl"
            onClick={onCropModalClose}
          >
            <img src={closeIcon} alt="Close" />
          </button>
        </div>
        <div className="mt-4 crop-container">
          <Cropper
            ref={cropperRef}
            src={image || ""}
            initialAspectRatio={1}
            viewMode={1}
            guides={true}
            zoomable={true}
            crop={handleCrop}
            style={{ height: "400px", width: "100%" }}
            className="cropper"
          />
        </div>
        <div className="flex justify-between w-full mt-4 text-base font-medium">
          <button
            className="mr-4 py-2.5 rounded text-neutral-900 
          w-full shadow-lg border-[0.5px] border-neutral-200"
            onClick={onCropModalClose}
          >
            Cancel
          </button>
          <button
            className="py-2 w-full rounded-md bg-indigo-700 text-white hover:bg-indigo-600 focus:outline-none"
            onClick={handleConfirmCrop}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") as HTMLElement
  );
};

export default CropModal;

function createCircularImage(
  croppedCanvas: HTMLCanvasElement
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const size = croppedCanvas.width;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject("Failed to get canvas context");
      return;
    }
    canvas.width = size;
    canvas.height = size;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(croppedCanvas, 0, 0, size, size);
    resolve(canvas.toDataURL());
  });
}
