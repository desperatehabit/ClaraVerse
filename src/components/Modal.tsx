import React from 'react';

interface ModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ showModal, setShowModal, children }) => {
  if (!showModal) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;