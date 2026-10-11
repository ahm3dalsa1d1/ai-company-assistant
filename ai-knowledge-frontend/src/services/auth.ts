import { API_URL, getAuthHeaders } from "./api";
import type { LoginResponse, User } from "../types";


export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {

  const formData = new URLSearchParams();

  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      "Incorrect username or password"
    );
  }

  return response.json();
}


export async function getCurrentUser(): Promise<User> {

  const response = await fetch(
    `${API_URL}/users/me`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load current user"
    );
  }

  return response.json();
}


export function logout() {
  sessionStorage.removeItem(
    "access_token"
  );
}