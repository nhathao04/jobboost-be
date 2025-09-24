const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "JobBoost API",
      version: "1.0.0",
      description: "JobBoost API Documentation",
      contact: {
        name: "JobBoost Team",
      },
      servers: [
        {
          url: "http://localhost:5000",
          description: "Development Server",
        },
      ],
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/routes/*.js",
    "./src/models/*.js",
    "./src/config/swagger-definitions.js",
  ], // Đường dẫn đến các file chứa comment swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
  swaggerUi,
  swaggerDocs,
};
