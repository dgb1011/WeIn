# 🚀 Quick Start Guide - BrainBased EMDR Platform

## ⚡ **Get Started in 5 Minutes**

### **Step 1: Create Supabase Project**

1. **Visit [supabase.com](https://supabase.com)**
2. **Sign up/Login** with your GitHub or Google account
3. **Click "New Project"**
4. **Fill in details:**
   - **Name**: `brainbased-emdr-platform`
   - **Database Password**: `emdr-secure-password-2024`
   - **Region**: Choose closest to your users
5. **Click "Create new project"**

### **Step 2: Get Your Credentials**

1. **Go to Settings → API** in your Supabase dashboard
2. **Copy these values:**
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)

### **Step 3: Update Environment Variables**

Edit `.env.local` and replace the placeholders:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Database URL (for Prisma)
DATABASE_URL="postgresql://postgres:emdr-secure-password-2024@db.your-project-ref.supabase.co:5432/postgres"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### **Step 4: Set Up Database Schema**

1. **Go to SQL Editor** in Supabase dashboard
2. **Copy and paste** the SQL from `SUPABASE_SETUP.md`
3. **Click "Run"** to create all tables

### **Step 5: Test Your Setup**

```bash
# Install dependencies (if not already done)
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with sample data
npm run db:seed

# Start the development server
npm run dev
```

### **Step 6: Verify Everything Works**

1. **Open [http://localhost:3000](http://localhost:3000)**
2. **Check the console** for any errors
3. **Test the API endpoints** using the browser or Postman

## 🎯 **What You Should See**

### **✅ Success Indicators:**
- Development server starts without errors
- Database connection established
- Sample data loaded successfully
- Authentication system working
- API endpoints responding

### **❌ Common Issues & Solutions:**

#### **Database Connection Error**
```bash
# Check your DATABASE_URL format
# Should look like: postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
```

#### **Prisma Client Error**
```bash
# Regenerate Prisma client
npx prisma generate
```

#### **Environment Variables Error**
```bash
# Check .env.local file exists and has correct values
cat .env.local
```

#### **Supabase Connection Error**
```bash
# Verify your Supabase URL and key are correct
# Check if your project is active in Supabase dashboard
```

## 🔧 **Development Commands**

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database
npm run db:seed

# Reset database (careful!)
npm run db:reset
```

## 📊 **Project Structure**

```
wein/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   └── ui/            # shadcn/ui components
│   └── lib/               # Utilities and services
│       ├── supabase.ts    # Supabase client
│       ├── auth.ts        # Authentication
│       └── services/      # Business logic
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Sample data
├── .env.local            # Environment variables
└── SUPABASE_SETUP.md     # Detailed setup guide
```

## 🚀 **Next Steps After Setup**

1. **Build the authentication UI**
2. **Create user dashboards**
3. **Implement video platform**
4. **Add scheduling system**
5. **Integrate with Kajabi**

## 📞 **Need Help?**

- **Documentation**: Check `SUPABASE_SETUP.md` for detailed instructions
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [discord.supabase.com](https://discord.supabase.com)

---

**🎉 You're ready to build the BrainBased EMDR platform!** 