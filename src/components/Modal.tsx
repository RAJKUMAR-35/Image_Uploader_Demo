import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import { useDropzone } from "react-dropzone";
import download from "../assets/download.svg";
import closeIcon from "../assets/closeIcon.svg";
import dustbinIcon from "../assets/dustBin.svg";
import CropIcon from "../assets/cropIcon.svg";
import tick from "../assets/tick.svg";
import unSupportedImg from "../assets/unSupportedImg.svg";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  setCropData: (data: string) => void;
  setError: (error: string | null) => void;
  handleUpload: (images: File[]) => void;
  uploadProgress: number;
  error: string | null;
  uploadingIndex: number;
  // setUploadingIndex:  (index: number | null) => void;
  // setShowUploadStatus: (status: boolean | null) => void;
  setIsCropModalOpen: (status: boolean) => void;
  setSelectedImage: (status: string | null) => void;
  selectedImage: string | null;
  showUploadStatus: boolean;
  allUploaded: boolean;
}

interface ValidatedFile extends File {
  error?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  setError,
  handleUpload,
  uploadProgress,
  error,
  uploadingIndex,
  setIsCropModalOpen,
  setSelectedImage,
  selectedImage,
  // setUploadingIndex,
  showUploadStatus,
  // setShowUploadStatus,
  allUploaded,
}) => {
  const [images, setImages] = useState<ValidatedFile[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);

  useEffect(() => {
    // Cleanup function to remove any selected image when modal closes
    return () => {
      setSelectedImage(null);
      setSelectedImageIndex(-1);
    };
  }, [isOpen]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length + images.length > 5) {
        setError("You've reached the image limit.");
        return;
      }

      // Validate dropped files
      const validatedFiles: ValidatedFile[] = acceptedFiles.map((file) => {
        const validatedFile: ValidatedFile = file;
        if (!file.type.startsWith("image/")) {
          validatedFile.error = `The file format of ${file.name} is not supported. Please upload an image in one of the following formats: JPG, PNG.`;
        }
        if (file.size > 5 * 1024 * 1024) {
          validatedFile.error =
            "This image is larger than 5MB. Please select a smaller image.";
        }
        return validatedFile;
      });

      setImages((prevImages) => {
        const newImages = [...prevImages, ...validatedFiles];
        const hasErrors = newImages.some((image) => image.error);
        handleUpload(newImages);
        if (!hasErrors && newImages.length > 0) {
          handleUpload(newImages);
        }
        return newImages;
      });
      setError(null); 
    },
    [images, setError]
  );

  const handleImageSelection = (image: File, index: number) => {
    setSelectedImage(URL.createObjectURL(image));
    setSelectedImageIndex(index);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  function formatFileSize(bytes: number) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "kb", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[#0A0A0A] bg-opacity-80 flex items-center justify-center z-50 xs:p-4">
      <div className="bg-white px-6 py-8 rounded-lg shadow-lg relative md:w-[576px] w-full max-h-screen overflow-x-hidden overflow-y-auto">
        <div className="flex justify-between items-center w-full">
          <p className="text-neutral-900 font-medium text-xl">
            Upload image(s)
          </p>
          <button
            className=" text-gray-500 hover:text-gray-700 text-3xl "
            onClick={onClose}
          >
            <img src={closeIcon} alt="Close" />
          </button>
        </div>
        <p className="text-neutral-600 font-normal text-base mt-1">
          You may upload up to 5 images
        </p>

        <div
          {...getRootProps()}
          className={`mt-8 dropzone ${
            !error ? "md:py-9 py-6" : "py-4"
          } border bg-neutral-50 border-neutral-200 rounded-md text-center cursor-pointer`}
        >
          {!error ? (
            <>
              <input {...getInputProps()} />
              <div className="flex  flex-col items-center justify-center bg-neutral-50">
                <img src={download} alt="Download" className="h-12 w-12" />
                <p className="text-neutral-900 font-medium text-lg xs:px-6 md:px-0 text-center">
                  Click or drag and drop to upload
                </p>
                <p className="text-neutral-600 font-normal text-sm mt-1">
                  PNG, or JPG (Max 5MB)
                </p>
              </div>
            </>
          ) : (
            <div>
              <p className="text-red-600 text-base font-semibold">{error}</p>
              <p className="text-neutral-600 text-xs font-normal">
                Remove one or more to upload more images.
              </p>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="image-preview mt-4 flex flex-col overflow-y-scroll max-h-52">
            {images.map((image, index) => (
              <div
                key={index}
                className="image-thumbnail relative mb-8 flex items-center"
                onClick={() => handleImageSelection(image, index)}
              >
                <img
                  src={
                    image?.error ? unSupportedImg : URL.createObjectURL(image)
                  }
                  alt="Thumbnail"
                  className="w-20 h-20 rounded-md object-cover cursor-pointer"
                />
                <div className="ml-4 w-full h-[84px] flex flex-col">
                  <div className="w-full flex items-start justify-between">
                    <p className="text-neutral-900 text-base font-semibold">
                      {image?.name?.length > 20
                        ? image?.name?.slice(0, 20) + "..."
                        : image?.name}
                    </p>
                    {image?.error ||
                    (index === uploadingIndex && showUploadStatus) ||
                    !allUploaded ? (
                      <img
                        src={closeIcon}
                        alt="Close"
                        onClick={() => {
                          setImages(images.filter((_, i) => i !== index));
                          setError(null);
                        }}
                      />
                    ) : (
                      <SelectUnSelect
                        isSelected={index === selectedImageIndex}
                      />
                    )}
                  </div>
                  <p className="mt-1 text-neutral-600 font-normal text-xs">
                    {formatFileSize(image.size)}
                  </p>
                  {index === uploadingIndex && !image.error ? (
                    showUploadStatus && !image.error ? (
                      <div className="flex items-center mt-5">
                        <img src={tick} className="h-5 w-5" />
                        <p className="text-xs font-medium text-green-700">
                          Upload Success
                        </p>
                      </div>
                    ) : (
                      <HandleUploadProgress progress={uploadProgress} />
                    )
                  ) : allUploaded && !image.error ? (
                    <div className="flex-grow mt-5 h-5 flex items-center text-medium text-sm text-neutral-600">
                      <p className="flex items-center">
                        <img
                          src={CropIcon}
                          className="mr-1 h-5 w-5"
                          alt="Crop"
                        />
                        Crop
                      </p>
                      <div className="h-1 w-1 bg-neutral-600 rounded-full mx-2"></div>
                      <p
                        className="flex items-center"
                        onClick={() => {
                          setImages(images.filter((_, i) => i !== index));
                          setError(null);
                        }}
                      >
                        <img
                          src={dustbinIcon}
                          className="mr-1 h-5 w-5"
                          alt="Delete"
                        />{" "}
                        Delete
                      </p>
                    </div>
                  ) : (
                    <p className="text-red-600 text-xs font-semibold mt-4">
                      {image.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between w-full mt-4 text-base font-medium">
          <button
            className="mr-4 py-2.5 rounded text-neutral-900 
          w-full shadow-lg border-[0.5px] border-neutral-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`mr-4 py-2.5 shadow-md  rounded  w-full ${
              selectedImage
                ? "bg-indigo-700 text-white"
                : "bg-neutral-100 text-neutral-400"
            }`}
            onClick={() => {
              onClose();
              if (selectedImage) {
                setIsCropModalOpen(true);
              }
            }}
          >
            Select Image
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") as HTMLElement
  );
};

export default Modal;

interface SelectUnSelectProps {
  isSelected: boolean;
}

interface uploadProgressProps {
  progress: number;
}

export const SelectUnSelect: React.FC<SelectUnSelectProps> = ({
  isSelected,
}) => {
  return (
    <>
      {isSelected ? (
        <div className="h-6 w-6 border-[1.5px] border-indigo-700 flex items-center justify-center rounded-full">
          <div className="h-4 w-4 bg-indigo-700 rounded-full"></div>
        </div>
      ) : (
        <div className="h-6 w-6 border-[1.5px] border-neutral-200 rounded-full hover:border-[1.5px] hover:border-indigo-700"></div>
      )}
    </>
  );
};

const HandleUploadProgress: React.FC<uploadProgressProps> = ({ progress }) => {
  return (
    <div className="flex items-center mt-6">
      <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden progress-bar">
        <div
          className="h-1.5 bg-indigo-700 absolute top-0 left-0 rounded-full progress-bar-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs font-medium text-nutral-600 ml-4">{progress}%</p>
    </div>
  );
};
