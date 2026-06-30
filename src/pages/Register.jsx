import { useState } from "react";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
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

  const username = formData.username.trim();
  const email = formData.email.trim();
  const password = formData.password;

  if (username.length < 3) {
    alert("Username must be at least 3 characters");
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    alert("Username can only contain letters, numbers, and underscore");
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    alert("Enter a valid email address");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    alert("Account created successfully! You received 10,000 RC.");

    window.location.href = "/";
  } catch (error) {
    alert(error.message);
  }
};

  return (
    <div className="auth-container">
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit}>
       <input
  type="text"
  name="username"
  placeholder="Username (minimum 3 characters)"
  value={formData.username}
  onChange={handleChange}
  minLength="3"
  pattern="[A-Za-z0-9_]+"
  required
/>

<input
  type="email"
  name="email"
  placeholder="Email"
  value={formData.email}
  onChange={handleChange}
  required
/>

<input
  type="password"
  name="password"
  placeholder="Password (minimum 6 characters)"
  value={formData.password}
  onChange={handleChange}
  minLength="6"
  required
/>
        <button type="submit">Register</button>
        <p>
  Already have an account?
  <a href="/"> Login</a>
</p>
      </form>
    </div>
  );
}

export default Register;