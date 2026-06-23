import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:3000/api/portfolio",
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load portfolio");
      }

      setPortfolio(data.portfolio || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const sellCoin = async (coin) => {
    const quantity = prompt(
      `How much ${coin.coin_id.toUpperCase()} do you want to sell?\nYou own: ${Number(
        coin.quantity
      ).toFixed(6)}`
    );

    if (!quantity) return;

    const sellQuantity = Number(quantity);

    if (sellQuantity <= 0) {
      alert("Enter a valid quantity");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/trade/sell",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token"),
          },
          body: JSON.stringify({
            coinId: coin.coin_id,
            quantity: sellQuantity,
            currentPrice: coin.current_price,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Sell failed");
      }

      alert(`Sold successfully. Received ${Number(data.received).toFixed(2)} RC`);

      fetchPortfolio();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatRC = (value) => {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalInvested = portfolio.reduce(
    (total, coin) => total + Number(coin.invested_amount || 0),
    0
  );

  const totalCurrentValue = portfolio.reduce(
    (total, coin) => total + Number(coin.current_value || 0),
    0
  );

  const totalProfitLoss = totalCurrentValue - totalInvested;

  const totalProfitLossPercentage =
    totalInvested > 0
      ? (totalProfitLoss / totalInvested) * 100
      : 0;

  if (loading) {
    return <h2 className="loading">Loading portfolio...</h2>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <Link to="/dashboard" className="back-btn">
          ← Back to Dashboard
        </Link>

        <h1>📊 My Portfolio</h1>
      </div>

      {error && <p className="error">{error}</p>}

      {!error && portfolio.length === 0 && (
        <p className="empty-message">No investments yet.</p>
      )}

      {!error && portfolio.length > 0 && (
        <>
          <div className="portfolio-summary">
            <div className="summary-card">
              <p>Total Invested</p>
              <h2>{formatRC(totalInvested)} RC</h2>
            </div>

            <div className="summary-card">
              <p>Current Value</p>
              <h2>{formatRC(totalCurrentValue)} RC</h2>
            </div>

            <div
              className={`summary-card ${
                totalProfitLoss >= 0 ? "profit-card" : "loss-card"
              }`}
            >
              <p>Total Profit / Loss</p>

              <h2>
                {totalProfitLoss >= 0 ? "+" : ""}
                {formatRC(totalProfitLoss)} RC
              </h2>

              <span>
                {totalProfitLossPercentage >= 0 ? "+" : ""}
                {totalProfitLossPercentage.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Quantity</th>
                  <th>Invested</th>
                  <th>Current Price</th>
                  <th>Current Value</th>
                  <th>Profit / Loss</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {portfolio.map((coin) => {
                  const isProfit = Number(coin.profit_loss) >= 0;

                  return (
                    <tr key={coin.coin_id}>
                      <td>{coin.coin_id.toUpperCase()}</td>

                      <td>{Number(coin.quantity).toFixed(6)}</td>

                      <td>{formatRC(coin.invested_amount)} RC</td>

                      <td>{formatRC(coin.current_price)} RC</td>

                      <td>{formatRC(coin.current_value)} RC</td>

                      <td className={isProfit ? "buy-text" : "sell-text"}>
                        {isProfit ? "+" : ""}
                        {formatRC(coin.profit_loss)} RC
                        <br />

                        <small>
                          {isProfit ? "+" : ""}
                          {Number(coin.profit_loss_percentage).toFixed(2)}%
                        </small>
                      </td>

                      <td>
                        <button
                          className="sell-btn"
                          onClick={() => sellCoin(coin)}
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Portfolio;