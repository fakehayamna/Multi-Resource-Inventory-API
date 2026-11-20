
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define("Order", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    customerName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    customerEmail: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    status: {
        type: DataTypes.ENUM(
            "pending",
            "processing",
            "completed",
            "cancelled"
        ),
        defaultValue: "pending"
    },
    totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    }
}, {
    timestamps: true
});

module.exports = Order;
