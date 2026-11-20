
const {
    sequelize,
    Order,
    OrderItem,
    Product
} = require("../models");

// CREATE ORDER
exports.createOrder = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { customerName, customerEmail, items } = req.body;

        if (!customerName || !customerEmail ||
            !Array.isArray(items) || items.length === 0) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: "Customer details and order items are required"
            });
        }

        const productQuantities = new Map();

        for (const item of items) {
            const quantity = Number(item.quantity);

            if (!Number.isInteger(quantity) || quantity < 1) {
                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Each product quantity must be a positive integer"
                });
            }

            if (!Number.isInteger(Number(item.productId)) ||
                Number(item.productId) < 1) {
                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Valid productId is required"
                });
            }

            const id = Number(item.productId);

            productQuantities.set(
                id,
                (productQuantities.get(id) || 0) + quantity
            );
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const [productId, quantity] of productQuantities) {
            const product = await Product.findByPk(productId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!product) {
                throw new Error(`Product ${productId} not found`);
            }

            if (product.quantity < quantity) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }

            const unitPrice = Number(product.price);
            const subtotal = Math.round(unitPrice * 100) * quantity / 100;

            totalAmount += subtotal;

            await product.decrement("quantity", {
                by: quantity,
                transaction
            });

            orderItems.push({
                productId,
                quantity,
                unitPrice,
                subtotal
            });
        }

        totalAmount = Math.round(totalAmount * 100) / 100;

        const order = await Order.create({
            customerName,
            customerEmail,
            totalAmount,
            status: "pending"
        }, { transaction });

        for (const item of orderItems) {
            await OrderItem.create({
                ...item,
                orderId: order.id
            }, { transaction });
        }

        await transaction.commit();

        const createdOrder = await Order.findByPk(order.id, {
            include: [{
                model: OrderItem,
                include: [Product]
            }]
        });

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: createdOrder
        });

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET ALL ORDERS

exports.getAllOrders = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 10, 1),
            100
        );

        const offset = (page - 1) * limit;

        const { status, search, sortBy, order } = req.query;

        const where = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            const { Op } = require("sequelize");

            where.customerName = {
                [Op.iLike]: `%${search}%`
            };
        }

        const allowedSortFields = [
            "id", "customerName", "totalAmount",
            "status", "createdAt"
        ];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

        const sortOrder = order?.toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";

        const { count, rows } = await Order.findAndCountAll({
            where,
            include: [{
                model: OrderItem,
                include: [Product]
            }],
            distinct: true,
            limit,
            offset,
            order: [[sortField, sortOrder]]
        });

        res.status(200).json({
            success: true,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            data: rows
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// GET SINGLE ORDER
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{
                model: OrderItem,
                include: [Product]
            }]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// UPDATE ORDER
exports.updateOrder = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const order = await Order.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!order) {
            await transaction.rollback();

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const allowedStatuses = [
            "pending",
            "processing",
            "completed",
            "cancelled"
        ];

        const newStatus = req.body.status ?? order.status;

        if (!allowedStatuses.includes(newStatus)) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const items = await OrderItem.findAll({
            where: { orderId: order.id },
            transaction
        });

        // Cancel order: restore stock
        if (order.status !== "cancelled" && newStatus === "cancelled") {
            for (const item of items) {
                const product = await Product.findByPk(item.productId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (product) {
                    await product.increment("quantity", {
                        by: item.quantity,
                        transaction
                    });
                }
            }
        }

        // Reactivate cancelled order: reserve stock again
        if (order.status === "cancelled" && newStatus !== "cancelled") {
            for (const item of items) {
                const product = await Product.findByPk(item.productId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (!product || product.quantity < item.quantity) {
                    throw new Error(
                        `Insufficient stock for product ${item.productId}`
                    );
                }

                await product.decrement("quantity", {
                    by: item.quantity,
                    transaction
                });
            }
        }

        await order.update({
            customerName: req.body.customerName ?? order.customerName,
            customerEmail: req.body.customerEmail ?? order.customerEmail,
            status: newStatus
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: "Order updated successfully",
            data: order
        });

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// DELETE ORDER
exports.deleteOrder = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const order = await Order.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!order) {
            await transaction.rollback();

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const items = await OrderItem.findAll({
            where: { orderId: order.id },
            transaction
        });

        // Restore stock if order was not already cancelled
        if (order.status !== "cancelled") {
            for (const item of items) {
                const product = await Product.findByPk(item.productId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (product) {
                    await product.increment("quantity", {
                        by: item.quantity,
                        transaction
                    });
                }
            }
        }

        await OrderItem.destroy({
            where: { orderId: order.id },
            transaction
        });

        await order.destroy({ transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: "Order deleted and stock restored successfully"
        });

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
