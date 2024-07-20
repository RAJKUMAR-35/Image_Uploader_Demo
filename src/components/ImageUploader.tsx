import { useState, useEffect } from "react";
import Avatar from "react-avatar";
import axios from "axios";
import "cropperjs/dist/cropper.css";
import Modal from "./Modal";
import cover from "../assets/cover.png";
import emoji from "../assets/emoji.svg";
import CropModal from "./CropModal";

interface ValidatedFile extends File {
  error?: string;
}

const ImageUploader = () => {
  const [avatarSize, setAvatarSize] = useState("96px");
  const [cropData, setCropData] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [uploadingIndex, setUploadingIndex] = useState<number>(-1);
  const [showUploadStatus, setShowUploadStatus] = useState<boolean>(false);
  const [allUploaded, setAllUploaded] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(
    "https://res.cloudinary.com/dy0f5bsqg/image/upload/v1720425471/alteroffice/Vector_keo7dc.png"
  );

  const updateAvatarSize = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth >= 320 && screenWidth <= 672) {
      setAvatarSize("96px");
    } else {
      setAvatarSize("160px");
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          const response = await axios.get(
            "http://localhost:5000/api/users/checkUserId"
          );

          if (response.data && response.data.userId) {
            localStorage.setItem("userId", response.data.userId);
            document.cookie = `userId=${response.data.userId}; max-age=900000; path=/;`;
          }
        } else {
          const userDetailsResponse = await axios.get(
            `http://localhost:5000/api/users/${userId}`
          );
          if (userDetailsResponse.data && userDetailsResponse.data.user) {
            setImageUrl(userDetailsResponse?.data?.user?.avatarUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
    window.addEventListener("resize", updateAvatarSize);
    return () => {
      window.removeEventListener("resize", updateAvatarSize);
    };
  }, []);

  const handleUpload = async (images: ValidatedFile[]) => {
    const userId = localStorage.getItem("userId");
    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const formData = new FormData();
        formData.append("image", image);
        const source = axios.CancelToken.source();
        setUploadingIndex(i);
        setUploadProgress(0);

        const incrementProgress = () => {
          let currentProgress = 2;
          const interval = setInterval(() => {
            currentProgress += 2;
            setUploadProgress(Math.min(currentProgress, 90));
          }, 200);

          return interval;
        };

        const progressInterval = incrementProgress();

        const response = await axios.post(
          `http://localhost:5000/api/users/${userId}/avatar`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            cancelToken: source.token,
          }
        );
        clearInterval(progressInterval);

        if (response.status === 200) {
          setUploadProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 100));
          setShowUploadStatus(true);
          await new Promise((resolve) => setTimeout(resolve, 350));
          setShowUploadStatus(false);
          setUploadingIndex(-1);
        }
      }
      setAllUploaded(true);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Request cancelled:", error.message);
      } else {
        // setError(
        //   "An error occurred during the upload. Please check your network connection and try again."
        // );
        setUploadProgress(0);
      }
      setAllUploaded(true);
    }
  };

  return (
    <div className="md:p-10 xs:px-7">
      <div className="max-w-[768px] rounded-md md:max-w-screen-[672px]">
        <div className="rounded-md shadow-md">
          <img
            src={cover}
            alt="Banner"
            className="rounded-t-md xs:h-32 h-44 w-full"
          />
          <div className="absolute transform -translate-y-1/2 md:ml-8 xs:ml-4 border-4 rounded-full bg-white">
            <Avatar
              src={imageUrl ? imageUrl : cropData}
              size={avatarSize}
              className="sm:h-24 sm:w-24"
              round={true}
            />
          </div>
          <div className="text-right mt-4 mr-4">
            <button
              className="xs:px-3.5 xs:py-2 md:py-3 hover:bg-gray-200 rounded-md md:px-5 border border-[#E5E5E5] md:text-base xs:text-sm font-medium text-[#171717]"
              onClick={() => setIsModalOpen(true)}
            >
              Update picture
            </button>
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            setCropData={setCropData}
            setError={setError}
            handleUpload={handleUpload}
            uploadProgress={uploadProgress}
            uploadingIndex={uploadingIndex}
            setSelectedImage={setSelectedImage}
            selectedImage={selectedImage}
            showUploadStatus={showUploadStatus}
            error={error}
            allUploaded={allUploaded}
            setIsCropModalOpen={setIsCropModalOpen}
          />
          {isCropModalOpen && (
            <CropModal
              isOpen={isCropModalOpen}
              onCropModalClose={() => setIsCropModalOpen(false)}
              image={selectedImage}
              setCropData={setCropData}
              setImageUrl={setImageUrl}
            />
          )}
          <div className="px-4 pb-[70px]">
            <h1 className="font-bold text-xl text-start py-6">Jack Smith</h1>
            <div className="flex items-start xs:flex-col md:flex-row justify-start text-xl font-normal text-neutral-900">
              <p className="text-xl font-normal">@kingjack</p>
              <p className="flex items-center xs:mt-3 md:mt-0 text-xl font-normal">
                <span className="mx-3 h-1.5 w-1 rounded-full bg-neutral-400 xs:hidden md:block"></span>
                Senior Product Designer
              </p>
              {/* <p className="flex items-center xs:mt-3 md:mt-0 text-xl font-normal">
                <span className="text-neutral-600">at</span>
                <img src={emoji} alt="emoji" className="mx-2" />
                Webflow{" "}
                <p className="text-neutral-600 flex items-center text-xl font-normal">
                  <span className="mx-3 h-1.5 w-1 rounded-full bg-neutral-400"></span>
                  He/Him
                </p>
              </p> */}
              <div className="flex items-center xs:mt-3 md:mt-0 text-xl font-normal">
                <span className="text-neutral-600">at</span>
                <img src={emoji} alt="emoji" className="mx-2" />
                Webflow
                <span className="text-neutral-600 flex items-center text-xl font-normal">
                  <span className="mx-3 h-1.5 w-1 rounded-full bg-neutral-400"></span>
                  He/Him
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
