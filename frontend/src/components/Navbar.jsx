import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <nav className="navbar">

      {/* LOGO */}
      <div className="navbar-brand">
        🦸 Digital Heroes
      </div>

      {/* NAVIGATION */}
      <div className="navbar-links">

        <Link to="/dashboard">
          Dashboard
        </Link>

        <Link to="/monthly-draw">
          Rewards
        </Link>

        <Link to="/dashboard#scores">
          Scores
        </Link>

        <Link to="/dashboard#charity">
          Charity
        </Link>

      </div>

      {/* RIGHT SIDE */}
      <div className="navbar-right">

        {user?.profile?.role === "admin" && (
          <Link to="/admin">
            Admin
          </Link>
        )}

        <button
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Navbar;