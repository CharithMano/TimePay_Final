import React from 'react';
import ReactModal from 'react-modal';
import { X } from 'lucide-react';
import clsx from 'clsx';

ReactModal.setAppElement('#root');

const Modal = ({
  isOpen,
  onRequestClose,
  title,
  children,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className={clsx(
        'bg-white rounded-xl shadow-strong p-0 m-4 max-h-[90vh] overflow-auto',
        sizeClasses[size],
        className
      )}
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onRequestClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </ReactModal>
  );
};

export default Modal;