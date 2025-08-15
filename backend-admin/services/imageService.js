const imagekit = require('../config/imagekit');
const streamToBuffer = require('stream-to-buffer');

class ImageService {
  async uploadImage(file, fileName) {
  try {
      // If `file` is a Readable stream (Hapi.js), convert it to Buffer
      let fileBuffer;
      if (file._data && Buffer.isBuffer(file._data)) {
        fileBuffer = file._data; // Directly use the Buffer if available
      } else if (file.pipe) { // If it's a stream
        fileBuffer = await new Promise((resolve, reject) => {
          const chunks = [];
          file.on('data', (chunk) => chunks.push(chunk));
          file.on('end', () => resolve(Buffer.concat(chunks)));
          file.on('error', reject);
        });
      } else {
        throw new Error('Invalid file format: Expected Buffer or Readable stream');
      }

      const result = await imagekit.upload({
        file: fileBuffer, // Now correctly formatted
        fileName: fileName,
        folder: '/products'
      });

      return {
        success: true,
        data: {
          url: result.url,
          fileId: result.fileId,
          name: result.name
        }
      };
    } catch (error) {
      console.error('ImageKit upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteImage(fileId) {
    try {
      await imagekit.deleteFile(fileId);
      return { success: true };
    } catch (error) {
      console.error('ImageKit delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getImageDetails(fileId) {
    try {
      const result = await imagekit.getFileDetails(fileId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ImageService();