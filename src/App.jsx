import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./App.css";

const API = "https://tradenex-api.onrender.com/api";

async function api(path, options = {}) {
  const token =
    localStorage.getItem("tradenex_token");

  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] =
      "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    API + path,
    {
      ...options,
      headers,
    }
  );

  const data =
    await response.json().catch(() => ({
      success: false,
      message:
        "Invalid server response.",
    }));

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Something went wrong."
    );
  }

  return data;
}

/* =====================================================
   LOGIN / REGISTER
===================================================== */

function LoginPage({ onLogin }) {
  const [mode, setMode] =
    useState("login");

  const [login, setLogin] = useState({
    email: "",
    password: "",
  });

  const [register, setRegister] =
    useState({
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      address: "",
      country: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
    });

  const [forgot, setForgot] =
    useState({
      type: "login",
      email: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  function clearMessages() {
    setMessage("");
    setError("");
  }

  async function handleLogin(e) {
    e.preventDefault();

    clearMessages();
    setLoading(true);

    try {
      const data = await api(
        "/login",
        {
          method: "POST",
          body: JSON.stringify(login),
        }
      );

      localStorage.setItem(
        "tradenex_token",
        data.token
      );

      localStorage.setItem(
        "tradenex_user",
        JSON.stringify(data.user)
      );

      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();

    clearMessages();

    if (
      register.password !==
      register.confirmPassword
    ) {
      setError(
        "Password और confirm password अलग हैं."
      );
      return;
    }

    if (register.password.length < 6) {
      setError(
        "Password minimum 6 characters होना चाहिए."
      );
      return;
    }

    setLoading(true);

    try {
      await api("/register", {
        method: "POST",
        body: JSON.stringify({
          firstName:
            register.firstName,
          lastName:
            register.lastName,
          mobile:
            register.mobile,
          email:
            register.email,
          address:
            register.address,
          country:
            register.country,
          password:
            register.password,
          referralCode:
            register.referralCode,
        }),
      });

      setMessage(
        "Registration successful. अब Login करें."
      );

      setLogin({
        email: register.email,
        password: "",
      });

      setRegister({
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        address: "",
        country: "",
        password: "",
        confirmPassword: "",
        referralCode: "",
      });

      setMode("login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();

    clearMessages();

    if (
      forgot.newPassword !==
      forgot.confirmPassword
    ) {
      setError(
        "New password और confirm password अलग हैं."
      );
      return;
    }

    setLoading(true);

    try {
      const data = await api(
        "/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            type: forgot.type,
            email: forgot.email,
            newPassword:
              forgot.newPassword,
          }),
        }
      );

      setMessage(data.message);

      setForgot({
        type: "login",
        email: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMode("login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <img src="/tradenex-premium-logo.png" alt="Tradenex" className="auth-logo-img" />
          <b>Tradenex</b>
        </div>

        {mode === "login" && (
          <>
            <h1>Welcome Back</h1>

            <p className="auth-subtitle">
              Login to your Tradenex account
            </p>

            {message && (
              <div className="success-box">
                {message}
              </div>
            )}

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <form
              onSubmit={handleLogin}
            >
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={login.email}
                onChange={(e) =>
                  setLogin({
                    ...login,
                    email:
                      e.target.value,
                  })
                }
                required
              />

              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={login.password}
                onChange={(e) =>
                  setLogin({
                    ...login,
                    password:
                      e.target.value,
                  })
                }
                required
              />

              <button
                className="primary-btn"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : "Login"}
              </button>
            </form>

            <button
              className="text-btn"
              onClick={() => {
                clearMessages();
                setMode("forgot");
              }}
            >
              Forgot Password?
            </button>

            <div className="auth-bottom">
              Don't have an account?

              <button
                className="link-btn"
                onClick={() => {
                  clearMessages();
                  setMode("register");
                }}
              >
                Create Account
              </button>
            </div>
          </>
        )}

        {mode === "register" && (
          <>
            <h1>Create Account</h1>

            <p className="auth-subtitle">
              Register your new Tradenex account
            </p>

            {message && (
              <div className="success-box">
                {message}
              </div>
            )}

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <form
              onSubmit={handleRegister}
            >
              <div className="two-col">
                <div>
                  <label>
                    First Name
                  </label>

                  <input
                    placeholder="First name"
                    value={
                      register.firstName
                    }
                    onChange={(e) =>
                      setRegister({
                        ...register,
                        firstName:
                          e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label>
                    Last Name
                  </label>

                  <input
                    placeholder="Last name"
                    value={
                      register.lastName
                    }
                    onChange={(e) =>
                      setRegister({
                        ...register,
                        lastName:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <label>
                Mobile Number
              </label>

              <input
                type="tel"
                placeholder="Enter mobile number"
                value={register.mobile}
                onChange={(e) =>
                  setRegister({
                    ...register,
                    mobile:
                      e.target.value,
                  })
                }
                required
              />

              <label>
                Email ID
              </label>

              <input
                type="email"
                placeholder="Enter email"
                value={register.email}
                onChange={(e) =>
                  setRegister({
                    ...register,
                    email:
                      e.target.value,
                  })
                }
                required
              />

              <label>
                Address
              </label>

              <textarea
                placeholder="Enter your address"
                value={register.address}
                onChange={(e) =>
                  setRegister({
                    ...register,
                    address:
                      e.target.value,
                  })
                }
                rows="3"
                required
              />

              <label>
                Country
              </label>

              <input
                placeholder="Country"
                value={register.country}
                onChange={(e) =>
                  setRegister({
                    ...register,
                    country:
                      e.target.value,
                  })
                }
              />

              <label>
                Referral Code
              </label>

              <input
                placeholder="Enter referral code (optional)"
                value={
                  register.referralCode
                }
                onChange={(e) =>
                  setRegister({
                    ...register,
                    referralCode:
                      e.target.value.toUpperCase(),
                  })
                }
              />

              <small className="field-help">
                Referral code नहीं है तो
                इसे खाली छोड़ सकते हैं।
              </small>

              <label>
                Password
              </label>

              <input
                type="password"
                placeholder="Create password"
                value={
                  register.password
                }
                onChange={(e) =>
                  setRegister({
                    ...register,
                    password:
                      e.target.value,
                  })
                }
                required
              />

              <label>
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm password"
                value={
                  register.confirmPassword
                }
                onChange={(e) =>
                  setRegister({
                    ...register,
                    confirmPassword:
                      e.target.value,
                  })
                }
                required
              />

              <button
                className="primary-btn"
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : "Create Account"}
              </button>
            </form>

            <div className="auth-bottom">
              Already have an account?

              <button
                className="link-btn"
                onClick={() => {
                  clearMessages();
                  setMode("login");
                }}
              >
                Login
              </button>
            </div>
          </>
        )}

        {mode === "forgot" && (
          <>
            <h1>Reset Password</h1>

            <p className="auth-subtitle">
              Reset your Tradenex password
            </p>

            {message && (
              <div className="success-box">
                {message}
              </div>
            )}

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <form
              onSubmit={handleForgot}
            >
              <label>
                Password Type
              </label>

              <select
                value={forgot.type}
                onChange={(e) =>
                  setForgot({
                    ...forgot,
                    type: e.target.value,
                  })
                }
              >
                <option value="login">
                  Login Password
                </option>

                <option value="transaction">
                  Transaction Password
                </option>
              </select>

              <label>Email</label>

              <input
                type="email"
                placeholder="Registered email"
                value={forgot.email}
                onChange={(e) =>
                  setForgot({
                    ...forgot,
                    email:
                      e.target.value,
                  })
                }
                required
              />

              <label>
                New Password
              </label>

              <input
                type="password"
                placeholder="New password"
                value={
                  forgot.newPassword
                }
                onChange={(e) =>
                  setForgot({
                    ...forgot,
                    newPassword:
                      e.target.value,
                  })
                }
                required
              />

              <label>
                Confirm New Password
              </label>

              <input
                type="password"
                placeholder="Confirm new password"
                value={
                  forgot.confirmPassword
                }
                onChange={(e) =>
                  setForgot({
                    ...forgot,
                    confirmPassword:
                      e.target.value,
                  })
                }
                required
              />

              <button
                className="primary-btn"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : "Reset Password"}
              </button>
            </form>

            <button
              className="text-btn"
              onClick={() => {
                clearMessages();
                setMode("login");
              }}
            >
              ← Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({
  user,
  data,
}) {
  const referralCount =
    data.referrals?.length || 0;

  function go(page) {
    window.dispatchEvent(
      new CustomEvent(
        "tradenex-page",
        {
          detail: page,
        }
      )
    );
  }

  return (
    <>
      <div className="page-title dashboard-title">
        <small>
          TRADENEX USER PANEL
        </small>

        <h2>
          Welcome back{" "}
          {user.name || "User"} 👋
        </h2>

        <p>
          Manage your wallet, deposits,
          withdrawals and account.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>💰</span>
          <small>
            Wallet Balance
          </small>

          <strong>
            $
            {Number(
              user.balance || 0
            ).toFixed(2)}
          </strong>
        </div>

        <div className="stat-card">
          <span>💵</span>

          <small>
            Total Deposit
          </small>

          <strong>
            $
            {Number(
              user.totalDeposit || 0
            ).toFixed(2)}
          </strong>
        </div>

        <div className="stat-card">
          <span>⏳</span>

          <small>
            Pending Deposit
          </small>

          <strong>
            $
            {Number(
              user.pendingDeposit || 0
            ).toFixed(2)}
          </strong>
        </div>

        <div className="stat-card">
          <span>📈</span>

          <small>
            Performance
          </small>

          <strong>
            $
            {(
              Number(user.totalDeposit || 0) * 0.004
            ).toFixed(2)}
          </strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel-card">
          <div className="panel-head">
            <h3>
              Referral Program
            </h3>

            <span>
              {referralCount} referrals
            </span>
          </div>

          <p>
            आपका Referral Code:
          </p>

          <div className="referral-code">
            {user.referralCode || "—"}
          </div>

          <p>
            Referral Reward:
            <strong>
              {" "}
              $
              {Number(
                user.referralReward || 0
              ).toFixed(2)}
            </strong>
          </p>

          <p>
            3 referrals होने के बाद
            referral reward withdrawal
            available होगा।
          </p>
        </div>

        <div className="panel-card">
          <div className="panel-head">
            <h3>
              Quick Actions
            </h3>
          </div>

          <div className="quick-actions">
            <button
              onClick={() =>
                go("deposit")
              }
            >
              💳 Deposit
            </button>

            <button
              onClick={() =>
                go("withdraw")
              }
            >
              ↗ Withdraw
            </button>

            <button
              onClick={() =>
                go("transactions")
              }
            >
              ⇄ Transactions
            </button>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-head">
          <h3>
            Recent Transactions
          </h3>
        </div>

        {data.transactions?.length ? (
          <TransactionTable
            transactions={data.transactions.slice(
              0,
              5
            )}
          />
        ) : (
          <div className="empty">
            No transactions yet.
          </div>
        )}
      </div>
    </>
  );
}

/* =====================================================
   TRANSACTION TABLE
===================================================== */

function TransactionTable({
  transactions,
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map(
            (tx) => (
              <tr key={tx.id}>
                <td>
                  {tx.type}
                </td>

                <td>
                  $
                  {Number(
                    tx.amount || 0
                  ).toFixed(2)}
                </td>

                <td>
                  <span
                    className={
                      "status " +
                      String(
                        tx.status || ""
                      ).toLowerCase()
                    }
                  >
                    {tx.status}
                  </span>
                </td>

                <td>
                  {tx.createdAt
                    ? new Date(
                        tx.createdAt
                      ).toLocaleString()
                    : "—"}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   WALLET
===================================================== */

function Wallet({ user }) {
  return (
    <>
      <div className="page-title">
        <small>WALLET</small>

        <h2>Wallet</h2>

        <p>
          Your current wallet
          information.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>💰</span>

          <small>
            Available Balance
          </small>

          <strong>
            $
            {Number(
              user.balance || 0
            ).toFixed(2)}
          </strong>
        </div>

        <div className="stat-card">
          <span>📥</span>

          <small>
            Total Deposit
          </small>

          <strong>
            $
            {Number(
              user.totalDeposit || 0
            ).toFixed(2)}
          </strong>
        </div>

        <div className="stat-card">
          <span>📈</span>

          <small>Profit</small>

          <strong>
            $
            {Number(
              user.profit || 0
            ).toFixed(2)}
          </strong>
        </div>

        <div className="stat-card">
          <span>🎁</span>

          <small>
            Referral Reward
          </small>

          <strong>
            $
            {Number(
              user.referralReward || 0
            ).toFixed(2)}
          </strong>
        </div>
      </div>
    </>
  );
}

/* =====================================================
   DEPOSIT
===================================================== */

function Deposit({ onDone }) {
  const [form, setForm] =
    useState({
      method: "USDT",
      network: "TRC20",
      amount: "",
      walletAddress: "",
      txid: "",
    });

  const [proof, setProof] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const depositWallets = {
    TRC20: {
      address:
        "TUuGwbzorVauCkhsmCUw6gCmvCAMcQaUZZ",
      label: "USDT - TRC20",
    },

    BEP20: {
      address:
        "0x22B72f2dAeDeB450333D9FA0Fc8E5C274E0a85f9",
      label: "USDT - BEP20",
    },
  };

  const selectedWallet =
    depositWallets[form.network];

  const qrCodeUrl =
    "https://api.qrserver.com/v1/create-qr-code/" +
    `?size=300x300&margin=10&data=${encodeURIComponent(
      selectedWallet.address
    )}`;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(
        selectedWallet.address
      );

      setError("");

      setMessage(
        `${selectedWallet.label} wallet address copied.`
      );

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      setError(
        "Address copy नहीं हो पाया. Address को manually copy करें."
      );
    }
  }

  async function submit(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!proof) {
      setError(
        "Payment proof upload करें."
      );
      return;
    }

    const fd = new FormData();

    fd.append(
      "method",
      form.method
    );

    fd.append(
      "network",
      form.network
    );

    fd.append(
      "amount",
      form.amount
    );

    fd.append(
      "walletAddress",
      form.walletAddress
    );

    fd.append(
      "txid",
      form.txid
    );

    fd.append(
      "proof",
      proof
    );

    setLoading(true);

    try {
      const data = await api(
        "/deposits",
        {
          method: "POST",
          body: fd,
        }
      );

      setMessage(data.message);

      setForm({
        method: "USDT",
        network: "TRC20",
        amount: "",
        walletAddress: "",
        txid: "",
      });

      setProof(null);

      const fileInput =
        document.getElementById(
          "payment-proof-input"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      if (onDone) {
        onDone();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <small>DEPOSIT</small>

        <h2>
          Deposit Funds
        </h2>

        <p>
          Send USDT to the wallet address
          below and submit your payment
          details.
        </p>
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {message && (
        <div className="success-box">
          {message}
        </div>
      )}

      <div className="panel-card deposit-wallet-card">
        <div className="panel-head">
          <div>
            <h3>
              Deposit Wallet
            </h3>

            <span>
              Send USDT only to the selected
              network address.
            </span>
          </div>
        </div>

        {form.method === "USDT" && (
          <div className="deposit-wallet-box">
            <div className="deposit-wallet-info">
              <div className="deposit-network-badge">
                {selectedWallet.label}
              </div>

              <h4>
                Payment Address
              </h4>

              <div className="deposit-address-row">
                <div className="deposit-address">
                  {selectedWallet.address}
                </div>

                <button
                  type="button"
                  className="copy-address-btn"
                  onClick={copyAddress}
                >
                  📋 Copy
                </button>
              </div>

              <div className="deposit-warning">
                ⚠️ Send USDT on{" "}
                <strong>
                  {form.network}
                </strong>{" "}
                network only.
              </div>
            </div>

            <div className="deposit-qr-box">
              <img
                src={qrCodeUrl}
                alt={`${selectedWallet.label} QR Code`}
              />

              <strong>
                Scan to Pay
              </strong>

              <small>
                {form.network} Network
              </small>
            </div>
          </div>
        )}
      </div>

      <div className="panel-card">
        <form onSubmit={submit}>
          <label>
            Deposit Method
          </label>

          <select
            value={form.method}
            onChange={(e) =>
              setForm({
                ...form,
                method: e.target.value,
              })
            }
          >
            <option value="USDT">
              USDT
            </option>

            <option value="CASH">
              CASH
            </option>
          </select>

          {form.method === "USDT" && (
            <>
              <label>
                Network
              </label>

              <select
                value={form.network}
                onChange={(e) =>
                  setForm({
                    ...form,
                    network: e.target.value,
                  })
                }
              >
                <option value="TRC20">
                  TRC20
                </option>

                <option value="BEP20">
                  BEP20
                </option>
              </select>
            </>
          )}

          <label>
            Amount
          </label>

          <input
            type="number"
            min="1"
            placeholder="Enter amount"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: e.target.value,
              })
            }
            required
          />

          <label>
            Your Wallet Address
          </label>

          <input
            placeholder="Enter your sending wallet address"
            value={form.walletAddress}
            onChange={(e) =>
              setForm({
                ...form,
                walletAddress: e.target.value,
              })
            }
          />

          <label>
            Transaction Hash / TXID
          </label>

          <input
            placeholder="Enter TXID"
            value={form.txid}
            onChange={(e) =>
              setForm({
                ...form,
                txid: e.target.value,
              })
            }
          />

          <label>
            Payment Proof
          </label>

          <input
            id="payment-proof-input"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) =>
              setProof(
                e.target.files?.[0] || null
              )
            }
            required
          />

          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : "Submit Deposit"}
          </button>
        </form>
      </div>
    </>
  );
}

/* =====================================================
   WITHDRAW
===================================================== */

function Withdraw({
  user,
  onDone,
}) {
  const [form, setForm] =
    useState({
      source: "balance",
      amount: "",
      network: "TRC20",
      walletAddress: "",
      transactionPassword: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const maxAvailable =
    useMemo(() => {
      if (
        form.source ===
        "profit"
      ) {
        return Number(
          user.profit || 0
        );
      }

      if (
        form.source ===
        "referralReward"
      ) {
        return Number(
          user.referralReward ||
            0
        );
      }

      return Number(
        user.balance || 0
      );
    }, [form.source, user]);

  async function submit(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (
      Number(form.amount) >
      maxAvailable
    ) {
      setError(
        "Withdrawal amount available balance से ज्यादा है."
      );
      return;
    }

    setLoading(true);

    try {
      const data = await api(
        "/withdrawals",
        {
          method: "POST",
          body: JSON.stringify(
            form
          ),
        }
      );

      setMessage(data.message);

      setForm({
        ...form,
        amount: "",
        walletAddress: "",
        transactionPassword:
          "",
      });

      if (onDone) {
        onDone();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <small>WITHDRAW</small>

        <h2>
          Withdraw Funds
        </h2>

        <p>
          Request a withdrawal from
          your available balance.
        </p>
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {message && (
        <div className="success-box">
          {message}
        </div>
      )}

      <div className="panel-card">
        <div className="withdraw-balances">
          <div>
            Wallet Balance

            <strong>
              $
              {Number(
                user.balance || 0
              ).toFixed(2)}
            </strong>
          </div>

          <div>
            Profit

            <strong>
              $
              {Number(
                user.profit || 0
              ).toFixed(2)}
            </strong>
          </div>

          <div>
            Referral Reward

            <strong>
              $
              {Number(
                user.referralReward ||
                  0
              ).toFixed(2)}
            </strong>
          </div>
        </div>

        <form onSubmit={submit}>
          <label>
            Withdrawal Source
          </label>

          <select
            value={form.source}
            onChange={(e) =>
              setForm({
                ...form,
                source:
                  e.target.value,
              })
            }
          >
            <option value="balance">
              💰 Wallet Balance
            </option>

            <option value="profit">
              📈 Profit
            </option>

            <option
              value="referralReward"
              disabled={
                (user.referrals
                  ?.length ||
                  0) < 3
              }
            >
              🎁 Referral Reward
              {(user.referrals
                ?.length ||
                0) < 3
                ? " — 3 referrals required"
                : ""}
            </option>
          </select>

          <div className="available-box">
            Maximum available:

            <strong>
              {" "}
              $
              {maxAvailable.toFixed(
                2
              )}
            </strong>
          </div>

          <label>
            Withdrawal Amount
          </label>

          <input
            type="number"
            min="1"
            max={maxAvailable}
            placeholder="Enter amount"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount:
                  e.target.value,
              })
            }
            required
          />

          <label>
            Network
          </label>

          <select
            value={form.network}
            onChange={(e) =>
              setForm({
                ...form,
                network:
                  e.target.value,
              })
            }
          >
            <option value="TRC20">
              TRC20
            </option>

            <option value="BEP20">
              BEP20
            </option>
          </select>

          <label>
            Wallet Address
          </label>

          <input
            placeholder="Enter wallet address"
            value={
              form.walletAddress
            }
            onChange={(e) =>
              setForm({
                ...form,
                walletAddress:
                  e.target.value,
              })
            }
            required
          />

          <label>
            Transaction Password
          </label>

          <input
            type="password"
            placeholder={
              user.transactionPasswordHash
                ? "Enter transaction password"
                : "Create transaction password from Settings first"
            }
            value={
              form.transactionPassword
            }
            onChange={(e) =>
              setForm({
                ...form,
                transactionPassword:
                  e.target.value,
              })
            }
            required
          />

          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : "Request Withdrawal"}
          </button>
        </form>
      </div>
    </>
  );
}

/* =====================================================
   TRANSACTIONS
===================================================== */

function Transactions({
  data,
}) {
  return (
    <>
      <div className="page-title">
        <small>
          TRANSACTIONS
        </small>

        <h2>
          Transactions
        </h2>

        <p>
          Complete transaction history.
        </p>
      </div>

      <div className="panel-card">
        {data.transactions
          ?.length ? (
          <TransactionTable
            transactions={
              data.transactions
            }
          />
        ) : (
          <div className="empty">
            No transactions yet.
          </div>
        )}
      </div>
    </>
  );
}

/* =====================================================
   LIVE TRADING
===================================================== */

function LiveTrading({ user, data }) {
  const totalDeposit = Number(user?.totalDeposit || 0);
  const balance = Number(user?.balance || 0);
  const profit = Number(user?.profit || 0);
  const dailyProfit = totalDeposit * 0.004;

  const markets = [
    ["BTCUSDT", "BTC", "Bitcoin"],
    ["ETHUSDT", "ETH", "Ethereum"],
    ["BNBUSDT", "BNB", "BNB"],
    ["SOLUSDT", "SOL", "Solana"],
    ["XRPUSDT", "XRP", "XRP"],
    ["ADAUSDT", "ADA", "Cardano"],
    ["DOGEUSDT", "DOGE", "Dogecoin"],
    ["TRXUSDT", "TRX", "TRON"],
    ["AVAXUSDT", "AVAX", "Avalanche"],
    ["LINKUSDT", "LINK", "Chainlink"],
  ];

  const [selected, setSelected] = useState("BTCUSDT");
  const [prices, setPrices] = useState({});
  const [history, setHistory] = useState({});
  const [orderBooks, setOrderBooks] = useState({});
  const [side, setSide] = useState("BUY");

  const selectedMarket =
    markets.find((m) => m[0] === selected) || markets[0];

  useEffect(() => {
    const streams = markets
      .flatMap((m) => [
        `${m[0].toLowerCase()}@trade`,
        `${m[0].toLowerCase()}@depth5@100ms`,
      ])
      .join("/");

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${streams}`
    );

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const tick = payload?.data;

        if (!tick) return;

        const streamName = payload?.stream || "";
        const streamSymbol = streamName.split("@")[0].toUpperCase();
        const symbol = tick.s || streamSymbol;

        if (tick.e === "trade") {
          const price = Number(tick.p);

          if (!symbol || !Number.isFinite(price)) return;

          setPrices((prev) => ({
            ...prev,
            [symbol]: price,
          }));

          if (symbol === selected) {
            setHistory((prev) => {
              const old = prev[symbol] || [];
              return {
                ...prev,
                [symbol]: [...old, price].slice(-80),
              };
            });
          }
        }

        if ((tick.e === "depthUpdate" || (Array.isArray(tick.a) && Array.isArray(tick.b))) && symbol) {
          const asks = Array.isArray(tick.a)
            ? tick.a
                .map(([price, amount]) => [
                  Number(price),
                  Number(amount),
                ])
                .filter(
                  ([price, amount]) =>
                    Number.isFinite(price) &&
                    Number.isFinite(amount) &&
                    amount > 0
                )
                .slice(0, 5)
            : [];

          const bids = Array.isArray(tick.b)
            ? tick.b
                .map(([price, amount]) => [
                  Number(price),
                  Number(amount),
                ])
                .filter(
                  ([price, amount]) =>
                    Number.isFinite(price) &&
                    Number.isFinite(amount) &&
                    amount > 0
                )
                .slice(0, 5)
            : [];

          setOrderBooks((prev) => ({
            ...prev,
            [symbol]: { asks, bids },
          }));
        }
      } catch {}
    };

    ws.onerror = () => {};

    return () => {
      try {
        ws.close();
      } catch {}
    };
  }, [selected]);

  useEffect(() => {
    const symbol = selected.toLowerCase();
    const depthWs = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol}@depth5@100ms`
    );

    depthWs.onmessage = (event) => {
      try {
        const book = JSON.parse(event.data);
        const asks = Array.isArray(book.asks)
          ? book.asks
              .map(([price, amount]) => [Number(price), Number(amount)])
              .filter(([price, amount]) => Number.isFinite(price) && Number.isFinite(amount) && amount > 0)
              .slice(0, 5)
          : [];
        const bids = Array.isArray(book.bids)
          ? book.bids
              .map(([price, amount]) => [Number(price), Number(amount)])
              .filter(([price, amount]) => Number.isFinite(price) && Number.isFinite(amount) && amount > 0)
              .slice(0, 5)
          : [];

        setOrderBooks((prev) => ({
          ...prev,
          [selected]: { asks, bids },
        }));
      } catch {}
    };

    return () => {
      try {
        depthWs.close();
      } catch {}
    };
  }, [selected]);

  const currentOrderBook =
    orderBooks[selected] || { asks: [], bids: [] };

  const asks = [...currentOrderBook.asks]
    .sort((a, b) => a[0] - b[0])
    .slice(-5)
    .reverse();

  const bids = [...currentOrderBook.bids]
    .sort((a, b) => b[0] - a[0])
    .slice(0, 5);

  const currentPrice = prices[selected] || null;
  const selectedHistory = history[selected] || [];

  const chart = useMemo(() => {
    if (selectedHistory.length < 2) return [];

    const min = Math.min(...selectedHistory);
    const max = Math.max(...selectedHistory);
    const padding = (max - min || Math.max(max * 0.0002, 1)) * 0.18;
    const low = min - padding;
    const high = max + padding;
    const range = high - low || 1;

    return selectedHistory.map((price, index) => ({
      x: (index / Math.max(selectedHistory.length - 1, 1)) * 1000,
      y: 315 - ((price - low) / range) * 270,
    }));
  }, [selectedHistory]);

  const chartPath = chart.length
    ? chart
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ")
    : "";

  const formatPrice = (price) => {
    if (!Number.isFinite(price)) return "—";
    if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  return (
    <>
      <div className="page-title performance-title">
        <small>MARKETS</small>
        <h2>Live Trading</h2>
        <p>Real-time cryptocurrency market prices powered by Binance public market data.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>💰</span>
          <small>Total Deposit</small>
          <strong>${totalDeposit.toFixed(2)}</strong>
        </div>

        <div className="stat-card">
          <span>📈</span>
          <small>Daily Profit (0.4%)</small>
          <strong>${dailyProfit.toFixed(2)}</strong>
        </div>

        <div className="stat-card">
          <span>💎</span>
          <small>Total Profit</small>
          <strong>${profit.toFixed(2)}</strong>
        </div>

        <div className="stat-card">
          <span>💵</span>
          <small>Wallet Balance</small>
          <strong>${balance.toFixed(2)}</strong>
        </div>
      </div>

      <div className="binance-terminal">
        <div className="market-strip">
          <div className="market-strip-title">
            <span>⭐</span>
            <strong>Markets</strong>
          </div>

          <div className="market-strip-scroll">
            {markets.map(([symbol, coin, name]) => (
              <button
                key={symbol}
                className={`market-chip ${selected === symbol ? "active" : ""}`}
                onClick={() => setSelected(symbol)}
              >
                <strong>{coin}/USDT</strong>
                <span>{formatPrice(prices[symbol])}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="trading-market-head">
          <div className="trading-pair">
            <span className="coin-logo">{selectedMarket[1][0]}</span>
            <div>
              <strong>{selectedMarket[1]} / USDT</strong>
              <small>{selectedMarket[2]} • Spot Market</small>
            </div>
          </div>

          <div className="trading-price">
            <strong>{formatPrice(currentPrice)}</strong>
            <span>● LIVE</span>
          </div>

          <div className="market-stat">
            <small>24h Change</small>
            <strong className="positive">+ Live Market</strong>
          </div>

          <div className="market-stat">
            <small>24h High</small>
            <strong>Live</strong>
          </div>

          <div className="market-stat">
            <small>24h Low</small>
            <strong>Live</strong>
          </div>
        </div>

        <div className="trading-main">
          <div className="trading-chart-panel">
            <div className="chart-toolbar">
              <span>Chart</span>
              <button className="active">1m</button>
              <button>5m</button>
              <button>15m</button>
              <button>1H</button>
              <button>4H</button>
              <button>1D</button>
            </div>

            <div className="binance-chart">
              <div className="chart-grid">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <svg viewBox="0 0 1000 360" preserveAspectRatio="none">
                {chartPath && (
                  <>
                    <path
                      d={`${chartPath} L 1000 360 L 0 360 Z`}
                      className="chart-fill"
                    />
                    <path
                      d={chartPath}
                      className="chart-line"
                      fill="none"
                    />
                  </>
                )}
              </svg>

              {!currentPrice && (
                <div className="chart-loading">
                  Connecting to live market…
                </div>
              )}
            </div>

            <div className="chart-bottom">
              <span>LIVE DATA</span>
              <span>{selectedMarket[1]}/USDT</span>
              <strong>0.4% DAILY WALLET PROFIT</strong>
            </div>
          </div>

          <div className="orderbook-panel">
            <div className="orderbook-head">
              <strong>Order Book</strong>
              <span>Live</span>
            </div>

            <div className="orderbook-cols">
              <span>Price(USDT)</span>
              <span>Amount</span>
              <span>Total</span>
            </div>

            <div className="order-rows">
              {asks.map(([price, amount], index) => (
                <div className="order-row sell" key={`ask-${price}-${index}`}>
                  <span>{formatPrice(price).replace("$", "")}</span>
                  <span>{amount.toFixed(5)}</span>
                  <span>{(price * amount).toFixed(2)}</span>
                </div>
              ))}

              {asks.length === 0 && (
                <div className="order-empty">
                  Connecting live order book…
                </div>
              )}

              <div className="order-mid">
                <strong>{formatPrice(currentPrice)}</strong>
                <span>↕ Live Price</span>
              </div>

              {bids.map(([price, amount], index) => (
                <div className="order-row buy" key={`bid-${price}-${index}`}>
                  <span>{formatPrice(price).replace("$", "")}</span>
                  <span>{amount.toFixed(5)}</span>
                  <span>{(price * amount).toFixed(2)}</span>
                </div>
              ))}

              {bids.length === 0 && (
                <div className="order-empty">
                  Connecting live order book…
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="trade-panel">
          <div className="trade-tabs">
            <button
              className={side === "BUY" ? "active buy-tab" : ""}
              onClick={() => setSide("BUY")}
            >
              Buy
            </button>
            <button
              className={side === "SELL" ? "active sell-tab" : ""}
              onClick={() => setSide("SELL")}
            >
              Sell
            </button>
          </div>

          <div className="trade-form">
            <div className="trade-field">
              <span>Available</span>
              <strong>${balance.toFixed(2)} USDT</strong>
            </div>

            <label>
              Price
              <div className="trade-input">
                <input
                  value={currentPrice ? currentPrice.toFixed(4) : ""}
                  readOnly
                  placeholder="Live price"
                />
                <span>USDT</span>
              </div>
            </label>

            <label>
              Amount
              <div className="trade-input">
                <input placeholder="0.000000" />
                <span>{selectedMarket[1]}</span>
              </div>
            </label>

            <label>
              Total
              <div className="trade-input">
                <input placeholder="0.00" />
                <span>USDT</span>
              </div>
            </label>

            <button className={`trade-action ${side === "BUY" ? "buy-action" : "sell-action"}`}>
              {side} {selectedMarket[1]}
            </button>

            <small className="trade-notice">
              Trading execution is not connected to an exchange account.
            </small>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel-card">
          <div className="panel-head">
            <h3>Today's Profit</h3>
            <span>0.4%</span>
          </div>
          <div className="performance-value">
            <strong>${dailyProfit.toFixed(2)}</strong>
            <span>Daily credited profit</span>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-head">
            <h3>Profit Summary</h3>
            <span>ACTIVE</span>
          </div>
          <div className="performance-value">
            <strong>${profit.toFixed(2)}</strong>
            <span>Total accumulated profit</span>
          </div>
        </div>
      </div>

      <div className="panel-card profit-activity-panel">
        <div className="panel-head">
          <h3>Profit Activity</h3>
          <span>Wallet linked</span>
        </div>

        <div className="row">
          <span>
            📈 <b>Daily profit rate</b>
            <small>Calculated from total deposit</small>
          </span>
          <strong>0.40%</strong>
        </div>

        <div className="row">
          <span>
            💰 <b>Current wallet balance</b>
            <small>Including credited profit</small>
          </span>
          <strong>${balance.toFixed(2)}</strong>
        </div>

        <div className="row">
          <span>
            💎 <b>Total credited profit</b>
            <small>Accumulated in your account</small>
          </span>
          <strong>${profit.toFixed(2)}</strong>
        </div>
      </div>
    </>
  );
}

/* =====================================================
   PERFORMANCE
===================================================== */

function Performance({ user }) {
  const totalDeposit = Number(user?.totalDeposit || 0);
  const profit = Number(user?.profit || 0);
  const dailyProfit = totalDeposit * 0.004;

  const chartMax = Math.max(dailyProfit, profit, 1);
  const current = Math.min(92, 28 + (profit / chartMax) * 60);

  const points = [
    18,
    24,
    21,
    32,
    29,
    43,
    39,
    52,
    48,
    61,
    57,
    current
  ];

  return (
    <>
      <div className="page-title performance-title">
        <small>PERFORMANCE</small>
        <h2>Live Trading Performance</h2>
        <p>
          Your actual credited profit based on the 0.4% daily return.
        </p>
      </div>

      <div className="performance-summary">
        <div className="performance-value">
          <span>Daily Profit (0.4%)</span>
          <strong>${dailyProfit.toFixed(2)}</strong>
        </div>

        <div className="live-indicator">
          <i /> LIVE
        </div>
      </div>

      <div className="panel-card live-chart-card">
        <div className="chart-header">
          <div>
            <strong>Tradenex Live Trading</strong>
            <small>Actual credited profit performance</small>
          </div>

          <span>LIVE</span>
        </div>

        <div className="live-chart">
          <div className="chart-grid">
            <span />
            <span />
            <span />
            <span />
          </div>

          <svg
            className="chart-svg"
            viewBox="0 0 1000 360"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="profitArea"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#328bff"
                  stopOpacity="0.38"
                />
                <stop
                  offset="100%"
                  stopColor="#328bff"
                  stopOpacity="0"
                />
              </linearGradient>

              <filter id="profitGlow">
                <feGaussianBlur
                  stdDeviation="3"
                  result="blur"
                />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <polygon
              points={`0,360 ${points.map((value, index) => {
                const x =
                  (index / (points.length - 1)) * 1000;
                const y =
                  320 - value * 2.7;
                return `${x},${y}`;
              }).join(" ")} 1000,360`}
              fill="url(#profitArea)"
            />

            <polyline
              points={points.map((value, index) => {
                const x =
                  (index / (points.length - 1)) * 1000;
                const y =
                  320 - value * 2.7;
                return `${x},${y}`;
              }).join(" ")}
              fill="none"
              stroke="#3d8fff"
              strokeWidth="5"
              filter="url(#profitGlow)"
            />
          </svg>

          <div className="chart-candles">
            {points.map((value, index) => (
              <div
                className="candle"
                key={index}
                style={{
                  height:
                    `${Math.max(20, value * 0.65)}px`
                }}
              >
                <i />
              </div>
            ))}
          </div>
        </div>

        <div className="chart-footer">
          <span>DAILY</span>
          <span>0.4%</span>
          <span className="active">LIVE</span>
        </div>
      </div>

      <div className="panel-card">
        <div className="chart-header">
          <div>
            <strong>Total Credited Profit</strong>
            <small>
              Profit actually added to your wallet
            </small>
          </div>
        </div>

        <div className="performance-value">
          <strong>${profit.toFixed(2)}</strong>
        </div>
      </div>
    </>
  );
}

/* =====================================================
   REFERRALS
===================================================== */

function Referrals({
  user,
  data,
}) {
  const count =
    data.referrals?.length || 0;

  return (
    <>
      <div className="page-title">
        <small>
          REFERRALS
        </small>

        <h2>
          Referral Program
        </h2>

        <p>
          Invite users and earn
          referral rewards.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>👥</span>

          <small>
            Total Referrals
          </small>

          <strong>
            {count}
          </strong>
        </div>

        <div className="stat-card">
          <span>🎁</span>

          <small>
            Referral Reward
          </small>

          <strong>
            $
            {Number(
              user.referralReward ||
                0
            ).toFixed(2)}
          </strong>
        </div>
      </div>

      <div className="panel-card">
        <h3>
          Your Referral Code
        </h3>

        <div className="referral-code big">
          {user.referralCode ||
            "—"}
        </div>

        <p>
          इस code को अपने friends
          के साथ share करें।
        </p>

        <div className="referral-info">
          <strong>
            Reward per referral:
          </strong>{" "}
          $10
        </div>

        <div className="referral-info">
          <strong>
            Withdrawal unlock:
          </strong>{" "}
          3 referrals
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-head">
          <h3>
            Your Referrals
          </h3>
        </div>

        {count === 0 ? (
          <div className="empty">
            अभी कोई referral नहीं
            है।
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Reward</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {data.referrals.map(
                  (ref) => (
                    <tr
                      key={
                        ref.userId
                      }
                    >
                      <td>
                        {ref.name}
                      </td>

                      <td>
                        {ref.email}
                      </td>

                      <td>
                        $
                        {Number(
                          ref.reward ||
                            10
                        ).toFixed(2)}
                      </td>

                      <td>
                        {ref.createdAt
                          ? new Date(
                              ref.createdAt
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* =====================================================
   PROFILE
===================================================== */

function Profile({
  user,
  refresh,
}) {
  const [form, setForm] =
    useState({
      firstName:
        user.firstName || "",
      lastName:
        user.lastName || "",
      mobile:
        user.mobile ||
        user.phone ||
        "",
      address:
        user.address || "",
      country:
        user.country || "",
    });

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await api(
        "/profile",
        {
          method: "POST",
          body: JSON.stringify(
            form
          ),
        }
      );

      localStorage.setItem(
        "tradenex_user",
        JSON.stringify(data.user)
      );

      setMessage(data.message);

      if (refresh) {
        refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <small>PROFILE</small>

        <h2>
          My Profile
        </h2>

        <p>
          Manage your personal
          information.
        </p>
      </div>

      {message && (
        <div className="success-box">
          {message}
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="panel-card">
        <form onSubmit={submit}>
          <div className="two-col">
            <div>
              <label>
                First Name
              </label>

              <input
                value={
                  form.firstName
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    firstName:
                      e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label>
                Last Name
              </label>

              <input
                value={
                  form.lastName
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    lastName:
                      e.target.value,
                  })
                }
              />
            </div>
          </div>

          <label>
            Mobile
          </label>

          <input
            value={form.mobile}
            onChange={(e) =>
              setForm({
                ...form,
                mobile:
                  e.target.value,
              })
            }
          />

          <label>
            Email
          </label>

          <input
            value={user.email}
            disabled
          />

          <label>
            Address
          </label>

          <textarea
            rows="4"
            value={
              form.address
            }
            onChange={(e) =>
              setForm({
                ...form,
                address:
                  e.target.value,
              })
            }
          />

          <label>
            Country
          </label>

          <input
            value={
              form.country
            }
            onChange={(e) =>
              setForm({
                ...form,
                country:
                  e.target.value,
              })
            }
          />

          <label>
            Your Referral Code
          </label>

          <input
            value={
              user.referralCode ||
              ""
            }
            disabled
          />

          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : "Save Profile"}
          </button>
        </form>
      </div>
    </>
  );
}

/* =====================================================
   SETTINGS
===================================================== */

function Settings() {
  const [form, setForm] =
    useState({
      oldLoginPassword: "",
      newLoginPassword: "",
      confirmLoginPassword:
        "",

      oldTransactionPassword:
        "",
      newTransactionPassword:
        "",
      confirmTransactionPassword:
        "",
    });

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      form.newLoginPassword &&
      form.newLoginPassword !==
        form.confirmLoginPassword
    ) {
      setError(
        "New login passwords match नहीं हैं."
      );
      return;
    }

    if (
      form.newTransactionPassword &&
      form.newTransactionPassword !==
        form.confirmTransactionPassword
    ) {
      setError(
        "New transaction passwords match नहीं हैं."
      );
      return;
    }

    if (
      !form.newLoginPassword &&
      !form.newTransactionPassword
    ) {
      setError(
        "कम से कम एक password change/create करें."
      );
      return;
    }

    setLoading(true);

    try {
      const data = await api(
        "/settings",
        {
          method: "POST",
          body: JSON.stringify({
            oldPassword:
              form.oldLoginPassword,

            newPassword:
              form.newLoginPassword,

            oldTransactionPassword:
              form.oldTransactionPassword,

            newTransactionPassword:
              form.newTransactionPassword,
          }),
        }
      );

      setMessage(data.message);

      setForm({
        oldLoginPassword: "",
        newLoginPassword: "",
        confirmLoginPassword:
          "",

        oldTransactionPassword:
          "",
        newTransactionPassword:
          "",
        confirmTransactionPassword:
          "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <small>
          SETTINGS
        </small>

        <h2>
          Password Settings
        </h2>

        <p>
          Login और Transaction
          password अलग-अलग होते
          हैं।
        </p>
      </div>

      {message && (
        <div className="success-box">
          {message}
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="panel-card">
        <form onSubmit={submit}>
          <h3>
            🔐 Login Password
          </h3>

          <label>
            Old Login Password
          </label>

          <input
            type="password"
            placeholder="Old login password"
            value={
              form.oldLoginPassword
            }
            onChange={(e) =>
              setForm({
                ...form,
                oldLoginPassword:
                  e.target.value,
              })
            }
          />

          <label>
            New Login Password
          </label>

          <input
            type="password"
            placeholder="New login password"
            value={
              form.newLoginPassword
            }
            onChange={(e) =>
              setForm({
                ...form,
                newLoginPassword:
                  e.target.value,
              })
            }
          />

          <label>
            Confirm New Login
            Password
          </label>

          <input
            type="password"
            placeholder="Confirm new login password"
            value={
              form.confirmLoginPassword
            }
            onChange={(e) =>
              setForm({
                ...form,
                confirmLoginPassword:
                  e.target.value,
              })
            }
          />

          <hr />

          <h3>
            💳 Transaction Password
          </h3>

          <div className="info-box">
            अगर Transaction
            Password पहली बार बना
            रहे हैं तो Old
            Transaction Password
            खाली छोड़ दें।
          </div>

          <label>
            Old Transaction
            Password
          </label>

          <input
            type="password"
            placeholder="Old transaction password"
            value={
              form.oldTransactionPassword
            }
            onChange={(e) =>
              setForm({
                ...form,
                oldTransactionPassword:
                  e.target.value,
              })
            }
          />

          <label>
            Create / New
            Transaction Password
          </label>

          <input
            type="password"
            placeholder="Create new transaction password"
            value={
              form.newTransactionPassword
            }
            onChange={(e) =>
              setForm({
                ...form,
                newTransactionPassword:
                  e.target.value,
              })
            }
          />

          <label>
            Confirm Transaction
            Password
          </label>

          <input
            type="password"
            placeholder="Confirm transaction password"
            value={
              form.confirmTransactionPassword
            }
            onChange={(e) =>
              setForm({
                ...form,
                confirmTransactionPassword:
                  e.target.value,
              })
            }
          />

          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : "Save Password Changes"}
          </button>
        </form>
      </div>

      <div className="panel-card">
        <div className="info-box">
          <strong>
            ध्यान दें:
          </strong>

          <br />

          Login password और
          Transaction password
          अलग रहेंगे।

          <br />

          Withdrawal के समय केवल
          Transaction Password
          इस्तेमाल होगा।
        </div>
      </div>
    </>
  );
}

/* =====================================================
   SUPPORT
===================================================== */

function Support() {
  const [form, setForm] =
    useState({
      category: "General",
      subject: "",
      message: "",
    });

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await api(
        "/support",
        {
          method: "POST",
          body: JSON.stringify(
            form
          ),
        }
      );

      setMessage(data.message);

      setForm({
        category: "General",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <small>SUPPORT</small>

        <h2>Support</h2>

        <p>
          Contact Tradenex support.
        </p>
      </div>

      {message && (
        <div className="success-box">
          {message}
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="panel-card">
        <form onSubmit={submit}>
          <label>
            Category
          </label>

          <select
            value={
              form.category
            }
            onChange={(e) =>
              setForm({
                ...form,
                category:
                  e.target.value,
              })
            }
          >
            <option>
              General
            </option>

            <option>
              Deposit
            </option>

            <option>
              Withdrawal
            </option>

            <option>
              Account
            </option>

            <option>
              Technical
            </option>
          </select>

          <label>
            Subject
          </label>

          <input
            placeholder="Subject"
            value={
              form.subject
            }
            onChange={(e) =>
              setForm({
                ...form,
                subject:
                  e.target.value,
              })
            }
            required
          />

          <label>
            Message
          </label>

          <textarea
            rows="7"
            placeholder="Write your message"
            value={
              form.message
            }
            onChange={(e) =>
              setForm({
                ...form,
                message:
                  e.target.value,
              })
            }
            required
          />

          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Submit Support Request"}
          </button>
        </form>
      </div>
    </>
  );
}

/* =====================================================
   FAQ
===================================================== */

function FAQ() {
  const items = [
    [
      "Referral code क्या है?",
      "हर user को registration के बाद एक unique referral code मिलता है।",
    ],
    [
      "Referral reward कैसे मिलेगा?",
      "जब कोई नया user आपके referral code से registration करता है तो referral आपके account में जुड़ता है और reward मिलता है।",
    ],
    [
      "Referral reward withdrawal कब होगा?",
      "Referral reward withdrawal के लिए minimum 3 successful referrals चाहिए।",
    ],
    [
      "Transaction password क्या है?",
      "यह withdrawal के समय इस्तेमाल होने वाला अलग password है। इसे Settings से पहली बार बनाया जा सकता है।",
    ],
    [
      "Login password भूल गया तो?",
      "Login page पर Forgot Password से registered email के जरिए password reset कर सकते हैं।",
    ],
  ];

  return (
    <>
      <div className="page-title">
        <small>FAQ</small>

        <h2>
          Frequently Asked
          Questions
        </h2>
      </div>

      <div className="panel-card">
        {items.map(
          ([question, answer]) => (
            <details
              key={question}
              className="faq-item"
            >
              <summary>
                {question}
              </summary>

              <p>{answer}</p>
            </details>
          )
        )}
      </div>
    </>
  );
}


/* =====================================================
   LANDING PAGE
===================================================== */

function LandingPage({ onLogin }) {
  return (
    <div className="landing-page">

      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-mark">
            <img src="/tradenex-premium-logo.png" alt="Tradenex" className="tradenex-mark-img" />
          </div>

          <div>
            <strong>TRADENEX</strong>
            <small>SMART TRADING PLATFORM</small>
          </div>
        </div>

        <div className="landing-nav-buttons">
          <button
            className="landing-login-btn"
            onClick={onLogin}
          >
            Login
          </button>

          <button
            className="landing-register-btn"
            onClick={onLogin}
          >
            Create Account
          </button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span></span>
            NEXT GENERATION TRADING
          </div>

          <h1>
            Trade Smarter.
            <br />
            <span>Grow With Confidence.</span>
          </h1>

          <p>
            Experience a simple, powerful and modern
            platform designed to help you manage your
            trading journey with confidence.
          </p>

          <div className="hero-buttons">
            <button
              className="hero-primary-btn"
              onClick={onLogin}
            >
              Get Started
              <span>→</span>
            </button>

            <button
              className="hero-secondary-btn"
              onClick={onLogin}
            >
              Login to Account
            </button>
          </div>

          <div className="hero-trust">
            <div>
              <strong>Secure</strong>
              <small>Account Protection</small>
            </div>

            <div>
              <strong>Fast</strong>
              <small>Easy Transactions</small>
            </div>

            <div>
              <strong>24/7</strong>
              <small>Support</small>
            </div>
          </div>
        </div>

        <div className="hero-visual">

          <div className="floating-orbit orbit-one"></div>
          <div className="floating-orbit orbit-two"></div>

          <div className="hero-logo-card">
            <div className="big-tradenex-logo">
              <img src="/tradenex-premium-logo.png" alt="Tradenex" className="tradenex-logo-img" />
            </div>

            <strong>TRADENEX</strong>
            <small>SMART • SECURE • SIMPLE</small>

            <div className="mini-chart">
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </div>
          </div>
        </div>

      </section>

      <section className="landing-stats">

        <div>
          <span>⚡</span>
          <strong>Fast</strong>
          <small>Easy Platform</small>
        </div>

        <div>
          <span>🔐</span>
          <strong>Secure</strong>
          <small>Protected Account</small>
        </div>

        <div>
          <span>💳</span>
          <strong>Simple</strong>
          <small>Deposit & Withdraw</small>
        </div>

        <div>
          <span>🎧</span>
          <strong>Support</strong>
          <small>We're Here To Help</small>
        </div>

      </section>

      <section className="landing-why">

        <div className="landing-section-title">
          <small>WHY TRADENEX</small>

          <h2>
            Everything You Need
            <br />
            In One Platform
          </h2>

          <p>
            Manage your account, wallet and transactions
            from one simple dashboard.
          </p>
        </div>

        <div className="why-grid">

          <div className="why-card">
            <div>◈</div>
            <h3>Modern Platform</h3>
            <p>
              A clean and easy-to-use experience
              designed for modern users.
            </p>
          </div>

          <div className="why-card">
            <div>🔒</div>
            <h3>Account Security</h3>
            <p>
              Your account and transaction access
              are protected with secure controls.
            </p>
          </div>

          <div className="why-card">
            <div>↗</div>
            <h3>Easy Transactions</h3>
            <p>
              Manage deposits, withdrawals and
              transaction history with ease.
            </p>
          </div>

          <div className="why-card">
            <div>♧</div>
            <h3>Referral Program</h3>
            <p>
              Invite friends and manage your
              referral activity from your dashboard.
            </p>
          </div>

        </div>
      </section>

      <section className="landing-cta">

        <div className="cta-inner">

          <div>
            <small>START YOUR JOURNEY</small>

            <h2>
              Ready to get started?
            </h2>

            <p>
              Create your Tradenex account and
              explore your personal trading dashboard.
            </p>
          </div>

          <button
            onClick={onLogin}
            className="cta-button"
          >
            Enter Tradenex
            <span>→</span>
          </button>

        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-logo">
          <span>₮</span>
          <strong>TRADENEX</strong>
        </div>

        <small>
          © {new Date().getFullYear()} Tradenex.
          All rights reserved.
        </small>
      </footer>

    </div>
  );
}


/* =====================================================
   APP
===================================================== */

export default function App() {
  const [user, setUser] =
    useState(null);

  const [showLanding, setShowLanding] =
    useState(true);

  const [data, setData] =
    useState({
      transactions: [],
      deposits: [],
      withdrawals: [],
      referrals: [],
    });

  const [page, setPage] =
    useState("dashboard");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  async function loadUser() {
    try {
      const token =
        localStorage.getItem(
          "tradenex_token"
        );

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const result =
        await api("/me");

      setUser(result.user);

      setData({
        transactions:
          result.transactions ||
          [],

        deposits:
          result.deposits ||
          [],

        withdrawals:
          result.withdrawals ||
          [],

        referrals:
          result.referrals ||
          [],
      });

      localStorage.setItem(
        "tradenex_user",
        JSON.stringify(
          result.user
        )
      );
    } catch (err) {
      console.error(err);

      localStorage.removeItem(
        "tradenex_token"
      );

      localStorage.removeItem(
        "tradenex_user"
      );

      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();

    const listener = (event) => {
      if (event.detail) {
        setPage(event.detail);
        setSidebarOpen(false);
      }
    };

    window.addEventListener(
      "tradenex-page",
      listener
    );

    return () => {
      window.removeEventListener(
        "tradenex-page",
        listener
      );
    };
  }, []);

  async function logout() {
    try {
      await api("/logout", {
        method: "POST",
      });
    } catch (e) {
      console.log(e);
    }

    localStorage.removeItem(
      "tradenex_token"
    );

    localStorage.removeItem(
      "tradenex_user"
    );

    setUser(null);
    setPage("dashboard");
    setSidebarOpen(false);
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div>
          <h2>Tradenex</h2>
          <p>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showLanding) {
      return (
        <LandingPage
          onLogin={() => setShowLanding(false)}
        />
      );
    }

    return (
      <LoginPage
        onLogin={(loggedUser) => {
          setUser(loggedUser);
          loadUser();
        }}
      />
    );
  }

  const menu = [
    [
      "dashboard",
      "⌂",
      "Dashboard",
    ],
    [
      "wallet",
      "▣",
      "Wallet",
    ],
    [
      "deposit",
      "↓",
      "Deposit",
    ],
    [
      "withdraw",
      "↗",
      "Withdraw",
    ],
    [
      "transactions",
      "⇄",
      "Transactions",
    ],
    [
      "live-trading",
      "📈",
      "Live Trading",
    ],
    [
      "performance",
      "↗",
      "Performance",
    ],
    [
      "referrals",
      "♧",
      "Referrals",
    ],
    [
      "profile",
      "♙",
      "Profile",
    ],
    [
      "settings",
      "⚙",
      "Settings",
    ],
    [
      "support",
      "?",
      "Support",
    ],
    [
      "faq",
      "?",
      "FAQ",
    ],
  ];

  function openPage(key) {
    setPage(key);
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={
          sidebarOpen
            ? "sidebar sidebar-open"
            : "sidebar"
        }
      >
        <div className="mobile-sidebar-close">
          <button
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            ×
          </button>
        </div>

        <div className="logo">
          <span>₮</span>

          <b>Tradenex</b>

          <small>
            USER PANEL
          </small>
        </div>

        <div className="menu-title">
          MAIN MENU
        </div>

        {menu.map(
          ([key, icon, label]) => (
            <button
              key={key}
              className={
                page === key
                  ? "menu-item active"
                  : "menu-item"
              }
              onClick={() =>
                openPage(key)
              }
            >
              <span>
                {icon}
              </span>

              <b>{label}</b>
            </button>
          )
        )}

        <div className="menu-title">
          ACCOUNT
        </div>

        <button
          className="menu-item"
          onClick={logout}
        >
          <span>↪</span>
          <b>Logout</b>
        </button>

        <div className="sidebar-bottom">
          <strong>
            TRADENEX
          </strong>

          <small>
            Secure User Portal
          </small>
        </div>
      </aside>

      {/* MAIN */}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="Open menu"
            >
              ☰
            </button>

            <div>
              <h3>
                {
                  menu.find(
                    (x) =>
                      x[0] === page
                  )?.[2]
                }
              </h3>

              <small>
                Tradenex User
                Dashboard
              </small>
            </div>
          </div>

          <div className="top-user">
            <span className="notification">
              🔔
            </span>

            <div>
              <strong>
                {user.name ||
                  "User"}
              </strong>

              <small>
                {user.email}
              </small>
            </div>

            <button
              onClick={logout}
              className="logout-btn"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="content">
          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {page ===
            "dashboard" && (
            <Dashboard
              user={user}
              data={data}
            />
          )}

          {page === "wallet" && (
            <Wallet user={user} />
          )}

          {page ===
            "deposit" && (
            <Deposit
              onDone={loadUser}
            />
          )}

          {page ===
            "withdraw" && (
            <Withdraw
              user={user}
              onDone={loadUser}
            />
          )}

          {page ===
            "transactions" && (
            <Transactions
              data={data}
            />
          )}

          {page ===
            "live-trading" && (
            <LiveTrading
              user={user}
              data={data}
            />
          )}

          {page ===
            "performance" && (
            <Performance
              user={user}
            />
          )}

          {page ===
            "referrals" && (
            <Referrals
              user={user}
              data={data}
            />
          )}

          {page === "profile" && (
            <Profile
              user={user}
              refresh={loadUser}
            />
          )}

          {page ===
            "settings" && (
            <Settings />
          )}

          {page === "support" && (
            <Support />
          )}

          {page === "faq" && (
            <FAQ />
          )}
        </section>
      </main>
    </div>
  );
}