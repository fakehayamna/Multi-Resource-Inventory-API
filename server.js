const express = require("express");
const cors = require("cors");
require("dotenv").config();
const errorHandler = require("./middleware/errorHandler");
const orderRoutes = require("./routes/orderRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const productRoutes = require("./routes/productRoutes");
const { sequelize } = require("./models");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/suppliers", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Multi-Resource Inventory API is running!"
    });
});

const PORT = process.env.PORT || 3000;
// Route not found
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

// Global error handler
app.use(errorHandler);

sequelize.authenticate()
    .then(() => {
        console.log("PostgreSQL Connected Successfully!");

        return sequelize.sync({ alter: true });
    })
    .then(() => {
        console.log("Database Tables Created Successfully!");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database Error:", error.message);
    });