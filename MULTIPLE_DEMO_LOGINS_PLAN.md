# Multiple Demo Logins Feature - Implementation Plan

## 🎯 Goal
Add support for **multiple demo login accounts** (each with role, email, password) while **keeping the current simple demo login system**.

## 📊 Current System (Keep This!)
✅ **Simple Demo Login** - Good for basic tools
- Demo URL
- Demo Username  
- Demo Password

## ✨ New Feature - Role-Based Demo Logins
📌 **For tools with multiple user roles** (like CRM with Sales, Manager, Admin)

Each demo login will have:
- **Role Name** (e.g., "Sales Person", "Manager", "Admin")
- **Email** (e.g., sales@demo.com)
- **Password** (e.g., demo123)

### Example Use Case: CRM Tool
```
Demo Logins:
1. Sales Person - sales@demo.com - demo123
2. Manager - manager@demo.com - demo123  
3. Admin - admin@demo.com - admin123
```

---

## 🗄️ Database Changes

### 1. Add New Column to `tools` Table
**Column:** `demo_logins` (JSONB array)

```sql
ALTER TABLE tools 
ADD COLUMN demo_logins JSONB DEFAULT '[]'::jsonb;
```

**Data Structure:**
```json
[
  {
    "role": "Sales Person",
    "email": "sales@demo.com",
    "password": "demo123"
  },
  {
    "role": "Manager",
    "email": "manager@demo.com",
    "demo123"
  }
]
```

### 2. Keep Existing Columns (Backward Compatible!)
- `demo_url` (text)
- `demo_username` (text)
- `demo_password` (text)

---

## 🎨 UI Changes - ToolDetail.tsx

### Updated Demo Login Tab Layout:

```
┌─────────────────────────────────────────┐
│ Demo Login                        [Edit]│
├─────────────────────────────────────────┤
│                                          │
│ 📌 Simple Demo Access                    │
│ ├─ Demo URL: https://crm.demo.com       │
│ ├─ Username: demo@example.com           │
│ └─ Password: •••••••• 👁                 │
│                                          │
│ ──────────────────────────────────────  │
│                                          │
│ 👥 Role-Based Demo Accounts   [+ Add]   │
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ Sales Person                         ││
│ │ Email: sales@demo.com                ││
│ │ Password: •••••••• 👁  📋  🗑️         ││
│ └──────────────────────────────────────┘│
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ Manager                              ││
│ │ Email: manager@demo.com              ││
│ │ Password: •••••••• 👁  📋  🗑️         ││
│ └──────────────────────────────────────┘│
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ Admin                                ││
│ │ Email: admin@demo.com                ││
│ │ Password: •••••••• 👁  📋  🗑️         ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Features:
- ✅ **Two sections**: Simple Demo (current) + Role-Based (new)
- ✅ **Add button**: Add new role-based demo login
- ✅ **Show/Hide password**: Toggle visibility (👁)
- ✅ **Copy to clipboard**: Quick copy email/password (📋)
- ✅ **Delete**: Remove a demo login (🗑️)
- ✅ **Edit**: Modify existing logins

---

## 💻 Implementation Steps

### Step 1: Database Migration
**File:** `supabase/migrations/add_demo_logins_array.sql`
```sql
-- Add demo_logins column
ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS demo_logins JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN tools.demo_logins IS 
'Array of role-based demo logins with structure: [{"role": "...", "email": "...", "password": "..."}]';
```

### Step 2: Update ToolDetail.tsx

#### A) Add State for Demo Logins
```typescript
const [demoLogins, setDemoLogins] = useState<DemoLogin[]>([]);
const [addingDemoLogin, setAddingDemoLogin] = useState(false);
const [newDemoLogin, setNewDemoLogin] = useState({ role: '', email: '', password: '' });
const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

interface DemoLogin {
  role: string;
  email: string;
  password: string;
}
```

#### B) Load Demo Logins
```typescript
useEffect(() => {
  if (tool) {
    setDemoLogins((tool as any).demo_logins || []);
  }
}, [tool]);
```

#### C) Add Demo Login Functions
```typescript
const handleAddDemoLogin = async () => {
  if (!newDemoLogin.role || !newDemoLogin.email || !newDemoLogin.password) {
    toast({ title: 'Error', description: 'All fields required', variant: 'destructive' });
    return;
  }

  const updatedLogins = [...demoLogins, newDemoLogin];
  
  const { data, error } = await supabase
    .from('tools')
    .update({ demo_logins: updatedLogins })
    .eq('id', tool!.id)
    .select()
    .single();

  if (error) {
    toast({ title: 'Error', description: 'Failed to add demo login', variant: 'destructive' });
  } else {
    setTool(data as Tool);
    setDemoLogins(updatedLogins);
    setNewDemoLogin({ role: '', email: '', password: '' });
    setAddingDemoLogin(false);
    toast({ title: 'Success', description: 'Demo login added' });
  }
};

const handleDeleteDemoLogin = async (index: number) => {
  const updatedLogins = demoLogins.filter((_, i) => i !== index);
  
  const { data, error } = await supabase
    .from('tools')
    .update({ demo_logins: updatedLogins })
    .eq('id', tool!.id)
    .select()
    .single();

  if (error) {
    toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
  } else {
    setTool(data as Tool);
    setDemoLogins(updatedLogins);
    toast({ title: 'Success', description: 'Demo login deleted' });
  }
};
```

#### D) Update UI (Replace existing Demo Login tab content)
- Keep the current simple demo login section at top
- Add horizontal separator
- Add new "Role-Based Demo Accounts" section below
- Show list of demo logins with cards
- Add "+ Add" button
- Add show/hide/copy/delete for each login

### Step 3: Update Supabase Types
**File:** `src/lib/supabase.ts`

Add to tools table type:
```typescript
demo_logins: {
  role: string;
  email: string;
  password: string;
}[] | null;
```

---

## ✅ Benefits

1. **Backward Compatible** - Existing simple demo logins still work
2. **Flexible** - Tools can use simple OR role-based OR both
3. **Better for Complex Tools** - CRM, ERP, etc. with multiple user types
4. **Easy Testing** - Testers can quickly access different user roles
5. **Clean UI** - Organized, professional display

---

## 🧪 Testing Plan

1. **Migration Test**
   - Run migration script
   - Verify column added
   - Check existing tools still have their demo_url/username/password

2. **Add Demo Login**
   - Add Sales Person login
   - Add Manager login
   - Verify saved to database

3. **Edit Demo Login**
   - Modify role name
   - Modify email
   - Verify password toggle works

4. **Delete Demo Login**
   - Delete one login
   - Verify others remain

5. **Copy Functionality**
   - Copy email to clipboard
   - Copy password to clipboard

---

## 📝 Next Steps

1. ✅ Review this plan
2. Run database migration
3. Update ToolDetail.tsx component
4. Update Supabase types
5. Test the feature
6. Deploy!

**Ready to implement?** 🚀

This keeps your current good system AND adds the powerful role-based demo logins feature!
