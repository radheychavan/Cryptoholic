import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

function History() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/transactions",
          {
            headers: {
              token: localStorage.getItem("token"),
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load transactions");
        }

        setTransactions(data.transactions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <h1>📜 Transaction History</h1>

        <Link to="/dashboard" className="back-btn">
          Back to Dashboard
        </Link>
      </div>

      {loading && <p className="loading">Loading transactions...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && transactions.length === 0 && (
        <p className="empty-message">No transactions yet.</p>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="table-wrapper">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Coin</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total RC</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction) => {
                const total =
                  Number(transaction.quantity) * Number(transaction.price);

                return (
                  <tr key={transaction.id}>
                    <td
                      className={
                        transaction.transaction_type === "BUY"
                          ? "buy-text"
                          : "sell-text"
                      }
                    >
                      {transaction.transaction_type}
                    </td>

                    <td>{transaction.coin_id.toUpperCase()}</td>

                    <td>{Number(transaction.quantity).toFixed(6)}</td>

                    <td>
                      {Number(transaction.price).toLocaleString()} RC
                    </td>

                    <td>{total.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })} RC</td>

                    <td>
                      {new Date(
                        transaction.created_at
                      ).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;