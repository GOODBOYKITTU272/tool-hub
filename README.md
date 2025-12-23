# 🛠️ ToolHub - Internal Tool Management Platform

> A modern, role-based internal tool management system built for high-velocity teams. Manage, approve, and share internal tools with granular access control.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.87-3ecf8e)](https://supabase.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [User Roles & Permissions](#user-roles--permissions)
- [Features](#features)
- [Authentication Workflow](#authentication-workflow)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## 🎯 Overview

**ToolHub** is an internal workflow system designed for marketing and operations teams to manage access to internal tools, scripts, and resources. It provides:

- **Role-Based Access Control (RBAC)** - Admin, Owner, and Observer roles
- **Tool Approval Workflow** - Request, review, and approve tool access
- **Real-time Updates** - Live notifications via Supabase Realtime
- **Session Protection** - Prevents accidental data loss from page reloads
- **Audit Logging** - Track all system activities

---

## 🚀 Technology Stack

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 5.4.19 | Build tool & dev server |
| **React Router** | 6.30.1 | Client-side routing |
| **TanStack Query** | 5.83.0 | Server state management |

### **UI Components**
| Technology | Version | Purpose |
|------------|---------|---------|
| **shadcn/ui** | Latest | Component library |
| **Radix UI** | Latest | Headless UI primitives |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS |
| **Lucide React** | 0.462.0 | Icon library |

### **Backend & Database**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.87.3 | Backend-as-a-Service |
| **PostgreSQL** | Latest | Relational database |
| **Row Level Security** | - | Database-level authorization |

### **State Management**
- **React Context API** - Global auth state
- **TanStack Query** - Server state caching
- **localStorage** - Session persistence

---

## 🏗️ Architecture

### **System Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   React UI   │  │  Auth Context│  │  TanStack    │  │
│  │   (Vite)     │  │  (Session)   │  │  Query       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │           │
│         └─────────────────┴──────────────────┘           │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase (Backend)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Auth       │  │  PostgreSQL  │  │  Realtime    │  │
│  │   (JWT)      │  │  (Database)  │  │  (WebSocket) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  Row Level Security (RLS) Policies                      │
└─────────────────────────────────────────────────────────┘
```

### **Data Flow**

```
User Action → React Component → Supabase Client → PostgreSQL
                                        ↓
                                  RLS Policy Check
                                        ↓
                                  Return Data
                                        ↓
                            TanStack Query Cache
                                        ↓
                                  Update UI
```

---

## 👥 User Roles & Permissions

### **Role Hierarchy**

```
Admin (Highest)
  ↓
Owner (Medium)
  ↓
Observer (Lowest)
```

### **Detailed Permissions**

| Feature | Admin | Owner | Observer |
|---------|-------|-------|----------|
| **Tools** |
| View all tools | ✅ | ✅ | ✅ (approved only) |
| Create tools | ✅ | ✅ | ❌ |
| Edit own tools | ✅ | ✅ | ❌ |
| Edit any tool | ✅ | ❌ | ❌ |
| Delete own tools | ✅ | ✅ | ❌ |
| Delete any tool | ✅ | ❌ | ❌ |
| Approve tools | ✅ | ❌ | ❌ |
| **Users** |
| View users | ✅ | ❌ | ❌ |
| Create users | ✅ | ❌ | ❌ |
| Edit users | ✅ | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ |
| **Requests** |
| View all requests | ✅ | ✅ | ✅ (own only) |
| Create requests | ✅ | ✅ | ✅ |
| Approve requests | ✅ | ❌ | ❌ |
| **Audit Logs** |
| View audit logs | ✅ | ❌ | ❌ |

---

## ✨ Features

### **1. Tool Management**
- 📝 Create and manage internal tools
- 🏷️ Categorize with tags and types
- 🔗 Store URLs and documentation
- 👤 Assign ownership and teams
- ✅ Approval workflow for new tools

### **2. Authentication & Security**
- 🔐 Email/password authentication via Supabase
- 🔑 JWT-based session management
- 💾 Automatic session persistence
- 🔄 Auto-refresh tokens
- 🛡️ Row Level Security (RLS) policies
- 🚫 Reload protection to prevent session loss
- 🆘 Emergency storage clear (Ctrl+Shift+Alt+C)

### **3. Real-time Features**
- 🔴 Live tool updates
- 🔔 Real-time notifications
- 👥 Multi-user collaboration
- ⚡ Instant UI updates via WebSocket

### **4. User Management** (Admin only)
- 👥 Invite new users
- 🎭 Assign roles
- 🔒 Force password reset
- 📊 View user activity

### **5. Request System**
- 📋 Submit tool access requests
- ✅ Approval workflow
- 📝 Comments and feedback
- 📊 Request tracking

### **6. Audit Logging** (Admin only)
- 📜 Track all system activities
- 👤 User action history
- 🕐 Timestamp tracking
- 🔍 Searchable logs

---

## 🔐 Authentication Workflow

### **Login Flow**

```
1. User enters email/password
   ↓
2. Supabase Auth validates credentials
   ↓
3. Generate JWT access token
   ↓
4. Fetch user profile from public.users table
   ↓
5. Check must_change_password flag
   ↓
6. Store session in localStorage
   ↓
7. Cache user profile
   ↓
8. Redirect to dashboard
```

### **Session Persistence**

```
Page Reload
   ↓
Check localStorage for session
   ↓
Session found?
   ├─ Yes → Restore session
   │         ↓
   │    Load cached profile (instant)
   │         ↓
   │    Fetch fresh profile (background)
   │         ↓
   │    Display app
   │
   └─ No → Redirect to login
```

### **Storage Keys**

| Key | Purpose | Example |
|-----|---------|---------|
| `sb-{project}-auth-token` | Supabase session | JWT tokens |
| `tool-hub-profile:{userId}` | Cached user profile | User data |
| `tool-hub-auth` | Custom auth key | Session metadata |

---

## 🗄️ Database Schema

### **Tables**

#### **1. users**
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Owner', 'Observer')),
  must_change_password BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2. tools**
```sql
CREATE TABLE public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  type TEXT,
  tags TEXT[],
  url TEXT,
  owner_id UUID REFERENCES public.users(id),
  owner_team TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),
  approval_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Row Level Security (RLS) Policies**

#### **Users Table**
- ✅ Users can read their own profile
- ✅ Admins can read all users
- ✅ Admins can create/update/delete users
- ✅ Users can update their own password flag

#### **Tools Table**
- ✅ All authenticated users can read approved tools
- ✅ Owners can read their own tools (any status)
- ✅ Admins can read all tools
- ✅ Admins and Owners can create tools
- ✅ Admins can update/delete any tool
- ✅ Owners can update/delete their own tools

---

## 🚀 Getting Started

### **Prerequisites**

- **Node.js** 18+ and npm
- **Supabase Account** (free tier works)
- **Git**

### **1. Clone the Repository**

```bash
git clone https://github.com/GOODBOYKITTU272/tool-hub.git
cd tool-hub
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Set Up Supabase**

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Run the schema from `supabase-schema.sql`

### **4. Configure Environment Variables**

Create `.env.local` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from: **Supabase Dashboard → Settings → API**

### **5. Create Admin User**

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **Add User** → Create user with email/password
3. Copy the user's UUID
4. Go to **SQL Editor** and run:

```sql
INSERT INTO public.users (id, email, name, role, must_change_password)
VALUES (
  'YOUR_USER_UUID_HERE',
  'admin@example.com',
  'Admin User',
  'Admin',
  FALSE
);
```

### **6. Start Development Server**

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080)

---

## 💻 Development

### **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### **Development Workflow**

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   ```bash
   npm run dev
   ```

3. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

4. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

### **Code Style**

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting (recommended)
- **Conventional Commits** for commit messages

---

## 🌐 Deployment

### **Deploy to Vercel** (Recommended)

1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### **Deploy to Netlify**

1. Build the project:
   ```bash
   npm run build
   ```
2. Upload `dist/` folder to Netlify
3. Configure environment variables

---

## 📁 Project Structure

```
tool-hub/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── layout/       # Layout components (AppLayout, Header)
│   │   ├── tools/        # Tool-related components
│   │   ├── ui/           # shadcn/ui components
│   │   └── ReloadProtection.tsx
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useRealtimeSubscription.ts
│   │   └── use-toast.ts
│   ├── lib/              # Utility libraries
│   │   ├── supabase.ts   # Supabase client
│   │   └── storageUtils.ts
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Tools.tsx
│   │   ├── Users.tsx
│   │   └── Login.tsx
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── .env.local            # Environment variables (not in git)
├── supabase-schema.sql   # Database schema
├── RELOAD_PROTECTION.md  # Reload protection docs
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🔧 Key Features Explained

### **Reload Protection**

Prevents accidental page reloads that could corrupt sessions:

- **Blocked:** F5, Ctrl+R, Cmd+R
- **Warning:** Browser reload button shows confirmation
- **Emergency Clear:** Ctrl+Shift+Alt+C to clear stuck sessions

See [RELOAD_PROTECTION.md](./RELOAD_PROTECTION.md) for details.

### **Real-time Subscriptions**

Uses Supabase Realtime for live updates:

```typescript
useRealtimeSubscription('tools', (payload) => {
  if (payload.eventType === 'INSERT') {
    // New tool added
  }
});
```

### **Session Management**

- Auto-refresh tokens before expiry
- Cached profiles for instant loading
- Retry logic with exponential backoff
- Emergency storage clear for stuck sessions

---

## 📝 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Contact: ramakrishna@applywizz

---

## 🎉 Acknowledgments

Built with:
- [React](https://reactjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ by the ToolHub Team**
