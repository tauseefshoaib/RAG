import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RAG",
      version: "1.0.0",
      description:
        "Upload a PDF and ask questions using llama3.2 with vector search via Qdrant",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./src/index.js"],
});
