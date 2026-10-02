const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const TOKEN_KEY =
  "carekeyAuthToken";

const USER_KEY =
  "carekeyUser";


export function getToken() {
  return localStorage.getItem(
    TOKEN_KEY
  );
}


export function getStoredUser() {
  try {
    const stored =
      localStorage.getItem(
        USER_KEY
      );

    return stored
      ? JSON.parse(stored)
      : null;

  } catch {
    return null;
  }
}


export function setAuthSession(data) {

  if (!data?.token) {
    throw new Error(
      "Authentication token was not received."
    );
  }


  localStorage.setItem(
    TOKEN_KEY,
    data.token
  );


  if (data.user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(data.user)
    );
  }
}


export function clearAuthSession() {

  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );

  localStorage.removeItem(
    "carekeyDoctorSession"
  );

  localStorage.removeItem(
    "carekeyDoctorId"
  );

  localStorage.removeItem(
    "carekeyAdminSession"
  );

  localStorage.removeItem(
    "carekeyAdminId"
  );
}


async function apiRequest(
  path,
  options = {}
) {

  const headers = {
    ...(options.body
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),

    ...(options.headers || {}),
  };


  const token =
    getToken();


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers,
      }
    );


  let data = null;


  try {
    data =
      await response.json();

  } catch {
    data = null;
  }


  if (!response.ok) {

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      clearAuthSession();
    }


    let message =
      data?.message ||
      data?.error ||
      data?.detail ||
      `Request failed with status ${response.status}`;


    if (
      response.status === 429
    ) {
      message =
        "Too many login attempts. Please wait a moment and try again.";
    }


    const error =
      new Error(message);


    error.status =
      response.status;


    throw error;
  }


  return data;
}


export async function login(
  userId,
  password,
  role
) {

  const data =
    await apiRequest(
      "/auth/login",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            userId,
            password,
            role,
          }),
      }
    );


  if (
    !data?.token ||
    !data?.user
  ) {
    throw new Error(
      "Invalid authentication response from the server."
    );
  }


  setAuthSession(data);


  return data;
}


export async function getCurrentUser() {

  return apiRequest(
    "/auth/me"
  );
}


export async function getPatients() {

  const data =
    await apiRequest(
      "/patients"
    );


  return Array.isArray(
    data?.patients
  )
    ? data.patients
    : [];
}


export async function registerPatient(
  patientData
) {

  return apiRequest(
    "/patients",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          patientData
        ),
    }
  );
}


export async function emergencyMatch(
  image
) {

  return apiRequest(
    "/emergency/match",
    {
      method:
        "POST",

      body:
        JSON.stringify({
          image,
        }),
    }
  );
}


export async function getAdminAuditLogs() {

  const data =
    await apiRequest(
      "/audit"
    );


  return Array.isArray(
    data?.logs
  )
    ? data.logs
    : [];
}


export async function getDoctorAuditLogs() {

  const data =
    await apiRequest(
      "/audit/doctor"
    );


  return Array.isArray(
    data?.logs
  )
    ? data.logs
    : [];
}


export function logout() {
  clearAuthSession();
}


export {
  API_BASE_URL,
};