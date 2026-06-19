import { useEffect, useState } from "react";

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/portfolio",
          {
            headers: {
              token: localStorage.getItem("token"),
            },
          }
        );

        const data = await response.json();
        console.log("Portfolio Response:", data);
        alert(JSON.stringify(data));
setPortfolio(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  if (loading) {
    return <h2>Loading Portfolio...</h2>;
  }
const sellCoin = async (coin) => {
  const quantity = prompt(
    `How much ${coin.coin_id} do you want to sell?`
  );

  if (!quantity) return;

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
          quantity: Number(quantity),
          currentPrice: coin.current_price,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    alert(
      `Sold successfully. Received ${data.received.toFixed(
        2
      )} RC`
    );

    window.location.reload();
  } catch (error) {
    alert(error.message);
  }
};

  return (
    
  <div className="portfolio-container">
    <button
  className="back-btn"
  onClick={() => (window.location.href = "/dashboard")}
>
  ← Back to Dashboard
</button>
    <h1 className="portfolio-title">📊 My Portfolio</h1>

    {portfolio.length === 0 ? (
      <h3>No investments yet</h3>
    ) : (
      <table className="portfolio-table">
        <thead>
          <tr>
            <th>Coin</th>
            <th>Quantity</th>
            <th>Current Price</th>
            <th>Total Value</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {portfolio.map((coin) => (
            <tr key={coin.coin_id}>
              <td>{coin.coin_id.toUpperCase()}</td>

              <td>
                {Number(coin.quantity).toFixed(6)}
              </td>

              <td>
                $
                {Number(
                  coin.current_price
                ).toLocaleString()}
              </td>

              <td className="value-cell">
                $
                {(
                  Number(coin.quantity) *
                  Number(coin.current_price)
                ).toFixed(2)}
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
            
          ))}
        </tbody>
      </table>
    )}
  </div>
);
}

export default Portfolio;