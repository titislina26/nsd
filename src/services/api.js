const BASE_URL = '/api'

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // If body is FormData, delete Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body instanceof FormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(errorData.error?.message || errorData.error || 'Something went wrong')
    error.status = response.status
    throw error
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  
  uploadKtp: (id, file) => {
    const formData = new FormData()
    formData.append('ktp', file)
    return request(`/technicians/${id}/ktp`, { method: 'POST', body: formData })
  },
  
  uploadReceipt: (id, file) => {
    const formData = new FormData()
    formData.append('receipt', file)
    return request(`/expenses/${id}/receipt`, { method: 'POST', body: formData })
  }
}
