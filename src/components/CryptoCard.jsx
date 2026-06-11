function CryptoCard({ coin }) {
  return (
    <div className="card">
      <img src={coin.image} alt={coin.name} />

      <h2>{coin.name}</h2>

      <p className="symbol">{coin.symbol.toUpperCase()}</p>

      <p>
        Price: <strong>${coin.current_price.toLocaleString()}</strong>
      </p>

      <p>
        Market Cap:
        <strong>
          ${coin.market_cap.toLocaleString()}
        </strong>
      </p>

     <p
  className={
    coin.price_change_percentage_24h == null
      ? ""
      : coin.price_change_percentage_24h >= 0
      ? "positive"
      : "negative"
  }
>
  {coin.price_change_percentage_24h == null
    ? "N/A"
    : `${coin.price_change_percentage_24h.toFixed(2)}%`}
</p>
    </div>
  );
}

export default CryptoCard;