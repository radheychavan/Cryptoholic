import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  const email = formData.email.trim();
  const password = formData.password;

  if (!email.includes("@") || !email.includes(".")) {
    alert("Enter a valid email address");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("rcBalance", data.rc_balance);
    alert("Login successful");

    window.location.href = "/dashboard";
  } catch (error) {
    alert(error.message);
  }
};

  return (
    <div className="auth-container">
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
       <input
  type="email"
  name="email"
  placeholder="Enter Email"
  value={formData.email}
  onChange={handleChange}
  required
/>

<input
  type="password"
  name="password"
  placeholder="Enter Password"
  value={formData.password}
  onChange={handleChange}
  minLength="6"
  required
/>

        <button type="submit">Login</button>
      </form>

      <p>
        Don't have an account?
        <a href="/register"> Register</a>
      </p>
    </div>
  );
}

export default Login;