import { useRef, useState } from "react";
import { FiCamera, FiX, FiCheckCircle } from "react-icons/fi";

export default function ProfileVerificationModal({ open, onClose, onVerified }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white"
        >
          <FiX size={24} />
        </button>
        <h2 className="text-xl font-bold text-primary mb-4">Verify Your Profile</h2>
        {step === 0 && (
          <>
            <p className="text-gray-500 mb-4">
              Upload a selfie to verify your identity. This helps keep the community safe!
            </p>
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <img
                  src={file ? URL.createObjectURL(file) : "/default-avatar.png"}
                  className="w-28 h-28 rounded-full object-cover border-4 border-primary shadow"
                  alt="Verification"
                />
                <button
                  type="button"
                  className="absolute bottom-2 right-2 bg-primary text-white rounded-full p-2 shadow hover:bg-primary-dark transition"
                  onClick={() => fileRef.current.click()}
                  title="Upload Photo"
                >
                  <FiCamera size={18} />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  onChange={e => setFile(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
            <button
              className="w-full px-6 py-3 rounded-full bg-primary text-white font-bold shadow hover:bg-primary-dark transition text-lg"
              disabled={!file}
              onClick={() => setStep(1)}
            >
              Submit for Review
            </button>
          </>
        )}
        {step === 1 && (
          <div className="flex flex-col items-center">
            <FiCheckCircle className="text-green-500 text-4xl mb-2" />
            <p className="text-green-600 font-semibold mb-2">Submitted!</p>
            <p className="text-gray-500 text-center mb-4">
              Our team will review your verification soon.
            </p>
            <button
              className="w-full px-6 py-3 rounded-full bg-primary text-white font-bold shadow hover:bg-primary-dark transition text-lg"
              onClick={() => {
                onVerified && onVerified();
                onClose();
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}