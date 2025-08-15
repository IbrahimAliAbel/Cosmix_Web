// services/userService.js
const { db } = require('../config/firebase');

class UserService {
  constructor() {
    this.favoritesCollection = db.collection('favorites');
    this.cartCollection = db.collection('cart');
    this.ordersCollection = db.collection('orders');
  }

  // Get user favorites
  async getUserFavorites(userId) {
    try {
      const snapshot = await this.favoritesCollection
        .where('userId', '==', userId)
        .get();
      
      const favorites = [];
      snapshot.forEach(doc => {
        favorites.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        data: favorites
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add to favorites
  async addToFavorites(userId, productId) {
    try {
      // Check if already exists
      const existingSnapshot = await this.favoritesCollection
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .get();

      if (!existingSnapshot.empty) {
        return {
          success: false,
          error: 'Product already in favorites'
        };
      }

      // Add to favorites
      const favoriteDoc = {
        userId: userId,
        productId: productId,
        createdAt: new Date().toISOString()
      };

      const docRef = await this.favoritesCollection.add(favoriteDoc);

      return {
        success: true,
        data: {
          id: docRef.id,
          ...favoriteDoc
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Remove from favorites
  async removeFromFavorites(userId, productId) {
    try {
      const snapshot = await this.favoritesCollection
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .get();

      if (snapshot.empty) {
        return {
          success: false,
          error: 'Favorite not found'
        };
      }

      // Delete the favorite
      await snapshot.docs[0].ref.delete();

      return {
        success: true,
        message: 'Removed from favorites'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user cart
  async getUserCart(userId) {
    try {
      const snapshot = await this.cartCollection
        .where('userId', '==', userId)
        .get();
      
      const cartItems = [];
      snapshot.forEach(doc => {
        cartItems.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        data: cartItems
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add to cart
  async addToCart(userId, productId, quantity = 1) {
    try {
      // Check if already in cart
      const existingSnapshot = await this.cartCollection
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .get();

      if (!existingSnapshot.empty) {
        // Update quantity
        const existingDoc = existingSnapshot.docs[0];
        const existingData = existingDoc.data();
        await existingDoc.ref.update({
          quantity: existingData.quantity + quantity,
          updatedAt: new Date().toISOString()
        });

        return {
          success: true,
          data: {
            id: existingDoc.id,
            ...existingData,
            quantity: existingData.quantity + quantity
          }
        };
      } else {
        // Add new item
        const cartItem = {
          userId: userId,
          productId: productId,
          quantity: quantity,
          createdAt: new Date().toISOString()
        };

        const docRef = await this.cartCollection.add(cartItem);

        return {
          success: true,
          data: {
            id: docRef.id,
            ...cartItem
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Remove from cart
  async removeFromCart(userId, productId) {
    try {
      const snapshot = await this.cartCollection
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .get();

      if (snapshot.empty) {
        return {
          success: false,
          error: 'Cart item not found'
        };
      }

      await snapshot.docs[0].ref.delete();

      return {
        success: true,
        message: 'Removed from cart'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user orders
  async getUserOrders(userId) {
    try {
      const snapshot = await this.ordersCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        data: orders
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create order
  async createOrder(userId, orderData) {
    try {
      const order = {
        userId: userId,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        status: 'pending',
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await this.ordersCollection.add(order);

      // Clear user's cart after successful order
      const cartSnapshot = await this.cartCollection
        .where('userId', '==', userId)
        .get();
      
      const batch = db.batch();
      cartSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      return {
        success: true,
        data: {
          id: docRef.id,
          ...order
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new UserService();