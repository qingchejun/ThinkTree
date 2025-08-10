'use client';

import React, { createContext, useContext, useState } from 'react';
import LoginModal from '../components/LoginModal';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [initialInvitationCode, setInitialInvitationCode] = useState('');

  const openLoginModal = (opts = {}) => {
    if (opts && typeof opts.initialInvitationCode === 'string') {
      setInitialInvitationCode(opts.initialInvitationCode);
    }
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <ModalContext.Provider value={{ openLoginModal, closeLoginModal }}>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} initialInvitationCode={initialInvitationCode} />
    </ModalContext.Provider>
  );
};