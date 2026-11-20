
const sequelize = require("../config/database");

const Supplier = require("./Supplier");
const Product = require("./Product");
const Order = require("./Order");
const OrderItem = require("./OrderItem");

// Supplier - Product
Supplier.hasMany(Product, {
    foreignKey: "supplierId",
    onDelete: "RESTRICT"
});

Product.belongsTo(Supplier, {
    foreignKey: "supplierId"
});

// Order - OrderItem
Order.hasMany(OrderItem, {
    foreignKey: "orderId",
    onDelete: "CASCADE"
});

OrderItem.belongsTo(Order, {
    foreignKey: "orderId"
});

// Product - OrderItem
Product.hasMany(OrderItem, {
    foreignKey: "productId",
    onDelete: "RESTRICT"
});

OrderItem.belongsTo(Product, {
    foreignKey: "productId"
});

module.exports = {
    sequelize,
    Supplier,
    Product,
    Order,
    OrderItem
};
