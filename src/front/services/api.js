// =========================================================
// 1. BACKEND URL CONFIGURATION
// =========================================================

const DEFAULT_BACKEND_URL = "http://127.0.0.1:3001";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  DEFAULT_BACKEND_URL;

const cleanBackendUrl =
  backendUrl.replace(/\/$/, "");

const API_BASE_URL =
  cleanBackendUrl.endsWith("/api")
    ? cleanBackendUrl
    : `${cleanBackendUrl}/api`;


// =========================================================
// 2. SESSION MANAGEMENT
// =========================================================

let expirationTimer = null;


function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("employee");
  localStorage.removeItem("workshop");
}


export function logoutUser() {
  if (expirationTimer) {
    clearTimeout(expirationTimer);
    expirationTimer = null;
  }

  clearStoredSession();

  window.location.replace("/");
}


function getTokenExpiration(token) {
  try {
    const tokenParts = token.split(".");

    if (tokenParts.length !== 3) {
      return null;
    }

    const payload = tokenParts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decodedPayload = JSON.parse(
      atob(payload)
    );

    if (!decodedPayload.exp) {
      return null;
    }

    return decodedPayload.exp * 1000;
  } catch (error) {
    console.error(
      "Could not read token expiration:",
      error
    );

    return null;
  }
}


export function scheduleTokenExpiration() {
  if (expirationTimer) {
    clearTimeout(expirationTimer);
    expirationTimer = null;
  }

  const token =
    localStorage.getItem("token");

  if (!token) {
    return;
  }

  const expirationTime =
    getTokenExpiration(token);

  if (!expirationTime) {
    return;
  }

  const remainingTime =
    expirationTime - Date.now();

  if (remainingTime <= 0) {
    logoutUser();
    return;
  }

  expirationTimer = setTimeout(() => {
    logoutUser();
  }, remainingTime);
}


// If the application is refreshed while the user
// already has a token, recreate the expiration timer.

scheduleTokenExpiration();


// =========================================================
// 3. FUNCTION TO READ PUBLIC RESPONSES
// =========================================================

async function parseResponse(response) {
  const data =
    await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data: data,
  };
}


// =========================================================
// 4. WORKSHOP REGISTRATION
// =========================================================

export async function registerWorkshop(payload) {
  const response = await fetch(
    `${API_BASE_URL}/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return await parseResponse(response);
}


// =========================================================
// 5. USER LOGIN
// =========================================================

export async function loginUser(
  email,
  password
) {
  const response = await fetch(
    `${API_BASE_URL}/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    }
  );

  return await parseResponse(response);
}


// =========================================================
// 6. FORGOT PASSWORD
// =========================================================

export async function forgotPassword(email) {
  const response = await fetch(
    `${API_BASE_URL}/forgot-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
      }),
    }
  );

  return await parseResponse(response);
}


// =========================================================
// 7. RESET PASSWORD
// =========================================================

export async function resetPassword(
  token,
  password,
  passwordConfirm
) {
  const response = await fetch(
    `${API_BASE_URL}/reset-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
        password: password,
        password_confirm: passwordConfirm,
      }),
    }
  );

  return await parseResponse(response);
}


// =========================================================
// 8. REQUESTS TO PROTECTED ENDPOINTS
// =========================================================

export async function apiFetch(
  path,
  {
    method = "GET",
    body,
  } = {}
) {
  const token =
    localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method: method,
      headers: headers,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }
  );

  const data =
    await response.json().catch(() => ({}));

  // If the backend says the token is no longer valid,
  // automatically close the session.

  if (response.status === 401 && token) {
    logoutUser();

    throw new Error(
      "Your session has expired."
    );
  }

  if (!response.ok) {
    const errorMessage =
      data.error ||
      data.message ||
      data.msg ||
      `HTTP ${response.status}`;

    throw new Error(errorMessage);
  }

  return data;
}


// =========================================================
// 9. CUSTOMERS
// =========================================================

export async function getCustomers() {
  return await apiFetch("/customers");
}


export async function createCustomer(payload) {
  return await apiFetch(
    "/customers",
    {
      method: "POST",
      body: payload,
    }
  );
}


export async function updateCustomer(
  customerId,
  payload
) {
  return await apiFetch(
    `/customers/${customerId}`,
    {
      method: "PUT",
      body: payload,
    }
  );
}


export async function deactivateCustomer(
  customerId
) {
  return await apiFetch(
    `/customers/${customerId}`,
    {
      method: "DELETE",
    }
  );
}


// =========================================================
// 10. SERVICE STATUS HISTORY
// =========================================================

export async function getServiceStatusLogs(
  serviceId
) {
  return await apiFetch(
    `/services/${serviceId}/status-logs`
  );
}


// =========================================================
// 11. UPDATE A SERVICE COMMENT
// =========================================================

export async function updateServiceComment(
  serviceId,
  commentId,
  payload
) {
  return await apiFetch(
    `/services/${serviceId}/comments/${commentId}`,
    {
      method: "PATCH",
      body: payload,
    }
  );
}


// =========================================================
// 12. DELETE A SERVICE COMMENT
// =========================================================

export async function deleteServiceComment(
  serviceId,
  commentId
) {
  return await apiFetch(
    `/services/${serviceId}/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );
}


// =========================================================
// 13. CANCEL A SERVICE
// =========================================================

export async function cancelService(
  serviceId,
  reason = ""
) {
  return await apiFetch(
    `/services/${serviceId}/cancel`,
    {
      method: "PATCH",
      body: {
        reason: reason,
      },
    }
  );
}


// =========================================================
// 14. PERMANENTLY DELETE A SERVICE
// =========================================================

export async function permanentlyDeleteService(
  serviceId
) {
  return await apiFetch(
    `/services/${serviceId}`,
    {
      method: "DELETE",
      body: {
        confirm: true,
      },
    }
  );
}