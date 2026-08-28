"use client";

import { useCallback, useState } from "react";
import { validateUploadFile } from "@/lib/documents/validate";

type UploadResult = {
  chatId: string;
};

async function uploadDocumentToChat(chatId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("chatId", chatId);

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Upload failed");
  }

  return data;
}

async function createChat() {
  const response = await fetch("/api/chats", { method: "POST" });
  const data = await response.json();

  if (!response.ok || !data.id) {
    throw new Error(data.error ?? "Failed to create chat");
  }

  return data.id as string;
}

export function useDocumentUpload() {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadToChat = useCallback(async (chatId: string, file: File) => {
    setUploadError(null);

    const validation = validateUploadFile(file);
    if (!validation.ok) {
      setUploadError(validation.error);
      throw new Error(validation.error);
    }

    setIsUploading(true);

    try {
      await uploadDocumentToChat(chatId, file);
      return { chatId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed";
      setUploadError(message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const createChatAndUpload = useCallback(async (file: File): Promise<UploadResult> => {
    setUploadError(null);

    const validation = validateUploadFile(file);
    if (!validation.ok) {
      setUploadError(validation.error);
      throw new Error(validation.error);
    }

    setIsUploading(true);

    try {
      const chatId = await createChat();
      await uploadDocumentToChat(chatId, file);
      return { chatId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed";
      setUploadError(message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const clearUploadError = useCallback(() => {
    setUploadError(null);
  }, []);

  return {
    uploadToChat,
    createChatAndUpload,
    uploadError,
    isUploading,
    clearUploadError,
  };
}
