# Project NSD (CARF & Expenses Management)

Aplikasi manajemen pencatatan CARF, pengeluaran, teknisi, dan penugasan lapangan yang dibuat dengan React (Frontend) dan Express + SQLite WASM (Backend).

## Prasyarat
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru direkomendasikan)
- npm (bawaan dari instalasi Node.js)

## Cara Menjalankan Aplikasi

### 1. Instalasi Dependensi
Sebelum menjalankan aplikasi untuk pertama kali, Anda perlu menginstal dependensi di direktori utama (root) dan di direktori server.

Buka terminal di direktori proyek dan jalankan perintah berikut secara berurutan:

```bash
# Menginstal dependensi untuk Frontend dan root utilities
npm install

# Menginstal dependensi untuk Backend
cd server
npm install
cd ..
```

### 2. Menjalankan Server & Frontend Sekaligus
Untuk memudahkan pengembangan, Anda dapat menjalankan server backend dan server frontend secara bersamaan menggunakan satu perintah:

```bash
npm run dev:all
```

Perintah ini akan menjalankan:
- **Frontend (Vite):** Biasanya berjalan di [http://localhost:5173](http://localhost:5173)
- **Backend (Express):** Berjalan di [http://localhost:3001](http://localhost:3001)

### 3. Menjalankan Secara Terpisah (Opsional)
Jika Anda ingin menjalankannya secara terpisah di terminal yang berbeda:

* **Menjalankan Frontend saja:**
  ```bash
  npm run dev:fe
  ```

* **Menjalankan Backend saja:**
  ```bash
  npm run dev:server
  ```

### 4. Seed Data Database (Opsional)
Jika database Anda kosong dan Anda ingin mengisi data awal (seperti data user default, teknisi, dll.), Anda bisa menjalankan script seed di folder server:

```bash
cd server
npm run seed
```
## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ CARF_EXPENSES : "creates / requests"
    TECHNICIANS ||--o{ CARF_EXPENSES : "assigned_to / recipient"
    TASKS ||--o{ CARF_EXPENSES : "related_to"

    USERS {
        text id PK
        text name
        text email UK
        text role
        text area
        text password
        text created_at
    }

    TECHNICIANS {
        text id PK
        text name
        text ktp_number UK
        text ktp_image_url
        text bank_name
        text bank_account_number
        text bank_account_owner_name
        integer is_third_party_account
        text third_party_relation
        text verification_status
        text notes
    }

    TASKS {
        text id PK
        text task_type
        text area
        text start_date
        text end_date
        text description
    }

    CARF_EXPENSES {
        text id PK
        text document_number UK
        text pengajuan_number
        text request_date
        text requestor_id FK
        text requestor_name
        text task_id FK
        text technician_id FK
        text technician_name
        text division
        text expense_category
        text description
        text description_other
        real amount
        text status_document
        text status_disbursement
        text disbursement_date
        text transfer_receipt_url
        text created_at
    }
```

