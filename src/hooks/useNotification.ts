"use client";
import { useState } from 'react';

interface NotificationState {
  isOpen: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'danger',
    onConfirm: () => {}
  });

  const showSuccess = (title: string, message: string) => {
    setNotification({
      isOpen: true,
      type: 'success',
      title,
      message
    });
  };

  const showError = (title: string, message: string) => {
    setNotification({
      isOpen: true,
      type: 'error',
      title,
      message
    });
  };

  const showInfo = (title: string, message: string) => {
    setNotification({
      isOpen: true,
      type: 'info',
      title,
      message
    });
  };

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
    }
  ) => {
    setConfirm({
      isOpen: true,
      title,
      message,
      confirmText: options?.confirmText || 'Confirmar',
      cancelText: options?.cancelText || 'Cancelar',
      type: options?.type || 'danger',
      onConfirm
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const closeConfirm = () => {
    setConfirm(prev => ({ ...prev, isOpen: false }));
  };

  return {
    notification,
    confirm,
    showSuccess,
    showError,
    showInfo,
    showConfirm,
    closeNotification,
    closeConfirm
  };
}