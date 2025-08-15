// Helper untuk standardize response format
class ResponseHelper {
  static success(h, data, message = 'Success', code = 200) {
    const response = {
      success: true,
      message: message
    };

    if (data !== null && data !== undefined) {
      if (Array.isArray(data)) {
        response.data = data;
        response.total = data.length;
      } else {
        response.data = data;
      }
    }

    return h.response(response).code(code);
  }

  static error(h, message = 'Internal Server Error', code = 500, errors = null) {
    const response = {
      success: false,
      message: message
    };

    if (errors) {
      response.errors = errors;
    }

    return h.response(response).code(code);
  }

  static validationError(h, error) {
    return h.response({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    }).code(400);
  }

  static unauthorized(h, message = 'Unauthorized') {
    return h.response({
      success: false,
      message: message
    }).code(401);
  }

  static forbidden(h, message = 'Forbidden') {
    return h.response({
      success: false,
      message: message
    }).code(403);
  }

  static notFound(h, message = 'Not found') {
    return h.response({
      success: false,
      message: message
    }).code(404);
  }
}

module.exports = ResponseHelper;