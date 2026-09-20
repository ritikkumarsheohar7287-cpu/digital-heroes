import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function MonthlyDraw() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [draw, setDraw] = useState(null);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =====================================
  // LOAD DRAW
  // =====================================

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    getDraw();
  }, []);

  // =====================================
  // GET PUBLISHED DRAW
  // =====================================

  const getDraw = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get(
        "/draws/published",
        authConfig
      );

      if (response.data.data) {
        setDraw(response.data.data);
      } else {
        setDraw(null);
      }
    } catch (error) {
      console.error(
        "Get draw error:",
        error
      );

      setDraw(null);

      setMessage(
        error.response?.data?.message ||
          "Failed to load draw"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // REQUIRED NUMBERS
  // =====================================

  const getRequiredNumbers = () => {
    if (!draw) {
      return 0;
    }

    if (draw.draw_type === "5-number") {
      return 5;
    }

    if (draw.draw_type === "4-number") {
      return 4;
    }

    return 3;
  };

  const requiredNumbers =
    getRequiredNumbers();

  // =====================================
  // TOGGLE NUMBER
  // =====================================

  const toggleNumber = (number) => {
    setMessage("");

    // Remove number if already selected
    if (
      selectedNumbers.includes(number)
    ) {
      setSelectedNumbers(
        selectedNumbers.filter(
          (item) => item !== number
        )
      );

      return;
    }

    // Maximum selection reached
    if (
      selectedNumbers.length >=
      requiredNumbers
    ) {
      setMessage(
        `You can select only ${requiredNumbers} numbers.`
      );

      return;
    }

    setSelectedNumbers([
      ...selectedNumbers,
      number,
    ]);
  };

  // =====================================
  // SUBMIT ENTRY
  // =====================================

  const submitEntry = async () => {
    if (!draw) {
      setMessage(
        "No active draw available."
      );

      return;
    }

    if (
      selectedNumbers.length !==
      requiredNumbers
    ) {
      setMessage(
        `Please select exactly ${requiredNumbers} numbers.`
      );

      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      await api.post(
        "/draw-entries",
        {
          drawId: draw.id,

          selectedNumbers:
            [...selectedNumbers].sort(
              (a, b) => a - b
            ),
        },
        authConfig
      );

      setMessage(
        "Your draw entry was submitted successfully 🎉"
      );

    } catch (error) {
      console.error(
        "Submit entry error:",
        error
      );

      const backendMessage =
        error.response?.data?.message ||
        "";

      if (
        backendMessage
          .toLowerCase()
          .includes("duplicate") ||
        backendMessage
          .toLowerCase()
          .includes(
            "draw_entries_draw_id_user_id_key"
          )
      ) {
        setMessage(
          "You have already submitted an entry for this draw."
        );
      } else {
        setMessage(
          backendMessage ||
            "Failed to submit draw entry"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="draw-page">

        <div className="draw-loading">

          <div className="draw-spinner">
            ⏳
          </div>

          <h2>
            Loading monthly draw...
          </h2>

          <p>
            Please wait while we load
            this month's rewards.
          </p>

        </div>

      </div>
    );
  }

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="draw-page">

      <main className="draw-wrapper">

        {/* =====================================
            HERO
        ===================================== */}

        <section className="draw-hero">

          <div className="draw-label">
            MONTHLY REWARDS
          </div>

          <h1>
            Make your numbers count. 🎯
          </h1>

          <p>
            Choose your numbers and take
            part in this month's Digital
            Heroes draw.
          </p>

        </section>

        {/* =====================================
            NO DRAW
        ===================================== */}

        {!draw ? (

          <section className="draw-card empty-draw">

            <div className="empty-icon">
              🎁
            </div>

            <h2>
              No active draw
            </h2>

            <p>
              There is currently no
              published monthly draw.
              Please check again later.
            </p>

            <button
              className="draw-secondary-btn"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              ← Back to Dashboard
            </button>

          </section>

        ) : (

          <>

            {/* =====================================
                DRAW INFORMATION
            ===================================== */}

            <section className="draw-info-grid">

              <div className="draw-info-card">

                <span>
                  📅 DRAW DATE
                </span>

                <strong>
                  {draw.draw_date}
                </strong>

              </div>

              <div className="draw-info-card">

                <span>
                  🎯 DRAW TYPE
                </span>

                <strong>
                  {draw.draw_type}
                </strong>

              </div>

              <div className="draw-info-card">

                <span>
                  🔢 NUMBERS
                </span>

                <strong>
                  Choose{" "}
                  {requiredNumbers}
                </strong>

              </div>

            </section>

            {/* =====================================
                NUMBER SELECTION
            ===================================== */}

            <section className="draw-card number-selection-card">

              <div className="number-header">

                <div>

                  <div className="section-label">
                    YOUR ENTRY
                  </div>

                  <h2>
                    Choose your numbers
                  </h2>

                  <p>
                    Select exactly{" "}
                    <strong>
                      {requiredNumbers}
                    </strong>{" "}
                    numbers from 1 to 45.
                  </p>

                </div>

                <div
                  className={
                    selectedNumbers.length ===
                    requiredNumbers
                      ? "selected-count complete"
                      : "selected-count"
                  }
                >
                  {selectedNumbers.length}
                  /
                  {requiredNumbers}
                </div>

              </div>

              {/* =====================================
                  NUMBER GRID
              ===================================== */}

              <div className="number-grid">

                {Array.from(
                  {
                    length: 45,
                  },
                  (_, index) =>
                    index + 1
                ).map((number) => {

                  const selected =
                    selectedNumbers.includes(
                      number
                    );

                  return (
                    <button
                      key={number}
                      type="button"
                      className={
                        selected
                          ? "number-btn selected"
                          : "number-btn"
                      }
                      onClick={() =>
                        toggleNumber(
                          number
                        )
                      }
                    >
                      {number}
                    </button>
                  );
                })}

              </div>

              {/* =====================================
                  SELECTED NUMBERS
              ===================================== */}

              <div className="selected-numbers">

                <span>
                  Selected numbers
                </span>

                <div className="selected-number-list">

                  {selectedNumbers.length ===
                  0 ? (

                    <strong className="no-selection">
                      No numbers selected
                    </strong>

                  ) : (

                    [...selectedNumbers]
                      .sort(
                        (a, b) => a - b
                      )
                      .map((number) => (

                        <b
                          key={number}
                          className="selected-number-chip"
                        >
                          {number}
                        </b>

                      ))

                  )}

                </div>

              </div>

              {/* =====================================
                  SUBMIT
              ===================================== */}

              <button
                type="button"
                className="submit-draw-btn"
                onClick={submitEntry}
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Draw Entry →"}
              </button>

              {/* =====================================
                  MESSAGE
              ===================================== */}

              {message && (
                <div className="draw-message">
                  {message}
                </div>
              )}

            </section>

          </>
        )}

      </main>

    </div>
  );
}

export default MonthlyDraw;