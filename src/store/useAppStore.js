import { create } from 'zustand'
import { api } from '@/services/api'

const useAppStore = create((set, get) => ({
  // ─── Data Slices ───
  users: [],
  technicians: [],
  tasks: [],
  carfExpenses: [],
  dashboardSummary: null,
  isLoading: false,
  currentUser: (() => {
    try {
      const val = localStorage.getItem('currentUser')
      return val && val !== 'undefined' ? JSON.parse(val) : null
    } catch (e) {
      return null
    }
  })(),
  readNotifications: (() => {
    try {
      const val = localStorage.getItem('readNotifications')
      return val && val !== 'undefined' ? JSON.parse(val) : []
    } catch (e) {
      return []
    }
  })(),

  // Toast notifications
  toasts: [],
  addToast: (toast) => {
    const id = Date.now()
    set(state => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 4000)
  },

  // ─── Authentication Actions ───
  loginUser: async (email, password) => {
    set({ isLoading: true })
    try {
      const user = await api.post('/users/login', { email, password })
      set({ currentUser: user, isLoading: false })
      localStorage.setItem('currentUser', JSON.stringify(user))
      get().addToast({ title: 'Login Berhasil', message: `Selamat datang kembali, ${user.name}!`, variant: 'success' })
      return user
    } catch (error) {
      set({ isLoading: false })
      get().addToast({ title: 'Login Gagal', message: error.message || 'Email tidak terdaftar', variant: 'danger' })
      throw error
    }
  },

  logoutUser: () => {
    set({ currentUser: null })
    localStorage.removeItem('currentUser')
    get().addToast({ title: 'Logout Berhasil', message: 'Anda telah keluar dari sistem.', variant: 'success' })
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    set({ isLoading: true })
    try {
      const res = await api.post(`/users/${userId}/password`, { currentPassword, newPassword })
      const updatedUser = { ...get().currentUser, password: newPassword }
      set({ currentUser: updatedUser, isLoading: false })
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      get().addToast({ title: 'Sukses', message: 'Password berhasil diubah!', variant: 'success' })
      return res
    } catch (error) {
      set({ isLoading: false })
      get().addToast({ title: 'Gagal mengubah password', message: error.message, variant: 'danger' })
      throw error
    }
  },

  // ─── Global Fetch ───
  fetchAll: async () => {
    set({ isLoading: true })
    try {
      const [users, technicians, tasks, carfExpenses, dashboardSummary] = await Promise.all([
        api.get('/users'),
        api.get('/technicians'),
        api.get('/tasks'),
        api.get('/expenses'),
        api.get('/dashboard/summary')
      ])
      set({ users, technicians, tasks, carfExpenses, dashboardSummary, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      get().addToast({ title: 'Gagal memuat data', message: error.message, variant: 'danger' })
    }
  },

  fetchDashboardSummary: async () => {
    try {
      const summary = await api.get('/dashboard/summary')
      set({ dashboardSummary: summary })
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error)
    }
  },

  // ─── User Actions ───
  addUser: async (user) => {
    try {
      const newUser = await api.post('/users', user)
      set(state => ({ users: [newUser, ...state.users] }))
      await get().fetchDashboardSummary()
      return newUser
    } catch (error) {
      get().addToast({ title: 'Gagal menambah user', message: error.message, variant: 'danger' })
      throw error
    }
  },
  updateUser: async (id, data) => {
    try {
      const updated = await api.put(`/users/${id}`, data)
      set(state => ({ users: state.users.map(u => u.id === id ? updated : u) }))
      await get().fetchDashboardSummary()
      return updated
    } catch (error) {
      get().addToast({ title: 'Gagal mengupdate user', message: error.message, variant: 'danger' })
      throw error
    }
  },
  deleteUser: async (id) => {
    try {
      await api.delete(`/users/${id}`)
      set(state => ({ users: state.users.filter(u => u.id !== id) }))
      await get().fetchDashboardSummary()
    } catch (error) {
      get().addToast({ title: 'Gagal menghapus user', message: error.message, variant: 'danger' })
      throw error
    }
  },

  // ─── Technician Actions ───
  addTechnician: async (tech) => {
    try {
      const newTech = await api.post('/technicians', tech)
      set(state => ({ technicians: [...state.technicians, newTech] }))
      return newTech
    } catch (error) {
      get().addToast({ title: 'Gagal menambah teknisi', message: error.message, variant: 'danger' })
      throw error
    }
  },
  updateTechnician: async (id, data) => {
    try {
      const updated = await api.put(`/technicians/${id}`, data)
      set(state => ({ technicians: state.technicians.map(t => t.id === id ? updated : t) }))
      return updated
    } catch (error) {
      get().addToast({ title: 'Gagal mengupdate teknisi', message: error.message, variant: 'danger' })
      throw error
    }
  },
  deleteTechnician: async (id) => {
    try {
      await api.delete(`/technicians/${id}`)
      set(state => ({ technicians: state.technicians.filter(t => t.id !== id) }))
    } catch (error) {
      get().addToast({ title: 'Gagal menghapus teknisi', message: error.message, variant: 'danger' })
      throw error
    }
  },
  updateVerificationStatus: async (id, status, notes) => {
    try {
      const updated = await api.patch(`/technicians/${id}/verify`, { status, notes })
      set(state => ({ technicians: state.technicians.map(t => t.id === id ? updated : t) }))
      return updated
    } catch (error) {
      get().addToast({ title: 'Gagal verifikasi teknisi', message: error.message, variant: 'danger' })
      throw error
    }
  },
  uploadKtp: async (id, file) => {
    try {
      const res = await api.uploadKtp(id, file)
      set(state => ({
        technicians: state.technicians.map(t => t.id === id ? { ...t, ktp_image_url: res.ktp_image_url } : t)
      }))
      get().addToast({ title: 'KTP berhasil diupload', variant: 'success' })
      return res
    } catch (error) {
      get().addToast({ title: 'Gagal upload KTP', message: error.message, variant: 'danger' })
      throw error
    }
  },

  // ─── Task Actions ───
  addTask: async (task) => {
    try {
      const newTask = await api.post('/tasks', task)
      set(state => ({ tasks: [newTask, ...state.tasks] }))
      return newTask
    } catch (error) {
      get().addToast({ title: 'Gagal menambah penugasan', message: error.message, variant: 'danger' })
      throw error
    }
  },
  updateTask: async (id, data) => {
    try {
      const updated = await api.put(`/tasks/${id}`, data)
      set(state => ({ tasks: state.tasks.map(t => t.id === id ? updated : t) }))
      return updated
    } catch (error) {
      get().addToast({ title: 'Gagal mengupdate penugasan', description: error.message, type: 'danger' })
      throw error
    }
  },
  deleteTask: async (id) => {
    try {
      await api.delete(`/tasks/${id}`)
      set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }))
    } catch (error) {
      get().addToast({ title: 'Gagal menghapus penugasan', description: error.message, type: 'danger' })
      throw error
    }
  },

  // ─── Expense Actions ───
  addExpense: async (expense) => {
    try {
      const newExpense = await api.post('/expenses', expense)
      set(state => ({ carfExpenses: [newExpense, ...state.carfExpenses] }))
      await get().fetchDashboardSummary()
      return newExpense
    } catch (error) {
      get().addToast({ title: 'Gagal menambah pengeluaran', message: error.message, variant: 'danger' })
      throw error
    }
  },
  updateExpense: async (id, data) => {
    try {
      const updated = await api.put(`/expenses/${id}`, data)
      set(state => ({ carfExpenses: state.carfExpenses.map(e => e.id === id ? updated : e) }))
      await get().fetchDashboardSummary()
      return updated
    } catch (error) {
      get().addToast({ title: 'Gagal mengupdate pengeluaran', message: error.message, variant: 'danger' })
      throw error
    }
  },
  deleteExpense: async (id) => {
    try {
      await api.delete(`/expenses/${id}`)
      set(state => ({ carfExpenses: state.carfExpenses.filter(e => e.id !== id) }))
      await get().fetchDashboardSummary()
    } catch (error) {
      get().addToast({ title: 'Gagal menghapus pengeluaran', message: error.message, variant: 'danger' })
      throw error
    }
  },
  deleteExpensesBulk: async (ids) => {
    try {
      await api.post('/expenses/delete-bulk', { ids })
      set(state => ({ carfExpenses: state.carfExpenses.filter(e => !ids.includes(e.id)) }))
      await get().fetchDashboardSummary()
    } catch (error) {
      get().addToast({ title: 'Gagal menghapus pengeluaran', message: error.message, variant: 'danger' })
      throw error
    }
  },
  bulkInsertExpenses: async (expenses) => {
    try {
      const inserted = await api.post('/expenses/bulk', expenses)
      set(state => ({ carfExpenses: [...inserted, ...state.carfExpenses] }))
      await get().fetchDashboardSummary()
      return inserted
    } catch (error) {
      get().addToast({ title: 'Gagal mengimpor pengeluaran', message: error.message, variant: 'danger' })
      throw error
    }
  },
  updateExpenseStatus: async (id, statusDoc, statusDisbursement) => {
    try {
      const updated = await api.patch(`/expenses/${id}/status`, {
        status_document: statusDoc,
        status_disbursement: statusDisbursement
      })
      set(state => ({ carfExpenses: state.carfExpenses.map(e => e.id === id ? updated : e) }))
      await get().fetchDashboardSummary()
      return updated
    } catch (error) {
      get().addToast({ title: 'Gagal mengupdate status', message: error.message, variant: 'danger' })
      throw error
    }
  },
  uploadReceipt: async (id, file) => {
    try {
      const res = await api.uploadReceipt(id, file)
      set(state => ({
        carfExpenses: state.carfExpenses.map(e => e.id === id ? { ...e, transfer_receipt_url: res.transfer_receipt_url } : e)
      }))
      await get().fetchDashboardSummary()
      get().addToast({ title: 'Bukti transfer berhasil diupload', variant: 'success' })
      return res
    } catch (error) {
      get().addToast({ title: 'Gagal upload bukti transfer', message: error.message, variant: 'danger' })
      throw error
    }
  },

  // ─── Computed Getters ───
  getTotalExpenseAmount: () => {
    return get().dashboardSummary?.totalExpenseAmount || 0
  },

  getPendingCount: () => {
    return get().dashboardSummary?.pendingCount || 0
  },

  getPaidPercentage: () => {
    return get().dashboardSummary?.paidPercentage || 0
  },

  getDoneCount: () => {
    return get().dashboardSummary?.doneCount || 0
  },

  getTotalCount: () => {
    return get().dashboardSummary?.totalCount || 0
  },

  getTotalDisbursed: () => {
    return get().dashboardSummary?.totalDisbursed || 0
  },

  getExpensesByArea: () => {
    return get().dashboardSummary?.expensesByArea || []
  },

  getTopRequestors: (limit = 5) => {
    return get().dashboardSummary?.topRequestors || []
  },

  // ─── Lookup Helpers ───
  getUserById: (id) => get().users.find(u => u.id === id),
  getTechnicianById: (id) => get().technicians.find(t => t.id === id),
  getTaskById: (id) => get().tasks.find(t => t.id === id),
  getExpenseById: (id) => get().carfExpenses.find(e => e.id === id),

  findTechnicianByName: (name) => {
    if (!name) return null
    const normalized = name.toLowerCase().trim()
    return get().technicians.find(t => t.name.toLowerCase().trim() === normalized)
  },

  // ─── Notification Actions & Getters ───
  markNotificationAsRead: (id) => {
    const read = [...get().readNotifications, id]
    set({ readNotifications: read })
    localStorage.setItem('readNotifications', JSON.stringify(read))
  },

  markAllNotificationsAsRead: (ids) => {
    const read = Array.from(new Set([...get().readNotifications, ...ids]))
    set({ readNotifications: read })
    localStorage.setItem('readNotifications', JSON.stringify(read))
  },

  getNotifications: () => {
    const { currentUser, carfExpenses, technicians, readNotifications } = get()
    if (!currentUser) return []

    const list = []

    if (currentUser.role === 'ADMIN_FINANCE') {
      // 1. Pending CARF approvals
      carfExpenses.forEach(exp => {
        if (exp.status_document === 'NOT_YET') {
          list.push({
            id: `exp-pending-${exp.id}`,
            type: 'expense',
            title: 'Persetujuan CARF Baru',
            message: `Pengajuan ${exp.document_number} (${exp.expense_category}) senilai Rp ${exp.amount.toLocaleString('id-ID')} memerlukan persetujuan.`,
            path: '/expenses',
            timestamp: exp.created_at || 'Baru saja'
          })
        }
      })

      // 2. Unverified Technicians
      technicians.forEach(tech => {
        if (tech.verification_status === 'UNVERIFIED') {
          list.push({
            id: `tech-unverified-${tech.id}`,
            type: 'technician',
            title: 'Verifikasi Teknisi',
            message: `KTP & Rekening teknisi ${tech.name} memerlukan verifikasi admin.`,
            path: '/technicians',
            timestamp: 'Pending'
          })
        }
      })
    } else if (currentUser.role === 'REQUESTOR') {
      // Show updates to requestor's own expenses
      carfExpenses.forEach(exp => {
        if (exp.requestor_id === currentUser.id) {
          if (exp.status_disbursement === 'PAID') {
            list.push({
              id: `exp-paid-${exp.id}`,
              type: 'disbursement',
              title: 'Dana CARF Cair',
              message: `Dana pengajuan ${exp.document_number} telah ditransfer oleh Finance.`,
              path: '/expenses',
              timestamp: exp.disbursement_date || 'Baru saja'
            })
          } else if (exp.status_document === 'APPROVED') {
            list.push({
              id: `exp-approved-${exp.id}`,
              type: 'approval',
              title: 'Pengajuan Disetujui',
              message: `Pengajuan ${exp.document_number} Anda telah disetujui dan menunggu pembayaran.`,
              path: '/expenses',
              timestamp: 'Hari ini'
            })
          }
        }
      })
    }

    // Add isUnread property and sort so unread items come first
    return list.map(item => ({
      ...item,
      isUnread: !readNotifications.includes(item.id)
    })).sort((a, b) => (a.isUnread === b.isUnread ? 0 : a.isUnread ? -1 : 1))
  },
}))

export default useAppStore
