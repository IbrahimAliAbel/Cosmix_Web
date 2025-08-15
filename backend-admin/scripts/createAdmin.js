const authService = require('../services/authService');
require('dotenv').config();

async function createFirstAdmin() {
  try {
    const adminData = {
      name: 'Admin Abel',
      email: 'abel@admin.com',
      password: 'abel123',
      role: 'admin'
    };

    console.log('Creating first admin user...');
    const result = await authService.registerUser(adminData);

    if (result.success) {
      console.log('✅ Admin user created successfully!');
      console.log('Email:', adminData.email);
      console.log('Password:', adminData.password);
      console.log('⚠️  Please change the password after first login!');
    } else {
      console.error('❌ Failed to create admin:', result.error);
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
  
  process.exit(0);
}

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  createFirstAdmin();
}

module.exports = createFirstAdmin;