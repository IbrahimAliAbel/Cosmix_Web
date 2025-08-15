const productService = require('../services/productService');
const imageService = require('../services/imageService');
const { productSchema, updateProductSchema } = require('../utils/validation');

class ProductController {
  async getAllProducts(request, h) {
    try {
      const { search, category } = request.query;
      
      let result;
      if (search) {
        result = await productService.searchProducts(search, category);
      } else {
        result = await productService.getAllProducts();
      }

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(500);
      }

      return h.response({
        success: true,
        data: result.data,
        total: result.data.length
      }).code(200);
    } catch (error) {
      console.error('Get products controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // TAMBAHAN: Get products by category
  async getProductsByCategory(request, h) {
    try {
      const { category } = request.params;
      const result = await productService.getProductsByCategory(category);

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(result.error === 'Invalid category' ? 400 : 500);
      }

      return h.response({
        success: true,
        data: result.data,
        total: result.data.length
      }).code(200);
    } catch (error) {
      console.error('Get products by category controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // TAMBAHAN: Get available categories
  async getCategories(request, h) {
    try {
      const result = await productService.getCategories();

      return h.response({
        success: true,
        data: result.data
      }).code(200);
    } catch (error) {
      console.error('Get categories controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  async getProductById(request, h) {
    try {
      const { id } = request.params;
      const result = await productService.getProductById(id);

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(result.error === 'Product not found' ? 404 : 500);
      }

      return h.response({
        success: true,
        data: result.data
      }).code(200);
    } catch (error) {
      console.error('Get product controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  async createProduct(request, h) {
    try {
      console.log('Received payload:', request.payload); // Debug log
      
      // Extract basic fields from payload
      const { name, description, price, category } = request.payload;
      
      // Manual validation untuk field required
      if (!name || name.trim() === '') {
        return h.response({
          success: false,
          message: 'Name is required'
        }).code(400);
      }
      
      if (!description || description.trim() === '') {
        return h.response({
          success: false,
          message: 'Description is required'
        }).code(400);
      }
      
      if (!price || price === '') {
        return h.response({
          success: false,
          message: 'Price is required'
        }).code(400);
      }

      if (!category || category.trim() === '') {
        return h.response({
          success: false,
          message: 'Category is required'
        }).code(400);
      }

      // Validate field lengths and values
      if (name.length < 3 || name.length > 100) {
        return h.response({
          success: false,
          message: 'Name must be between 3 and 100 characters'
        }).code(400);
      }

      if (description.length < 10 || description.length > 500) {
        return h.response({
          success: false,
          message: 'Description must be between 10 and 500 characters'
        }).code(400);
      }

      const numPrice = parseInt(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return h.response({
          success: false,
          message: 'Price must be a positive number'
        }).code(400);
      }

      // TAMBAHAN: Validate category
      const validCategories = ['kaos', 'fullset', 'kemeja', 'hoodie'];
      if (!validCategories.includes(category.toLowerCase())) {
        return h.response({
          success: false,
          message: 'Category must be one of: kaos, fullset, kemeja, hoodie'
        }).code(400);
      }

      let imageData = null;
      
      // Handle image upload jika ada
      if (request.payload.image) {
        const file = request.payload.image;
        console.log('Image file received:', file.hapi?.filename, file.hapi?.headers);
        
        // Check if it's actually a file
        if (!file.hapi || !file.hapi.filename) {
          return h.response({
            success: false,
            message: 'Invalid image file'
          }).code(400);
        }

        const fileName = `product_${Date.now()}_${file.hapi.filename}`;
        
        const uploadResult = await imageService.uploadImage(file, fileName);
        if (!uploadResult.success) {
          return h.response({
            success: false,
            message: 'Failed to upload image: ' + uploadResult.error
          }).code(500);
        }
        
        imageData = uploadResult.data;
      }

      // Siapkan data produk
      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        category: category.toLowerCase(),
        imageUrl: imageData ? imageData.url : null,
        imageFileId: imageData ? imageData.fileId : null
      };

      const result = await productService.createProduct(productData);

      if (!result.success) {
        // Hapus gambar jika gagal create product
        if (imageData) {
          await imageService.deleteImage(imageData.fileId);
        }
        
        return h.response({
          success: false,
          message: result.error
        }).code(500);
      }

      return h.response({
        success: true,
        message: 'Product created successfully',
        data: result.data
      }).code(201);
    } catch (error) {
      console.error('Create product controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  async updateProduct(request, h) {
    try {
      const { id } = request.params;
      console.log('Update payload:', request.payload); // Debug log
      
      // Cek apakah produk exists
      const existingProduct = await productService.getProductById(id);
      if (!existingProduct.success) {
        return h.response({
          success: false,
          message: 'Product not found'
        }).code(404);
      }

      // Extract fields from payload
      const { name, description, price, category} = request.payload;
      const updateData = {};

      // Validate and add fields to update if provided
      if (name !== undefined) {
        if (!name || name.trim() === '' || name.length < 3 || name.length > 100) {
          return h.response({
            success: false,
            message: 'Name must be between 3 and 100 characters'
          }).code(400);
        }
        updateData.name = name.trim();
      }

      if (description !== undefined) {
        if (!description || description.trim() === '' || description.length < 10 || description.length > 500) {
          return h.response({
            success: false,
            message: 'Description must be between 10 and 500 characters'
          }).code(400);
        }
        updateData.description = description.trim();
      }

      if (price !== undefined) {
        const numPrice = parseInt(price);
        if (isNaN(numPrice) || numPrice <= 0) {
          return h.response({
            success: false,
            message: 'Price must be a positive number'
          }).code(400);
        }
        updateData.price = numPrice;
      }

      // TAMBAHAN: Validate category if provided
      if (category !== undefined) {
        const validCategories = ['kaos', 'fullset', 'kemeja', 'hoodie'];
        if (!category || !validCategories.includes(category.toLowerCase())) {
          return h.response({
            success: false,
            message: 'Category must be one of: kaos, fullset, kemeja, hoodie'
          }).code(400);
        }
        updateData.category = category.toLowerCase();
      }

      let imageData = null;
      let oldImageFileId = existingProduct.data.imageFileId;

      // Handle image upload jika ada
      if (request.payload.image) {
        const file = request.payload.image;
        console.log('Update image file received:', file.hapi?.filename);
        
        // Check if it's actually a file
        if (!file.hapi || !file.hapi.filename) {
          return h.response({
            success: false,
            message: 'Invalid image file'
          }).code(400);
        }

        const fileName = `product_${Date.now()}_${file.hapi.filename}`;
        
        const uploadResult = await imageService.uploadImage(file, fileName);
        if (!uploadResult.success) {
          return h.response({
            success: false,
            message: 'Failed to upload image: ' + uploadResult.error
          }).code(500);
        }
        
        imageData = uploadResult.data;
        updateData.imageUrl = imageData.url;
        updateData.imageFileId = imageData.fileId;
      }

      const result = await productService.updateProduct(id, updateData);

      if (!result.success) {
        // Hapus gambar baru jika gagal update
        if (imageData) {
          await imageService.deleteImage(imageData.fileId);
        }
        
        return h.response({
          success: false,
          message: result.error
        }).code(500);
      }

      // Hapus gambar lama jika ada gambar baru
      if (imageData && oldImageFileId) {
        await imageService.deleteImage(oldImageFileId);
      }

      return h.response({
        success: true,
        message: 'Product updated successfully',
        data: result.data
      }).code(200);
    } catch (error) {
      console.error('Update product controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  async deleteProduct(request, h) {
    try {
      const { id } = request.params;

      // Cek apakah produk exists dan dapatkan data gambar
      const existingProduct = await productService.getProductById(id);
      if (!existingProduct.success) {
        return h.response({
          success: false,
          message: 'Product not found'
        }).code(404);
      }

      const result = await productService.deleteProduct(id);

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(500);
      }

      // Hapus gambar dari ImageKit jika ada
      if (existingProduct.data.imageFileId) {
        await imageService.deleteImage(existingProduct.data.imageFileId);
      }

      return h.response({
        success: true,
        message: 'Product deleted successfully'
      }).code(200);
    } catch (error) {
      console.error('Delete product controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }
}

module.exports = new ProductController();