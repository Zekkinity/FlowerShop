const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Get frontend files
app.use(express.static(path.join(__dirname, "public")));

// Start server
app.listen(3001, () => {
    console.log("Server running on port 3001");
});

// Create MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "appuser",
    password: "btbt", // NOTE: Dont expose password at the end, doesnt matter right now
    database: "mydb"
});

/*
  Connect to database
*/
db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
        return;
    }

    console.log("Connected to MySQL!");
});



// Get all flowers
app.get("/flowers", (req, res) => {
    const sql = "SELECT * FROM flowers";

    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json(err);
            return;
        }

        res.json(results);
    });
});

// Change flower name
app.put("/flowers/:id/name", (req, res) => {
    try {
        const flowerID = req.params.id;
        const rawString = req.body.name;
        if (rawString == "") {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty."
            })
        }

        // Validate input
        if (typeof rawString !== "string") {
            return res.status(400).json({
                success: false,
                message: "Stock cant be an integer."
            })
        }

        // MariaDB CHAR MAX
        const CHAR_MAX = 100;

        // CHAR MAX
        if (rawString.length > CHAR_MAX) {
            return res.status(400).json({
                success: false,
                message: "Exceeds CHAR MAX."
            })
        }

        db.query(
            "UPDATE flowers SET name = ? WHERE id = ?",
            [rawString, flowerID]
        )

        res.json({
            success: true,
            message: "Flower name updated."
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Database error."
        });
    }
});


// Change flower quantity
app.put("/flowers/:id/stock_quantity", (req, res) => {
    try {
        const flowerID = req.params.id;
        const rawStock = req.body.stock_quantity;
        if (rawStock == "") {
            return res.status(400).json({
                success: false,
                message: "Stock cannot be empty."
            })
        }

        const newStock = Number(rawStock);

        // Validate input
        if (!Number.isInteger(newStock)) {
            return res.status(400).json({
                success: false,
                message: "Stock must be an integer."
            })
        }

        // MariaDB INT MAX
        const INT_MAX = 2147483647;

        // INT MAX
        if (newStock > INT_MAX) {
            return res.status(400).json({
                success: false,
                message: "Stock exceeds INT MAX."
            })
        }

        // Prevent negatives
        if (newStock < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock cannot be negative."
            })
        }

        db.query(
            "UPDATE flowers SET stock_quantity = ? WHERE id = ?",
            [newStock, flowerID]
        )

        res.json({
            success: true,
            message: "Flower stock updated."
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Database error."
        });
    }
});

// Change flower price
app.put("/flowers/:id/price", (req, res) => {
    try {
        const flowerID = req.params.id;
        const rawPrice = req.body.price;
        if (rawPrice == "") {
            return res.status(400).json({
                success: false,
                message: "Stock cannot be empty."
            })
        }

        const newPrice = Number(rawPrice);

        // Validate input
        if (!Number.isInteger(newPrice)) {
            return res.status(400).json({
                success: false,
                message: "Stock must be an integer."
            })
        }

        // MariaDB INT MAX
        const INT_MAX = 2147483647;

        // INT MAX
        if (newPrice > INT_MAX) {
            return res.status(400).json({
                success: false,
                message: "Stock exceeds INT MAX."
            })
        }

        // Prevent negatives
        if (newPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock cannot be negative."
            })
        }

        db.query(
            "UPDATE flowers SET price = ? WHERE id = ?",
            [newPrice, flowerID]
        )

        res.json({
            success: true,
            message: "Flower stock updated."
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Database error."
        });
    }
});

// Insert into DB
app.post("/flowers", (req, res) => {

    const {
        name,
        stock_quantity,
        price
    } = req.body;

    db.query(
        `
        INSERT INTO flowers
        (name, stock_quantity, price)

        VALUES (?, ?, ?)
        `,
        [
            name,
            stock_quantity,
            price
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false
                });
            }

            res.json({
                success: true
            });
        }
    );
});

// Delete from DB
app.delete("/flowers/:id", (req, res) => {
    db.query(
        "DELETE FROM flowers WHERE id = ?",
        [req.params.id],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                success: true
            });
        }
    );
});
