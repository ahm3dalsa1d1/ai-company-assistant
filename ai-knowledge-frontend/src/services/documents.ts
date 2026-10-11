import {
  API_URL,
  getAuthHeaders,
} from "./api";

import type {
  Document,
} from "../types";


export async function getDocuments():
  Promise<Document[]> {

  const response = await fetch(
    `${API_URL}/documents/`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load documents"
    );
  }

  return response.json();
}


export async function uploadDocument(
  file: File,
  accessLevel: number
): Promise<Document> {

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "required_access_level",
    accessLevel.toString()
  );


  const response = await fetch(
    `${API_URL}/documents/upload`,
    {
      method: "POST",

      headers:
        getAuthHeaders(),

      body: formData,
    }
  );


  if (!response.ok) {

    const errorData =
      await response.json()
        .catch(() => null);

    throw new Error(
      errorData?.detail
      || "Failed to upload document"
    );
  }


  return response.json();
}


export async function deleteDocument(
  documentId: number
): Promise<void> {

  const response = await fetch(
    `${API_URL}/documents/${documentId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );


  if (!response.ok) {

    const errorData =
      await response.json()
        .catch(() => null);

    throw new Error(
      errorData?.detail
      || "Failed to delete document"
    );
  }
}