import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "REST API for a multi-vendor e-commerce platform",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "" },
            data: { nullable: true },
            error: { type: "string", nullable: true, example: null },
            meta: { type: "object", example: {} },
          },
        },
        PaginatedMeta: {
          type: "object",
          properties: {
            total: { type: "integer", example: 100 },
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            totalPages: { type: "integer", example: 5 },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "" },
            data: { nullable: true, example: null },
            error: { type: "string", example: "Error message" },
            meta: { type: "object", example: {} },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication & token management" },
      { name: "Users", description: "User profile & addresses" },
      { name: "Categories", description: "Product categories" },
      { name: "Shops", description: "Shop management" },
      { name: "Products", description: "Product catalog & seller listings" },
      { name: "Cart", description: "Shopping cart" },
      { name: "Orders", description: "Order management" },
      { name: "Payments", description: "Payment recording" },
      { name: "Reviews", description: "Product reviews" },
      { name: "Admin", description: "Admin-only operations" },
    ],
  },
  apis: ["./src/modules/**/*.route.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
