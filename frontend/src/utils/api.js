const API_BASE = ''  // same origin — FastAPI раздаёт и API и фронтенд

/**
 * Обёртка над fetch.
 * Токен передаётся автоматически через httpOnly cookie (credentials: 'include').
 * При 401 перенаправляет на /login.
 */
export async function apiRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',  // браузер отправляет cookie автоматически
  })

  if (response.status === 401) {
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Ошибка сервера: ${response.status}`)
  }

  return response
}

/**
 * Удобные методы.
 */
export async function apiGet(url) {
  const res = await apiRequest(url)
  return res.json()
}

export async function apiPost(url, body) {
  const res = await apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function apiPut(url, body) {
  const res = await apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function apiDelete(url) {
  const res = await apiRequest(url, { method: 'DELETE' })
  return res.json()
}
