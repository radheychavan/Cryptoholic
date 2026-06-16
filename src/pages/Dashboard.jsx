import { useEffect, useState } from "react";
import "../App.css";
import SearchBar from "../components/SearchBar";
import CryptoCard from "../components/CryptoCard";

function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/user/profile",
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      const data = await response.json();
      setUser(data);
    } catch (err) {
      console.error("User fetch error:", err);
    }
  };

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
    fetchUser();
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ color: "red" }}>
            Welcome {user?.username || "Loading..."}
          </h2>

          <h3 style={{ color: "yellow" }}>
            RC Balance: {user?.rc_balance || "0"}
          </h3>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => (window.location.href = "/portfolio")}
          >
            Portfolio
          </button>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>
      </div>

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

export default Dashboard;