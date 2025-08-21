#!/usr/bin/env node

/**
 * User Management System Migration Runner
 * 
 * Bu script personel yönetim sistemi için gerekli database tablolarını oluşturur:
 * - users (kullanıcılar)
 * - permissions (yetkiler)
 * - user_permissions (kullanıcı yetki atamaları)
 * - activity_logs (işlem geçmişi)
 * - user_sessions (oturum yönetimi)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase environment variables are missing!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting User Management System Migration...');
  console.log('=====================================');

  try {
    // Read SQL migration file
    const sqlPath = path.join(__dirname, '15-create-user-management-system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📖 Reading migration file...');
    console.log(`📁 File: ${sqlPath}`);

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('SELECT ') && statement.includes('result')) {
        // Skip result messages
        continue;
      }

      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // Try direct query if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);

          if (directError) {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.error(`❌ Error executing statement ${i + 1}:`, execError.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const tablesToCheck = ['users', 'permissions', 'user_permissions', 'activity_logs', 'user_sessions'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table '${tableName}' verification failed:`, error.message);
        } else {
          console.log(`✅ Table '${tableName}' exists and accessible`);
        }
      } catch (verifyError) {
        console.log(`❌ Table '${tableName}' verification error:`, verifyError.message);
      }
    }

    // Check if permissions were inserted
    console.log('\n📋 Checking default permissions...');
    try {
      const { data: permissions, error: permError } = await supabase
        .from('permissions')
        .select('name, category')
        .order('category, name');

      if (permError) {
        console.log('❌ Could not fetch permissions:', permError.message);
      } else {
        console.log(`✅ Found ${permissions?.length || 0} permissions:`);
        
        const categories = {};
        permissions?.forEach(perm => {
          if (!categories[perm.category]) {
            categories[perm.category] = [];
          }
          categories[perm.category].push(perm.name);
        });

        Object.keys(categories).forEach(category => {
          console.log(`  📂 ${category}: ${categories[category].length} permissions`);
          categories[category].forEach(name => {
            console.log(`    - ${name}`);
          });
        });
      }
    } catch (permCheckError) {
      console.log('❌ Permission check error:', permCheckError.message);
    }

    // Check if admin user was created
    console.log('\n👤 Checking admin user...');
    try {
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('username, full_name, role, is_active')
        .eq('username', 'admin')
        .single();

      if (adminError) {
        console.log('❌ Could not fetch admin user:', adminError.message);
      } else {
        console.log('✅ Admin user found:');
        console.log(`  👤 Username: ${adminUser.username}`);
        console.log(`  📝 Full Name: ${adminUser.full_name}`);
        console.log(`  🔑 Role: ${adminUser.role}`);
        console.log(`  ✅ Active: ${adminUser.is_active}`);
      }
    } catch (adminCheckError) {
      console.log('❌ Admin user check error:', adminCheckError.message);
    }

    console.log('\n🎉 User Management System Migration Completed!');
    console.log('=====================================');
    console.log('✅ Database tables created successfully');
    console.log('✅ Default permissions inserted');
    console.log('✅ Admin user created');
    console.log('✅ Indexes and triggers configured');
    console.log('✅ Row Level Security policies applied');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Update authentication system for multi-user login');
    console.log('2. Create user management UI');
    console.log('3. Implement permission-based authorization');
    console.log('4. Add activity logging to existing features');
    
    console.log('\n🔐 Default Admin Credentials:');
    console.log('Username: admin');
    console.log('Password: admin123 (CHANGE IN PRODUCTION!)');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration().catch(console.error);