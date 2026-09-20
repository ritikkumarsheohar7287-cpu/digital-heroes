import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [draws, setDraws] = useState([]);
  const [winners, setWinners] = useState([]);

  const [formData, setFormData] = useState({
    drawDate: "",
    drawType: "5-number",
    drawMode: "random",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [simulatingId, setSimulatingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [calculatingId, setCalculatingId] = useState(null);

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =====================================
  // AUTH + INITIAL DATA
  // =====================================

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    getDraws();
    getWinners();
  }, []);

  // =====================================
  // GET DRAWS
  // =====================================

  const getDraws = async () => {
    try {
      const response = await api.get("/draws", authConfig);

      setDraws(response.data.data || []);
    } catch (error) {
      console.error("Get draws error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to load draws"
      );
    }
  };

  // =====================================
  // GET WINNERS
  // =====================================

  const getWinners = async () => {
    try {
      const response = await api.get(
        "/winners",
        authConfig
      );

      setWinners(response.data.data || []);
    } catch (error) {
      console.error(
        "Get winners error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to load winners"
      );
    }
  };

  // =====================================
  // FORM CHANGE
  // =====================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =====================================
  // CREATE DRAW
  // =====================================

  const createDraw = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await api.post(
        "/draws",
        formData,
        authConfig
      );

      setMessage(
        response.data?.message ||
          "Draw created successfully ✅"
      );

      setFormData({
        drawDate: "",
        drawType: "5-number",
        drawMode: "random",
      });

      await getDraws();
    } catch (error) {
      console.error(
        "Create draw error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to create draw"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // SIMULATE DRAW
  // =====================================

  const simulateDraw = async (id) => {
    try {
      setSimulatingId(id);
      setMessage("");

      console.log("Simulating draw:", id);

      const response = await api.post(
        `/draws/${id}/simulate`,
        {},
        authConfig
      );

      console.log(
        "Simulation response:",
        response.data
      );

      setMessage(
        response.data?.message ||
          "Draw simulated successfully ✅"
      );

      await getDraws();
    } catch (error) {
      console.error(
        "Simulate draw error:",
        error
      );

      console.error(
        "Server response:",
        error.response?.data
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to simulate draw"
      );
    } finally {
      setSimulatingId(null);
    }
  };

  // =====================================
  // PUBLISH DRAW
  // =====================================

  const publishDraw = async (id) => {
    try {
      setPublishingId(id);
      setMessage("");

      const response = await api.post(
        `/draws/${id}/publish`,
        {},
        authConfig
      );

      setMessage(
        response.data?.message ||
          "Draw published successfully ✅"
      );

      await getDraws();
    } catch (error) {
      console.error(
        "Publish draw error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to publish draw"
      );
    } finally {
      setPublishingId(null);
    }
  };

  // =====================================
  // CALCULATE WINNERS
  // =====================================

  const calculateWinners = async (id) => {
    try {
      setCalculatingId(id);
      setMessage("");

      const response = await api.post(
        `/winners/calculate/${id}`,
        {},
        authConfig
      );

      setMessage(
        response.data?.message ||
          "Winner calculation completed ✅"
      );

      await getDraws();
      await getWinners();
    } catch (error) {
      console.error(
        "Calculate winners error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to calculate winners"
      );
    } finally {
      setCalculatingId(null);
    }
  };

  // =====================================
  // APPROVE WINNER
  // =====================================

  const approveWinner = async (id) => {
    try {
      setMessage("");

      const response = await api.put(
        `/winners/${id}/approve`,
        {},
        authConfig
      );

      setMessage(
        response.data?.message ||
          "Winner approved successfully ✅"
      );

      await getWinners();
    } catch (error) {
      console.error(
        "Approve winner error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to approve winner"
      );
    }
  };

  // =====================================
  // REJECT WINNER
  // =====================================

  const rejectWinner = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this winner?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");

      const response = await api.put(
        `/winners/${id}/reject`,
        {},
        authConfig
      );

      setMessage(
        response.data?.message ||
          "Winner rejected successfully"
      );

      await getWinners();
    } catch (error) {
      console.error(
        "Reject winner error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to reject winner"
      );
    }
  };

  // =====================================
  // MARK WINNER PAID
  // =====================================

  const markPaid = async (id) => {
    const confirmed = window.confirm(
      "Mark this winner as paid?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");

      const response = await api.put(
        `/winners/${id}/paid`,
        {},
        authConfig
      );

      setMessage(
        response.data?.message ||
          "Winner marked as paid ✅"
      );

      await getWinners();
    } catch (error) {
      console.error(
        "Mark paid error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to mark payment"
      );
    }
  };

  // =====================================
  // STATS
  // =====================================

  const publishedDraws = draws.filter(
    (draw) => draw.status === "published"
  ).length;

  const pendingWinners = winners.filter(
    (winner) =>
      winner.verification_status === "pending"
  ).length;

  const totalPrizePool = draws.reduce(
    (total, draw) =>
      total +
      Number(draw.prize_pool_total || 0),
    0
  );

  // =====================================
  // UI
  // =====================================

  return (
    <div className="admin-container">
      <main className="admin-wrapper">

        {/* =====================================
            HEADER
        ===================================== */}

        <section className="admin-hero">

          <div>
            <div className="admin-label">
              ADMINISTRATION
            </div>

            <h1>
              Admin Dashboard 🛠️
            </h1>

            <p>
              Manage monthly draws, winners,
              verification and reward payouts
              from one place.
            </p>
          </div>

          <button
            type="button"
            className="admin-dashboard-btn"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← User Dashboard
          </button>

        </section>

        {/* =====================================
            STATS
        ===================================== */}

        <section className="admin-stats">

          <div className="admin-stat-card">

            <div className="stat-icon">
              🎯
            </div>

            <div>
              <span>Total Draws</span>

              <strong>
                {draws.length}
              </strong>
            </div>

          </div>

          <div className="admin-stat-card">

            <div className="stat-icon">
              📢
            </div>

            <div>
              <span>Published Draws</span>

              <strong>
                {publishedDraws}
              </strong>
            </div>

          </div>

          <div className="admin-stat-card">

            <div className="stat-icon">
              🏆
            </div>

            <div>
              <span>Total Winners</span>

              <strong>
                {winners.length}
              </strong>
            </div>

          </div>

          <div className="admin-stat-card">

            <div className="stat-icon">
              💰
            </div>

            <div>
              <span>Prize Pool</span>

              <strong>
                ${totalPrizePool.toFixed(2)}
              </strong>
            </div>

          </div>

        </section>

        {/* =====================================
            MESSAGE
        ===================================== */}

        {message && (
          <div className="admin-message">
            <span>✓</span>
            {message}
          </div>
        )}

        {/* =====================================
            CREATE DRAW
        ===================================== */}

        <section className="admin-card">

          <div className="admin-section-title">

            <div>

              <div className="admin-small-label">
                DRAW SETUP
              </div>

              <h2>
                Create Monthly Draw
              </h2>

              <p>
                Configure a new monthly reward
                draw for subscribers.
              </p>

            </div>

            <div className="section-icon">
              🎯
            </div>

          </div>

          <form
            className="draw-form"
            onSubmit={createDraw}
          >

            <div className="form-group">

              <label>
                Draw Date
              </label>

              <input
                type="date"
                name="drawDate"
                value={formData.drawDate}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-group">

              <label>
                Draw Type
              </label>

              <select
                name="drawType"
                value={formData.drawType}
                onChange={handleChange}
              >

                <option value="5-number">
                  5 Number Draw
                </option>

                <option value="4-number">
                  4 Number Draw
                </option>

                <option value="3-number">
                  3 Number Draw
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>
                Draw Mode
              </label>

              <select
                name="drawMode"
                value={formData.drawMode}
                onChange={handleChange}
              >

                <option value="random">
                  Random
                </option>

                <option value="weighted">
                  Weighted
                </option>

              </select>

            </div>

            <button
              type="submit"
              className="create-draw-btn"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "＋ Create Draw"}
            </button>

          </form>

        </section>

        {/* =====================================
            DRAW MANAGEMENT
        ===================================== */}

        <section className="admin-card">

          <div className="section-heading">

            <div>

              <div className="admin-small-label">
                REWARD OPERATIONS
              </div>

              <h2>
                Draw Management
              </h2>

            </div>

            <span className="section-count">
              {draws.length}{" "}
              {draws.length === 1
                ? "Draw"
                : "Draws"}
            </span>

          </div>

          {draws.length === 0 ? (

            <div className="admin-empty">

              <div>🎯</div>

              <h3>
                No draws created yet
              </h3>

              <p>
                Create your first monthly draw
                using the form above.
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="admin-table">

                <thead>

                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Mode</th>
                    <th>Winning Numbers</th>
                    <th>Prize Pool</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {draws.map((draw) => (

                    <tr key={draw.id}>

                      {/* DATE */}

                      <td>
                        <strong>
                          {draw.draw_date}
                        </strong>
                      </td>

                      {/* TYPE */}

                      <td>
                        <span className="type-badge">
                          {draw.draw_type}
                        </span>
                      </td>

                      {/* MODE */}

                      <td>
                        {draw.draw_mode}
                      </td>

                      {/* WINNING NUMBERS */}

                      <td>

                        {draw.winning_numbers ? (

                          <div className="winning-numbers">

                            {draw.winning_numbers.map(
                              (number) => (
                                <span
                                  key={number}
                                >
                                  {number}
                                </span>
                              )
                            )}

                          </div>

                        ) : (

                          <span className="muted">
                            Not generated
                          </span>

                        )}

                      </td>

                      {/* PRIZE POOL */}

                      <td>

                        <strong>
                          $
                          {Number(
                            draw.prize_pool_total || 0
                          ).toFixed(2)}
                        </strong>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`status ${draw.status}`}
                        >
                          {draw.status}
                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="action-buttons">

                          {/* DRAFT → SIMULATE */}

                          {draw.status ===
                            "draft" && (

                            <button
                              type="button"
                              className="action-btn simulate"
                              onClick={() =>
                                simulateDraw(
                                  draw.id
                                )
                              }
                              disabled={
                                simulatingId ===
                                draw.id
                              }
                            >
                              {simulatingId ===
                              draw.id
                                ? "Simulating..."
                                : "Simulate"}
                            </button>

                          )}

                          {/* SIMULATED → PUBLISH */}

                          {draw.status ===
                            "simulated" && (

                            <button
                              type="button"
                              className="action-btn publish"
                              onClick={() =>
                                publishDraw(
                                  draw.id
                                )
                              }
                              disabled={
                                publishingId ===
                                draw.id
                              }
                            >
                              {publishingId ===
                              draw.id
                                ? "Publishing..."
                                : "Publish"}
                            </button>

                          )}

                          {/* PUBLISHED → CALCULATE */}

                          {draw.status ===
                            "published" && (

                            <button
                              type="button"
                              className="action-btn calculate"
                              onClick={() =>
                                calculateWinners(
                                  draw.id
                                )
                              }
                              disabled={
                                calculatingId ===
                                draw.id
                              }
                            >
                              {calculatingId ===
                              draw.id
                                ? "Calculating..."
                                : "Calculate Winners"}
                            </button>

                          )}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =====================================
            WINNER MANAGEMENT
        ===================================== */}

        <section className="admin-card">

          <div className="section-heading">

            <div>

              <div className="admin-small-label">
                PAYOUT MANAGEMENT
              </div>

              <h2>
                Winner Management
              </h2>

            </div>

            <span className="section-count">
              {winners.length}{" "}
              {winners.length === 1
                ? "Winner"
                : "Winners"}
            </span>

          </div>

          {/* PENDING NOTICE */}

          {pendingWinners > 0 && (
            <div className="pending-notice">
              ⚠️ {pendingWinners} winner
              {pendingWinners > 1
                ? "s"
                : ""}{" "}
              waiting for verification.
            </div>
          )}

          {/* NO WINNERS */}

          {winners.length === 0 ? (

            <div className="admin-empty">

              <div>🏆</div>

              <h3>
                No winners yet
              </h3>

              <p>
                Winners will appear here after
                a published draw is calculated.
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="admin-table">

                <thead>

                  <tr>
                    <th>User</th>
                    <th>Prize</th>
                    <th>Proof</th>
                    <th>Verification</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {winners.map((winner) => (

                    <tr key={winner.id}>

                      {/* USER */}

                      <td>

                        <span className="user-id">
                          {winner.user_id
                            ? `${winner.user_id.slice(
                                0,
                                8
                              )}...`
                            : "—"}
                        </span>

                      </td>

                      {/* PRIZE */}

                      <td>

                        <strong className="prize-amount">
                          $
                          {Number(
                            winner.payout_amount || 0
                          ).toFixed(2)}
                        </strong>

                      </td>

                      {/* PROOF */}

                      <td>

                        {winner.proof_url ? (

                          <a
                            className="proof-link"
                            href={
                              winner.proof_url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Proof ↗
                          </a>

                        ) : (

                          <span className="muted">
                            No Proof
                          </span>

                        )}

                      </td>

                      {/* VERIFICATION */}

                      <td>

                        <span
                          className={`status ${winner.verification_status}`}
                        >
                          {
                            winner.verification_status
                          }
                        </span>

                      </td>

                      {/* PAYMENT */}

                      <td>

                        <span
                          className={`status ${winner.payment_status}`}
                        >
                          {
                            winner.payment_status
                          }
                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="action-buttons">

                          {/* PENDING → APPROVE / REJECT */}

                          {winner.verification_status ===
                            "pending" && (

                            <>
                              <button
                                type="button"
                                className="action-btn approve"
                                onClick={() =>
                                  approveWinner(
                                    winner.id
                                  )
                                }
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                className="action-btn reject"
                                onClick={() =>
                                  rejectWinner(
                                    winner.id
                                  )
                                }
                              >
                                Reject
                              </button>
                            </>

                          )}

                          {/* APPROVED → MARK PAID */}

                          {winner.verification_status ===
                            "approved" &&
                            winner.payment_status !==
                              "paid" && (

                            <button
                              type="button"
                              className="action-btn paid"
                              onClick={() =>
                                markPaid(
                                  winner.id
                                )
                              }
                            >
                              Mark Paid
                            </button>

                          )}

                          {/* PAID */}

                          {winner.payment_status ===
                            "paid" && (

                            <span className="paid-label">
                              ✓ Completed
                            </span>

                          )}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>
    </div>
  );
}

export default AdminDashboard;