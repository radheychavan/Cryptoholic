function CryptoCard({ coin }) {
  const buyCoin = async (coin) => {
  const amount = prompt(
    `How many RC do you want to invest in ${coin.name}?`
  );

  if (!amount) return;

  await fetch("http://localhost:3000/api/trade/buy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: localStorage.getItem("token"),
    },
    body: JSON.stringify({
      coinId: coin.id,
      coinName: coin.name,
      price: coin.current_price,
      amount: Number(amount),
    }),
  });

  alert("Purchase Successful");
};
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
<button onClick={() => buyCoin(coin)}>
  Buy
</button>

    </div>
  );
}

export default CryptoCard;