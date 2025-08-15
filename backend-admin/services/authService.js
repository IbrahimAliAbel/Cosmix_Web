// ============= services/authService.js (Updated) =============
const { admin, db } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthService {
  constructor() {
    this.usersCollection = db.collection('users');
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  }

  // Register user dengan Firebase Auth
  async registerUser(userData) {
    try {
      const { email, password, name, role = 'user' } = userData;

      // Create user di Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
        emailVerified: false
      });

      // Simpan data tambahan di Firestore dengan preferences default
      const userDoc = {
        uid: userRecord.uid,
        email: email,
        name: name,
        role: role, // 'admin' atau 'user'
        isActive: true,
        notifications: true,    // NEW: Default notification preference
        newsletter: true,       // NEW: Default newsletter preference
        avatar: null,          // NEW: For future avatar functionality
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.usersCollection.doc(userRecord.uid).set(userDoc);

      // Set custom claims untuk role
      await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });

      return {
        success: true,
        data: {
          uid: userRecord.uid,
          email: email,
          name: name,
          role: role
        }
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Login dengan Firebase Auth
  async loginUser(email, password) {
    try {
      // Verifikasi user exists di Firebase Auth
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // Get user data dari Firestore
      const userDoc = await this.usersCollection.doc(userRecord.uid).get();
      
      if (!userDoc.exists) {
        return {
          success: false,
          error: 'User data not found'
        };
      }

      const userData = userDoc.data();
      
      if (!userData.isActive) {
        return {
          success: false,
          error: 'Account is deactivated'
        };
      }

      // Update last login
      await this.usersCollection.doc(userRecord.uid).update({
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          uid: userRecord.uid,
          email: userData.email,
          role: userData.role 
        },
        this.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        data: {
          token: token,
          user: {
            uid: userRecord.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            isActive: userData.isActive
          }
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
  }

  // Verifikasi Firebase ID Token
  async verifyFirebaseToken(idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Get user data dari Firestore
      const userDoc = await this.usersCollection.doc(decodedToken.uid).get();
      
      if (!userDoc.exists) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const userData = userDoc.data();
      
      return {
        success: true,
        data: {
          uid: decodedToken.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role
        }
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: 'Invalid token'
      };
    }
  }

  // ======= UPDATED: Enhanced getUserProfile =======
  async getUserProfile(uid) {
    try {
      const userDoc = await this.usersCollection.doc(uid).get();
      
      if (!userDoc.exists) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const userData = userDoc.data();
      
      return {
        success: true,
        data: {
          uid: uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isActive: userData.isActive,
          notifications: userData.notifications ?? true,    // NEW: Include preferences
          newsletter: userData.newsletter ?? true,          // NEW: Include preferences  
          avatar: userData.avatar || null,                  // NEW: Include avatar
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin || null
        }
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======= UPDATED: Enhanced updateUserProfile =======
  async updateUserProfile(uid, updateData) {
    try {
      const allowedFields = ['name', 'email', 'notifications', 'newsletter'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {  // Check for undefined instead of truthy
          filteredData[field] = updateData[field];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        return {
          success: false,
          error: 'No valid fields to update'
        };
      }

      filteredData.updatedAt = new Date().toISOString();
      
      // Update Firestore document
      await this.usersCollection.doc(uid).update(filteredData);

      // Update di Firebase Auth juga jika ada perubahan name atau email
      const authUpdateData = {};
      if (filteredData.name) {
        authUpdateData.displayName = filteredData.name;
      }
      if (filteredData.email) {
        authUpdateData.email = filteredData.email;
      }

      if (Object.keys(authUpdateData).length > 0) {
        await admin.auth().updateUser(uid, authUpdateData);
      }

      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======= NEW: Check email exists =======
  async checkEmailExists(email, excludeUid = null) {
    try {
      const usersRef = this.usersCollection;
      const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
      
      if (!snapshot.empty) {
        // Check if the email belongs to the current user (for updates)
        if (excludeUid) {
          const existingUser = snapshot.docs[0];
          if (existingUser.id === excludeUid) {
            return { success: true }; // Same user, email is available for them
          }
        }
        
        return {
          success: false,
          error: 'Email already exists'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Check email exists error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Change password
  async changePassword(uid, newPassword) {
    try {
      await admin.auth().updateUser(uid, {
        password: newPassword
      });

      // Update timestamp di Firestore
      await this.usersCollection.doc(uid).update({
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======= UPDATED: Enhanced logoutUser =======
  async logoutUser(uid) {
    try {
      // Revoke refresh tokens
      await admin.auth().revokeRefreshTokens(uid);
      
      // Update last logout timestamp
      await this.usersCollection.doc(uid).update({
        lastLogout: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      // Don't fail logout if there's an error
      return {
        success: true,
        message: 'Logged out successfully'
      };
    }
  }

  // Admin: Get all users
  async getAllUsers() {
    try {
      const snapshot = await this.usersCollection
        .orderBy('createdAt', 'desc')
        .get();
      
      const users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          isActive: data.isActive,
          notifications: data.notifications ?? true,
          newsletter: data.newsletter ?? true,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin || null
        });
      });

      return {
        success: true,
        data: users
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Admin: Toggle user status
  async toggleUserStatus(uid) {
    try {
      const userDoc = await this.usersCollection.doc(uid).get();
      
      if (!userDoc.exists) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const currentStatus = userDoc.data().isActive;
      const newStatus = !currentStatus;
      
      await this.usersCollection.doc(uid).update({
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Disable/enable di Firebase Auth juga
      await admin.auth().updateUser(uid, {
        disabled: currentStatus // jika aktif sekarang, maka disable
      });

      return {
        success: true,
        message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
      };
    } catch (error) {
      console.error('Toggle user status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AuthService();