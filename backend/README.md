# 🚀 Setup Instructions

## 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

OR download the ZIP file and extract it.

---

## 2. Install Root Dependencies

```bash
npm install
```

---

## 3. Install Frontend Dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

---

## 4. Install Backend Dependencies

```bash
cd ../backend
npm install
```

If dependency conflicts occur:

```bash
npm install --legacy-peer-deps
```

---

## 5. Generate Prisma Client

```bash
npx prisma generate
```

---

## 6. Configure Environment Variables

Create a `.env` file inside the `backend` folder and add the required environment variables.

---

## 7. Return to Root Directory

```bash
cd ..
```

---

## 8. Start the Project

```bash
npm run dev
```

---

## If Dependencies Change

Frontend:

```bash
cd frontend
npm install --legacy-peer-deps
```

Backend:

```bash
cd backend
npm install
npx prisma generate
```

---

## Useful Commands

Run Prisma Client:

```bash
npx prisma generate
```

Check Prisma Schema:

```bash
npx prisma validate
```

Run Security Audit:

```bash
npm audit
```

Fix Vulnerabilities:

```bash
npm audit fix
```
