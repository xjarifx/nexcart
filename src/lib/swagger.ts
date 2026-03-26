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
