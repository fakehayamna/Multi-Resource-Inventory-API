
const errorHandler = (err, req, res, next) => {
    console.error("API Error:", err.message);

    // Invalid JSON
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON format"
        });
    }

    // Sequelize validation error
    if (err.name === "SequelizeValidationError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: err.errors.map(error => error.message)
        });
    }

    // Duplicate value error
    if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
            success: false,
            message: "This record already exists"
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
};

module.exports = errorHandler;
