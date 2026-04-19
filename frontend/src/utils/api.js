const API_BASE = ''  // same origin — FastAPI раздаёт и API и фронтенд

/**
 * Обёртка над fetch с автоматической подстановкой JWT-токена.
 * При 401 очищает токен и перенаправляет на /login.
 */
export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
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
