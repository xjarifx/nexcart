import app from "./app.js";

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("|==================================================|");
  console.log(`| Server running at http://localhost:${PORT}          |`);
  console.log(`| Swagger docs at http://localhost:${PORT}/api-docs   |`);
  console.log("|==================================================|");
});
