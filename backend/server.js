require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./config/db");
const jwt = require("jsonwebtoken");
const app = express();
const auth = require("./middleware/auth");
console.log("AUTH:", auth);
console.log("TYPE:", typeof auth);
  console.log(require.resolve("./middleware/auth"));

// Middleware
app.use(cors());
app.use(express.json());

// Home Route
app.get("/", (req, res) => {
  res.json({
    message: "Cryptoholic Backend Running 🚀",
  });
});

// Database Test Route
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.status(200).json({
      success: true,
      message: "Database connected successfully ✅",
      timestamp: result.rows[0].now,
    });
  } catch (err) {
    console.error("Database Error:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Register User
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users(username, email, password)
       VALUES($1, $2, $3)
       RETURNING id, username, email, rc_balance`,
      [username, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
//Auth Middleware
app.get("/api/user/profile", auth, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, username, email, rc_balance FROM users WHERE id = $1",
      [req.user]
    );

    res.json(user.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});
// Buy Coin
app.post("/api/trade/buy", auth, async (req, res) => {
  try {
    const { coinId, coinName, price, amount } = req.body;

    const user = await pool.query(
      "SELECT rc_balance FROM users WHERE id = $1",
      [req.user]
    );

    if (user.rows[0].rc_balance < amount) {
      return res.status(400).json({
        message: "Insufficient RC Balance",
      });
    }

    const quantity = amount / price;

    await pool.query(
      "UPDATE users SET rc_balance = rc_balance - $1 WHERE id = $2",
      [amount, req.user]
    );

    await pool.query(
      `INSERT INTO portfolio(user_id, coin_id, quantity)
       VALUES($1,$2,$3)`,
      [req.user, coinId, quantity]
    );

    await pool.query(
      `INSERT INTO transactions
      (user_id, coin_id, transaction_type, quantity, price)
      VALUES($1,$2,'BUY',$3,$4)`,
      [req.user, coinId, quantity, price]
    );

    res.json({
      success: true,
      message: "Coin Purchased",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server Error",
    });
  }
});
// portfolio route
app.get("/api/portfolio", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        coin_id, 
        SUM(quantity) AS quantity 
      FROM portfolio 
      WHERE user_id = $1 
      GROUP BY coin_id
      `,
      [req.user]
    );

    if (result.rows.length === 0) {
      return res.json([]);
    }

    // 1. Create a comma-separated list of IDs: "bitcoin,ethereum,cardano"
    const coinIds = result.rows.map(row => row.coin_id).join(',');

    // 2. Fetch ALL prices in a single API call
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko Bulk API responded with status ${response.status}`);
    }

    const priceData = await response.json(); 
    // priceData looks like: { bitcoin: { usd: 65000 }, ethereum: { usd: 3500 } }

    // 3. Map your database results cleanly against the bulk price data
    const portfolio = result.rows.map(coin => {
      return {
        coin_id: coin.coin_id,
        quantity: coin.quantity,
        // Fallback to 0 if the coin doesn't exist in the API response
        current_price: priceData[coin.coin_id]?.usd || 0 
      };
    });

    res.json(portfolio);

  } catch (error) {
    console.error("PORTFOLIO ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
});
//sell coin route
app.post("/api/trade/sell", auth, async (req, res) => {
  try {
    const { coinId, quantity, currentPrice } = req.body;

    const holding = await pool.query(
      `SELECT * FROM portfolio
       WHERE user_id = $1 AND coin_id = $2`,
      [req.user, coinId]
    );

    if (holding.rows.length === 0) {
      return res.status(400).json({
        message: "You don't own this coin",
      });
    }

    const ownedQuantity = Number(holding.rows[0].quantity);

    if (quantity > ownedQuantity) {
      return res.status(400).json({
        message: "Insufficient coin balance",
      });
    }

    const sellValue = quantity * currentPrice;

    const remaining = ownedQuantity - quantity;

    if (remaining <= 0) {
      await pool.query(
        `DELETE FROM portfolio
         WHERE user_id = $1 AND coin_id = $2`,
        [req.user, coinId]
      );
    } else {
      await pool.query(
        `UPDATE portfolio
         SET quantity = $1
         WHERE user_id = $2 AND coin_id = $3`,
        [remaining, req.user, coinId]
      );
    }

    await pool.query(
      `UPDATE users
       SET rc_balance = rc_balance + $1
       WHERE id = $2`,
      [sellValue, req.user]
    );

    await pool.query(
      `INSERT INTO transactions
      (user_id, coin_id, transaction_type, quantity, price)
      VALUES($1,$2,'SELL',$3,$4)`,
      [req.user, coinId, quantity, currentPrice]
    );

    res.json({
      success: true,
      message: "Coin sold successfully",
      received: sellValue,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});
//Login User
console.log("LOGIN ROUTE REGISTERED");
app.post("/api/auth/login", async (req, res) => {
  console.log("LOGIN ROUTE HIT");
  console.log(req.body);

  try {
    // existing code
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user.rows[0].id,
      },
      "secretkey",
      {
        expiresIn: "1d",
      }
    );

    res.json({
      success: true,
      token,
      username: user.rows[0].username,
      rc_balance: user.rows[0].rc_balance,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});
// Transaction History Route
app.get("/api/transactions", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        coin_id,
        transaction_type,
        quantity,
        price,
        created_at
      FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [req.user]
    );

    res.json({
      success: true,
      transactions: result.rows,
    });
  } catch (error) {
    console.error("Transaction history error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction history",
    });
  }
});
// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});