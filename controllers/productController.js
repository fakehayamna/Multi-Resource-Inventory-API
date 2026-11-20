
const { Product, Supplier } = require("../models");

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            sku,
            category,
            description,
            price,
            quantity,
            supplierId
        } = req.body;

        if (!name || !sku || !category || price === undefined || quantity === undefined || !supplierId) {
            return res.status(400).json({
                success: false,
                message: "Name, SKU, category, price, quantity and supplierId are required"
            });
        }

        if (Number(price) < 0 || !Number.isFinite(Number(price)) ||
            !Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
            return res.status(400).json({
                success: false,
                message: "Price and quantity must be valid non-negative numbers"
            });
        }

        const supplier = await Supplier.findByPk(supplierId);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        const product = await Product.create({
            name,
            sku,
            category,
            description,
            price,
            quantity,
            supplierId
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.name === "SequelizeUniqueConstraintError"
                ? "SKU already exists"
                : error.message
        });
    }
};



// GET ALL PRODUCTS WITH PAGINATION, FILTERING & SORTING
exports.getAllProducts = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 10, 1),
            100
        );

        const offset = (page - 1) * limit;

        const { category, supplierId, search, sortBy, order } = req.query;

        const where = {};

        if (category) {
            where.category = category;
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        if (search) {
            const { Op } = require("sequelize");
            where.name = {
                [Op.iLike]: `%${search}%`
            };
        }

        const allowedSortFields = [
            "id", "name", "price", "quantity", "createdAt"
        ];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

        const sortOrder = order?.toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";

        const { count, rows } = await Product.findAndCountAll({
            where,
            include: [{
                model: Supplier,
                attributes: ["id", "name", "email"]
            }],
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


// GET SINGLE PRODUCT
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{
                model: Supplier,
                attributes: ["id", "name", "email"]
            }]
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const allowedFields = [
            "name", "sku", "category", "description",
            "price", "quantity", "supplierId"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (updates.price !== undefined &&
            (!Number.isFinite(Number(updates.price)) || Number(updates.price) < 0)) {
            return res.status(400).json({
                success: false,
                message: "Price must be a non-negative number"
            });
        }

        if (updates.quantity !== undefined &&
            (!Number.isInteger(Number(updates.quantity)) || Number(updates.quantity) < 0)) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a non-negative integer"
            });
        }

        if (updates.supplierId !== undefined) {
            const supplier = await Supplier.findByPk(updates.supplierId);

            if (!supplier) {
                return res.status(404).json({
                    success: false,
                    message: "Supplier not found"
                });
            }
        }

        await product.update(updates);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.name === "SequelizeUniqueConstraintError"
                ? "SKU already exists"
                : error.message
        });
    }
};


// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await product.destroy();

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        res.status(409).json({
            success: false,
            message: "Product cannot be deleted because it is linked to existing orders"
        });
    }
};
