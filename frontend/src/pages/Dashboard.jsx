import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const token = localStorage.getItem("token");

  // =====================================
  // STATES
  // =====================================

  const [scores, setScores] = useState([]);
  const [score, setScore] = useState("");
  const [scoreDate, setScoreDate] = useState("");

  const [editingScoreId, setEditingScoreId] = useState(null);
  const [editScore, setEditScore] = useState("");
  const [editScoreDate, setEditScoreDate] = useState("");

  const [charities, setCharities] = useState([]);
  const [selectedCharity, setSelectedCharity] = useState(null);

  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState("monthly");

  const [message, setMessage] = useState("");
  const [subMessage, setSubMessage] = useState("");
  const [canceling, setCanceling] = useState(false);

  // =====================================
  // WINNER STATES
  // =====================================

  const [winner, setWinner] = useState(null);
  const [winnerLoading, setWinnerLoading] = useState(true);
  const [winnerError, setWinnerError] = useState("");

  const [proofFile, setProofFile] = useState(null);
  const [proofMessage, setProofMessage] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  // =====================================
  // AUTH CONFIG
  // =====================================

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =====================================
  // GET SCORES
  // =====================================

  const getScores = async () => {
    try {
      const response = await api.get(
        "/scores",
        authConfig
      );

      setScores(response.data.data || []);
    } catch (error) {
      console.error("Get scores error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to load scores"
      );
    }
  };

  // =====================================
  // GET CHARITIES
  // =====================================

  const getCharities = async () => {
    try {
      const response = await api.get("/charities");

      const charityList = response.data.data || [];

      setCharities(charityList);

      const charityId =
        user?.profile?.selected_charity_id;

      const selected = charityList.find(
        (charity) => charity.id === charityId
      );

      setSelectedCharity(selected || null);
    } catch (error) {
      console.error(
        "Get charities error:",
        error
      );

      setMessage("Failed to load charities");
    }
  };

  // =====================================
  // GET SUBSCRIPTION
  // =====================================

  const getSubscription = async () => {
    try {
      const response = await api.get(
        "/subscriptions",
        authConfig
      );

      setSubscription(
        response.data.data || null
      );
    } catch (error) {
      console.error(
        "Get subscription error:",
        error
      );

      setSubMessage(
        error.response?.data?.message ||
          "Failed to load subscription"
      );
    }
  };

  // =====================================
  // GET MY WINNER
  // =====================================

  const getMyWinner = async () => {
    try {
      setWinnerLoading(true);
      setWinnerError("");

      const response = await api.get(
        "/winners/my",
        authConfig
      );

      console.log(
        "MY WINNER API:",
        response.data
      );

      if (response.data?.data) {
        setWinner(response.data.data);
      } else {
        setWinner(null);
      }
    } catch (error) {
      console.error(
        "Get winner error:",
        error
      );

      setWinner(null);

      setWinnerError(
        error.response?.data?.message ||
          "Failed to load winner information."
      );
    } finally {
      setWinnerLoading(false);
    }
  };

  // =====================================
  // LOAD DATA
  // =====================================

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    getScores();
    getCharities();
    getSubscription();
    getMyWinner();
  }, []);

  // =====================================
  // ADD SCORE
  // =====================================

  const addScore = async (e) => {
    e.preventDefault();

    try {
      setMessage("");

      const scoreValue = Number(score);

      if (
        !Number.isInteger(scoreValue) ||
        scoreValue < 1 ||
        scoreValue > 45
      ) {
        setMessage(
          "Score must be between 1 and 45."
        );
        return;
      }

      if (!scoreDate) {
        setMessage("Please select a date.");
        return;
      }

      await api.post(
        "/scores",
        {
          score: scoreValue,
          scoreDate,
        },
        authConfig
      );

      setScore("");
      setScoreDate("");

      setMessage(
        "Golf score added successfully ✅"
      );

      await getScores();
    } catch (error) {
      console.error(
        "Add score error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to add score"
      );
    }
  };

  // =====================================
  // START EDIT SCORE
  // =====================================

  const startEditScore = (item) => {
    setEditingScoreId(item.id);
    setEditScore(item.score);
    setEditScoreDate(item.score_date);
    setMessage("");
  };

  // =====================================
  // CANCEL EDIT
  // =====================================

  const cancelEditScore = () => {
    setEditingScoreId(null);
    setEditScore("");
    setEditScoreDate("");
  };

  // =====================================
  // UPDATE SCORE
  // =====================================

  const updateScore = async (e) => {
    e.preventDefault();

    try {
      setMessage("");

      const scoreValue = Number(editScore);

      if (
        !Number.isInteger(scoreValue) ||
        scoreValue < 1 ||
        scoreValue > 45
      ) {
        setMessage(
          "Score must be between 1 and 45."
        );
        return;
      }

      if (!editScoreDate) {
        setMessage("Please select a date.");
        return;
      }

      await api.put(
        `/scores/${editingScoreId}`,
        {
          score: scoreValue,
          scoreDate: editScoreDate,
        },
        authConfig
      );

      setMessage(
        "Golf score updated successfully ✅"
      );

      cancelEditScore();

      await getScores();
    } catch (error) {
      console.error(
        "Update score error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to update score"
      );
    }
  };

  // =====================================
  // DELETE SCORE
  // =====================================

  const deleteScore = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this score?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");

      await api.delete(
        `/scores/${id}`,
        authConfig
      );

      setMessage(
        "Golf score deleted successfully ✅"
      );

      if (editingScoreId === id) {
        cancelEditScore();
      }

      await getScores();
    } catch (error) {
      console.error(
        "Delete score error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to delete score"
      );
    }
  };

  // =====================================
  // SUBSCRIBE
  // =====================================

  const subscribe = async () => {
    try {
      setSubMessage("");

      await api.post(
        "/subscriptions",
        {
          plan,
          charityPercentage:
            user?.profile?.charity_percentage || 10,
        },
        authConfig
      );

      setSubMessage(
        "Subscription activated successfully ✅"
      );

      await getSubscription();
    } catch (error) {
      console.error(
        "Subscription error:",
        error
      );

      setSubMessage(
        error.response?.data?.message ||
          "Failed to create subscription"
      );
    }
  };

  // =====================================
  // CANCEL SUBSCRIPTION
  // =====================================

  const cancelSubscription = async () => {
    if (!subscription?.id) {
      setSubMessage(
        "No active subscription found."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCanceling(true);
      setSubMessage("");

      await api.put(
        `/subscriptions/${subscription.id}/cancel`,
        {},
        authConfig
      );

      setSubMessage(
        "Subscription canceled successfully."
      );

      await getSubscription();
    } catch (error) {
      console.error(
        "Cancel subscription error:",
        error
      );

      setSubMessage(
        error.response?.data?.message ||
          "Failed to cancel subscription"
      );
    } finally {
      setCanceling(false);
    }
  };

  // =====================================
  // UPLOAD WINNER PROOF
  // =====================================

  const uploadProof = async () => {
    if (!proofFile) {
      setProofMessage(
        "Please select a file first."
      );
      return;
    }

    if (!winner?.id) {
      setProofMessage(
        "Winner record not found."
      );
      return;
    }

    if (
      proofFile.size >
      10 * 1024 * 1024
    ) {
      setProofMessage(
        "File size must be less than 10MB."
      );
      return;
    }

    try {
      setUploadingProof(true);
      setProofMessage("");

      const formData = new FormData();

      formData.append(
        "proof",
        proofFile
      );

      await api.post(
        `/winners/${winner.id}/proof`,
        formData,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setProofMessage(
        "Proof uploaded successfully ✅"
      );

      setProofFile(null);

      await getMyWinner();
    } catch (error) {
      console.error(
        "Upload proof error:",
        error
      );

      setProofMessage(
        error.response?.data?.message ||
          "Failed to upload proof"
      );
    } finally {
      setUploadingProof(false);
    }
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div className="app-container">

      <main className="dashboard-wrapper">

        {/* =====================================
            HERO
        ===================================== */}

        <section className="hero">

          <h1>
            Welcome back,{" "}
            {user?.profile?.full_name || "Hero"} 👋
          </h1>

          <p>
            Track your golf performance,
            support charities and
            participate in monthly rewards.
          </p>

        </section>

        {/* =====================================
            CARDS
        ===================================== */}

        <div className="card-grid">

          {/* =====================================
              CHARITY
          ===================================== */}

          <section
            id="charity"
            className="card charity-card"
          >

            <h2>
              Your Charity ❤️
            </h2>

            {selectedCharity ? (
              <>

                <div className="charity-name">
                  {selectedCharity.name}
                </div>

                <p>
                  {selectedCharity.description}
                </p>

                {selectedCharity.event_info && (
                  <p>
                    <strong>
                      Event:
                    </strong>{" "}
                    {selectedCharity.event_info}
                  </p>
                )}

                <p>
                  Your contribution:{" "}
                  <strong>
                    {user?.profile
                      ?.charity_percentage || 10}
                    %
                  </strong>
                </p>

              </>
            ) : (
              <p>
                No charity selected.
              </p>
            )}

          </section>

          {/* =====================================
              SUBSCRIPTION
          ===================================== */}

          <section className="card">

            <h2>
              Subscription 💳
            </h2>

            {subscription ? (
              <>

                <p>
                  Plan:
                  <strong>
                    {" "}
                    {subscription.plan}
                  </strong>
                </p>

                <p>
                  Amount:
                  <strong>
                    {" "}
                    ${subscription.amount}
                  </strong>
                </p>

                <p>
                  Status:
                  <strong>
                    {" "}
                    {subscription.status}
                  </strong>
                </p>

                <p>
                  Charity:
                  <strong>
                    {" "}
                    {subscription.charity_percentage}%
                  </strong>
                </p>

                {subscription.status ===
                  "active" && (
                  <button
                    className="logout-btn"
                    onClick={cancelSubscription}
                    disabled={canceling}
                  >
                    {canceling
                      ? "Canceling..."
                      : "Cancel Subscription"}
                  </button>
                )}

                {subMessage && (
                  <p className="message">
                    {subMessage}
                  </p>
                )}

              </>
            ) : (
              <>

                <p>
                  No active subscription.
                </p>

                <select
                  className="plan-select"
                  value={plan}
                  onChange={(e) =>
                    setPlan(e.target.value)
                  }
                >

                  <option value="monthly">
                    Monthly — $10
                  </option>

                  <option value="yearly">
                    Yearly — $100
                  </option>

                </select>

                <button
                  className="primary-btn"
                  onClick={subscribe}
                >
                  Subscribe
                </button>

                {subMessage && (
                  <p className="message">
                    {subMessage}
                  </p>
                )}

              </>
            )}

          </section>

          {/* =====================================
              ADD GOLF SCORE
          ===================================== */}

          <section className="card">

            <h2>
              Add Golf Score ⛳
            </h2>

            <form
              className="score-form"
              onSubmit={addScore}
            >

              <input
                type="number"
                min="1"
                max="45"
                placeholder="Score 1-45"
                value={score}
                onChange={(e) =>
                  setScore(e.target.value)
                }
                required
              />

              <input
                type="date"
                value={scoreDate}
                onChange={(e) =>
                  setScoreDate(e.target.value)
                }
                required
              />

              <button
                className="primary-btn"
                type="submit"
              >
                Add Score
              </button>

            </form>

            {message && (
              <p className="message">
                {message}
              </p>
            )}

          </section>

          {/* =====================================
              LAST 5 SCORES
          ===================================== */}

          <section
            id="scores"
            className="card"
          >

            <h2>
              Last 5 Scores 📊
            </h2>

            {scores.length === 0 ? (
              <p>
                No scores added yet.
              </p>
            ) : (
              <ul className="score-list">

                {scores.map((item) => (

                  <li key={item.id}>

                    {editingScoreId === item.id ? (

                      <form
                        onSubmit={updateScore}
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                          width: "100%",
                          alignItems: "center",
                        }}
                      >

                        <input
                          type="number"
                          min="1"
                          max="45"
                          value={editScore}
                          onChange={(e) =>
                            setEditScore(
                              e.target.value
                            )
                          }
                          required
                        />

                        <input
                          type="date"
                          value={editScoreDate}
                          onChange={(e) =>
                            setEditScoreDate(
                              e.target.value
                            )
                          }
                          required
                        />

                        <button
                          type="submit"
                          className="primary-btn"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          className="logout-btn"
                          onClick={cancelEditScore}
                        >
                          Cancel
                        </button>

                      </form>

                    ) : (

                      <>

                        <span>
                          <strong>
                            {item.score}
                          </strong>{" "}
                          points
                        </span>

                        <span>
                          {item.score_date}
                        </span>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginLeft: "auto",
                          }}
                        >

                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() =>
                              startEditScore(item)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="logout-btn"
                            onClick={() =>
                              deleteScore(item.id)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </>

                    )}

                  </li>

                ))}

              </ul>
            )}

          </section>

          {/* =====================================
              AVAILABLE CHARITIES
          ===================================== */}

          <section className="card">

            <h2>
              Support a Cause 🌱
            </h2>

            {charities.length === 0 ? (
              <p>
                No charities available.
              </p>
            ) : (
              <ul className="charity-list">

                {charities.map((charity) => (

                  <li key={charity.id}>

                    <strong>
                      {charity.name}
                    </strong>

                    <p>
                      {charity.description}
                    </p>

                  </li>

                ))}

              </ul>
            )}

          </section>

          {/* =====================================
              MONTHLY REWARDS
          ===================================== */}

          <section className="card">

            <h2>
              Monthly Rewards 🎁
            </h2>

            <p>
              Your subscription gives
              you access to monthly
              draw-based rewards.
            </p>

            <p>
              Keep your account active
              and continue supporting
              your chosen charity.
            </p>

            <button
              className="primary-btn"
              onClick={() =>
                navigate("/monthly-draw")
              }
            >
              View Monthly Draw
            </button>

          </section>

          {/* =====================================
              WINNER SECTION
          ===================================== */}

          {winnerLoading ? (

            <section className="card">

              <h2>
                🏆 Your Winner
              </h2>

              <p>
                Loading winner information...
              </p>

            </section>

          ) : winner ? (

            <section className="card">

              <h2>
                🏆 Your Winner
              </h2>

              <p>
                Prize:
                <strong>
                  {" "}
                  $
                  {Number(
                    winner.payout_amount || 0
                  ).toFixed(2)}
                </strong>
              </p>

              <p>
                Verification:
                <strong>
                  {" "}
                  {winner.verification_status}
                </strong>
              </p>

              <p>
                Payment:
                <strong>
                  {" "}
                  {winner.payment_status}
                </strong>
              </p>

              {/* PROOF ALREADY UPLOADED */}

              {winner.proof_url ? (

                <div>

                  <p>
                    Proof uploaded successfully ✅
                  </p>

                  <a
                    href={winner.proof_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Uploaded Proof
                  </a>

                </div>

              ) : (

                winner.verification_status !==
                  "rejected" && (

                  <div>

                    <h3>
                      Upload Winner Proof
                    </h3>

                    <p>
                      Upload JPG, PNG, WEBP or PDF.
                      Maximum size: 10MB.
                    </p>

                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(e) =>
                        setProofFile(
                          e.target.files?.[0] || null
                        )
                      }
                    />

                    <br />
                    <br />

                    <button
                      className="primary-btn"
                      onClick={uploadProof}
                      disabled={uploadingProof}
                    >
                      {uploadingProof
                        ? "Uploading..."
                        : "Upload Proof"}
                    </button>

                    {proofMessage && (
                      <p className="message">
                        {proofMessage}
                      </p>
                    )}

                  </div>

                )
              )}

              {/* REJECTED */}

              {winner.verification_status ===
                "rejected" && (

                <p className="message">
                  Your proof was rejected.
                  Please contact the administrator.
                </p>

              )}

            </section>

          ) : (

            <section className="card">

              <h2>
                🏆 Monthly Reward Status
              </h2>

              <p>
                No winner record is currently
                available for your account.
              </p>

              {winnerError && (
                <p className="message">
                  {winnerError}
                </p>
              )}

            </section>

          )}

        </div>

      </main>

    </div>
  );
}

export default Dashboard;