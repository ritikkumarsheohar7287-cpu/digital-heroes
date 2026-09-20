import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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

      const response = await api.post(
        "/auth/register",
        {
          ...formData,
          charityPercentage: Number(
            formData.charityPercentage
          ),
        }
      );

      setMessage(
        response.data.message ||
          "Registration successful"
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
    <div>
      <h1>Digital Heroes</h1>

      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          minLength="6"
          required
        />

        <br />
        <br />

        <label>
          Choose Charity
        </label>

        <br />

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

        <br />
        <br />

        <label>
          Charity Contribution (%)
        </label>

        <br />

        <input
          type="number"
          name="charityPercentage"
          min="10"
          max="100"
          value={formData.charityPercentage}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <br />

      <button
        onClick={() => navigate("/login")}
      >
        Already have an account? Login
      </button>
    </div>
  );
}

export default Register;