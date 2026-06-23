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
// Portfolio Route with Profit / Loss
app.get("/api/portfolio", auth, async (req, res) => {
  try {
    // Get all coins currently owned by this user
    const holdingsResult = await pool.query(
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

    if (holdingsResult.rows.length === 0) {
      return res.json({
        success: true,
        portfolio: [],
      });
    }

    // Example: bitcoin,ethereum,solana
    const coinIds = holdingsResult.rows
      .map((row) => row.coin_id)
      .join(",");

    // Get all live prices in one CoinGecko request
    const priceResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`
    );

    if (!priceResponse.ok) {
      throw new Error("Failed to fetch live crypto prices");
    }

    const priceData = await priceResponse.json();

    const portfolio = [];

    for (const holding of holdingsResult.rows) {
      const coinId = holding.coin_id;
      const quantity = Number(holding.quantity);

      /*
        Total money spent on BUY transactions for this coin.

        Note:
        This is basic unrealized P/L.
        If the user partially sells a coin, this invested amount still includes
        all past buys. We will improve that later using average-cost logic.
      */
      const investmentResult = await pool.query(
        `
        SELECT COALESCE(SUM(quantity * price), 0) AS invested_amount
        FROM transactions
        WHERE user_id = $1
          AND coin_id = $2
          AND transaction_type = 'BUY'
        `,
        [req.user, coinId]
      );

      const investedAmount = Number(
        investmentResult.rows[0].invested_amount
      );

      const currentPrice = Number(priceData[coinId]?.usd || 0);

      const currentValue = quantity * currentPrice;

      const profitLoss = currentValue - investedAmount;

      const profitLossPercentage =
        investedAmount > 0
          ? (profitLoss / investedAmount) * 100
          : 0;

      portfolio.push({
        coin_id: coinId,
        quantity,
        invested_amount: investedAmount,
        current_price: currentPrice,
        current_value: currentValue,
        profit_loss: profitLoss,
        profit_loss_percentage: profitLossPercentage,
      });
    }

    res.json({
      success: true,
      portfolio,
    });
  } catch (error) {
    console.error("PORTFOLIO ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to load portfolio",
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