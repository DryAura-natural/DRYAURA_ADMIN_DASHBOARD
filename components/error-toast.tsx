"use client";

import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

interface ErrorToastProps {
  message?: string;
}

export default function ErrorToast({ message }: ErrorToastProps) {
  useEffect(() => {
    if (message) {
      toast.error(message, {
        duration: 4000,
        position: "top-right",
      });
    }
  }, [message]);

  return <Toaster />;
}
