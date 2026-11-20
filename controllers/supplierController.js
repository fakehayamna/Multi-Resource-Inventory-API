
const { Supplier } = require("../models");

// CREATE SUPPLIER
exports.createSupplier = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: "Name, email and phone are required"
            });
        }

        const supplier = await Supplier.create({
            name,
            email,
            phone,
            address
        });

        res.status(201).json({
            success: true,
            message: "Supplier created successfully",
            data: supplier
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.name === "SequelizeUniqueConstraintError"
                ? "Email already exists"
                : error.message
        });
    }
};


// GET ALL SUPPLIERS

exports.getAllSuppliers = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 10, 1),
            100
        );

        const offset = (page - 1) * limit;
        const { search, sortBy, order } = req.query;

        const where = {};

        if (search) {
            const { Op } = require("sequelize");

            where.name = {
                [Op.iLike]: `%${search}%`
            };
        }

        const allowedSortFields = [
            "id", "name", "email", "createdAt"
        ];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

        const sortOrder = order?.toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";

        const { count, rows } = await Supplier.findAndCountAll({
            where,
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


// GET SINGLE SUPPLIER
exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.status(200).json({
            success: true,
            data: supplier
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// UPDATE SUPPLIER
exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        const { name, email, phone, address } = req.body;

        await supplier.update({
            name: name ?? supplier.name,
            email: email ?? supplier.email,
            phone: phone ?? supplier.phone,
            address: address ?? supplier.address
        });

        res.status(200).json({
            success: true,
            message: "Supplier updated successfully",
            data: supplier
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// DELETE SUPPLIER
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        await supplier.destroy();

        res.status(200).json({
            success: true,
            message: "Supplier deleted successfully"
        });

    } catch (error) {
        res.status(409).json({
            success: false,
            message: "Supplier cannot be deleted because products are linked to it"
        });
    }
};
