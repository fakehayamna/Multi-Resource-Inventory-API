# Multi-Resource Inventory API

A RESTful backend API for managing products, suppliers, and customer orders. This project is developed using Node.js, Express.js, PostgreSQL, and Sequelize ORM.

## Project Overview

The Multi-Resource Inventory API provides a structured solution for managing inventory operations. It supports product and supplier management, order processing, stock updates, and database relationships.

## Technologies Used

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- Postman
- Git & GitHub

## Features

- Complete CRUD operations for Products, Suppliers, and Orders.
- Relational database associations.
- Multiple products in a single order.
- Automatic stock deduction when an order is created.
- Stock restoration when an order is cancelled or deleted.
- Pagination, filtering, searching, and sorting.
- Input validation and centralized error handling.
- Database transactions for order-related operations.

## Project Structure

```text
Multi-Resource-Inventory-API/
│
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── Multi-Resource-Inventory-API.postman_collection.json
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/fakehayamna/Multi-Resource-Inventory-API.git
```

### 2. Navigate to the Project Folder

```bash
cd Multi-Resource-Inventory-API
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory and add your PostgreSQL database credentials.

```env
PORT=3000
DB_NAME=inventory_management_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
```

Replace the database username and password with your own PostgreSQL credentials.

### 5. Start the Server

```bash
npm start
```

If a start script is not configured, use:

```bash
node server.js
```

## API Resources

| Resource | Operations |
|---|---|
| Suppliers | Create, Read, Update, Delete |
| Products | Create, Read, Update, Delete |
| Orders | Create, Read, Update, Delete |

## API Testing

The API endpoints were tested using Postman.

The exported Postman collection is included in this repository:

`Multi-Resource-Inventory-API.postman_collection.json`

Import this file into Postman to test the available API requests.

## Database Relationships

- One Supplier can have multiple Products.
- One Product belongs to one Supplier.
- One Order can contain multiple Products.
- Products and Orders are connected through OrderItem.

## Error Handling and Validation

The API handles invalid requests, missing required fields, duplicate supplier emails, insufficient stock, invalid IDs, and records that do not exist.

## Author

**Fakeha Yamna Siddiqui**

## GitHub Repository

https://github.com/fakehayamna/Multi-Resource-Inventory-API

## Project Status

Completed
