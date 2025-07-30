#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 BrainBased EMDR - Supabase Setup Helper\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found. Creating it...');
  fs.writeFileSync(envPath, '');
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if Supabase variables are already set
if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
  console.log('⚠️  Supabase variables already exist in .env.local');
  console.log('   Please update them with your actual Supabase credentials.\n');
} else {
  console.log('📝 Adding Supabase environment variables to .env.local...');
  
  const supabaseVars = `
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL_HERE"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"

# Database URL (for Prisma)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
`;

  fs.appendFileSync(envPath, supabaseVars);
  console.log('✅ Supabase variables added to .env.local\n');
}

console.log('📋 Next Steps:');
console.log('1. Go to https://supabase.com and create a new project');
console.log('2. Copy your Project URL and Anon Key from Settings → API');
console.log('3. Update the values in .env.local');
console.log('4. Run the SQL schema from SUPABASE_SETUP.md');
console.log('5. Test the connection with: npm run dev\n');

console.log('🔗 Useful Links:');
console.log('   • Supabase Dashboard: https://supabase.com/dashboard');
console.log('   • Project Settings: https://supabase.com/dashboard/project/[YOUR-PROJECT]/settings/api');
console.log('   • SQL Editor: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql/new\n');

console.log('📚 Documentation:');
console.log('   • Supabase Docs: https://supabase.com/docs');
console.log('   • Prisma + Supabase: https://supabase.com/docs/guides/integrations/prisma\n');
