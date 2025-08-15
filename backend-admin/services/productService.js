const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { PRODUCT_CATEGORIES } = require('../config/constants'); // TAMBAHAN


class ProductService {
  constructor() {
    this.collection = db.collection('products');
  }

  async getAllProducts() {
    try {
      const snapshot = await this.collection
        .orderBy('createdAt', 'desc')
        .get();
      
      const products = [];
      snapshot.forEach(doc => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        data: products
      };
    } catch (error) {
      console.error('Get products error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

   // TAMBAHAN: Get products by category
  async getProductsByCategory(category) {
    try {
      // Validate category
      const validCategories = Object.values(PRODUCT_CATEGORIES);
      if (!validCategories.includes(category.toLowerCase())) {
        return {
          success: false,
          error: 'Invalid category'
        };
      }

      const snapshot = await this.collection
        .where('category', '==', category.toLowerCase())
        .orderBy('createdAt', 'desc')
        .get();
      
      const products = [];
      snapshot.forEach(doc => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        data: products
      };
    } catch (error) {
      console.error('Get products by category error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // TAMBAHAN: Get available categories with count
  async getCategories() {
    try {
      const categories = Object.values(PRODUCT_CATEGORIES);
      const categoryData = [];

      for (const category of categories) {
        const snapshot = await this.collection
          .where('category', '==', category)
          .get();
        
        categoryData.push({
          name: category,
          displayName: this.getCategoryDisplayName(category),
          count: snapshot.size
        });
      }

      return {
        success: true,
        data: categoryData
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // TAMBAHAN: Helper method untuk display name
  getCategoryDisplayName(category) {
    const displayNames = {
      'kaos': 'Kaos',
      'fullset': 'fullset',
      'kemeja': 'Kemeja', 
      'hoodie': 'Hoodie'
    };
    return displayNames[category] || category;
  }

  async getProductById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      return {
        success: true,
        data: {
          id: doc.id,
          ...doc.data()
        }
      };
    } catch (error) {
      console.error('Get product error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createProduct(productData) {
    try {
      const productId = uuidv4();
      const product = {
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.collection.doc(productId).set(product);

      return {
        success: true,
        data: {
          id: productId,
          ...product
        }
      };
    } catch (error) {
      console.error('Create product error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateProduct(id, productData) {
    try {
      const updateData = {
        ...productData,
        updatedAt: new Date().toISOString()
      };

      await this.collection.doc(id).update(updateData);

      const updatedProduct = await this.getProductById(id);
      return updatedProduct;
    } catch (error) {
      console.error('Update product error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteProduct(id) {
    try {
      await this.collection.doc(id).delete();
      return {
        success: true,
        message: 'Product deleted successfully'
      };
    } catch (error) {
      console.error('Delete product error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // UPDATED: Enhanced search with category filter
  async searchProducts(query, category) {
    try {
      let queryRef = this.collection;

      // Filter by category if provided
      if (category) {
        const validCategories = Object.values(PRODUCT_CATEGORIES);
        if (!validCategories.includes(category.toLowerCase())) {
          return {
            success: false,
            error: 'Invalid category'
          };
        }
        queryRef = queryRef.where('category', '==', category.toLowerCase());
      }

      const snapshot = await queryRef.get();
      const products = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Text search filter
        if (query) {
          const searchText = `${data.name} ${data.description}`.toLowerCase();
          if (searchText.includes(query.toLowerCase())) {
            products.push({
              id: doc.id,
              ...data
            });
          }
        } else {
          // No text search, just category filter
          products.push({
            id: doc.id,
            ...data
          });
        }
      });

      return {
        success: true,
        data: products
      };
    } catch (error) {
      console.error('Search products error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ProductService();