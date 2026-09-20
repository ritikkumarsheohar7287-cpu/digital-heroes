import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [charities, setCharities] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    charityId: "",
    charityPercentage: 10,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getCharities = async () => {
      try {
        const response = await api.get("/charities");
        setCharities(response.data.data);
      } catch (error) {
        console.error(error);
        setMessage("Failed to load charities");
      }
    };

    getCharities();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await api.post("/auth/register", {
        ...formData,
        charityPercentage: Number(
          formData.charityPercentage
        ),
      });

      setMessage(
        response.data.message || "Registration successful"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Register error:", error);

      setMessage(
        error.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-left">
        <div className="register-brand">
          <div className="register-icon">🏌️</div>

          <h1>Digital Heroes</h1>

          <p>
            Play Better. Give Back.
            <br />
            Be a Digital Hero.
          </p>

          <div className="register-benefits">
            <div>✓ Create your Digital Heroes account</div>
            <div>✓ Choose a charity you care about</div>
            <div>✓ Make a positive impact</div>
          </div>
        </div>
      </div>

      <div className="register-right">
        <div className="register-card">
          <div className="register-header">
            <h2>Create Account</h2>

            <p>
              Join Digital Heroes and start making an impact
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="register-input-group">
              <label>Full Name</label>

              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-input-group">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-input-group">
              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                minLength="6"
                required
              />

              <small>Password must be at least 6 characters</small>
            </div>

            <div className="register-input-group">
              <label>Choose Charity</label>

              <select
                name="charityId"
                value={formData.charityId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select a charity
                </option>

                {charities.map((charity) => (
                  <option
                    key={charity.id}
                    value={charity.id}
                  >
                    {charity.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="register-input-group">
              <label>Charity Contribution (%)</label>

              <input
                type="number"
                name="charityPercentage"
                min="10"
                max="100"
                value={formData.charityPercentage}
                onChange={handleChange}
                required
              />

              <small>
                Choose how much of your contribution goes to
                charity.
              </small>
            </div>

            {message && (
              <div
                className={
                  message.toLowerCase().includes("success")
                    ? "register-success"
                    : "register-error"
                }
              >
                {message}
              </div>
            )}

            <button
              className="register-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>
          </form>

          <div className="login-section">
            <span>Already have an account?</span>

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;