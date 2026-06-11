import { useEffect, useState } from "react";
import "./App.css";
import CryptoCard from "./components/CryptoCard.jsx";
import SearchBar from "./components/SearchBar.jsx";

function App() {
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchCoins = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch crypto data");
      }

      const data = await response.json();

      setCoins(data);
      setFilteredCoins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, []);

  useEffect(() => {
    const result = coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(search.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredCoins(result);
  }, [search, coins]);

  return (
    <div className="container">
      <h1>🚀 Crypto Dashboard</h1>

      <div className="controls">
        <SearchBar search={search} setSearch={setSearch} />

        <button onClick={fetchCoins} className="refresh-btn">
          Refresh
        </button>
      </div>

      {loading && <p className="loading">Loading crypto data...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="grid">
          {filteredCoins.map((coin) => (
            <CryptoCard key={coin.id} coin={coin} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;