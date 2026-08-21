const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const app = express();

const PORT = Number(process.env.PORT || 5000);

const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const USERS_FILE = path.join(DATA_DIR, "users.json");
const DEPOSITS_FILE = path.join(DATA_DIR, "deposits.json");
const WITHDRAWALS_FILE = path.join(DATA_DIR, "withdrawals.json");
const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");
const SUPPORT_FILE = path.join(DATA_DIR, "support.json");

const REFERRAL_REWARD = 10;

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "20mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

/* =====================================================
   DIRECTORIES
===================================================== */

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {
    recursive: true,
  });
}

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, {
    recursive: true,
  });
}

/* =====================================================
   FILE HELPERS
===================================================== */

function read(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(
        file,
        JSON.stringify(fallback, null, 2)
      );

      return fallback;
    }

    const text = fs.readFileSync(
      file,
      "utf8"
    );

    if (!text.trim()) {
      return fallback;
    }

    return JSON.parse(text);
  } catch (error) {
    console.error(
      "READ ERROR:",
      file,
      error
    );

    return fallback;
  }
}

function write(file, data) {
  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2)
  );
}

function makeId(prefix) {
  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    crypto
      .randomBytes(4)
      .toString("hex")
  );
}

function hash(value) {
  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex");
}

function now() {
  return new Date().toISOString();
}

function clean(value) {
  return String(value || "").trim();
}

/* =====================================================
   PUBLIC USER
===================================================== */

function publicUser(user) {
  return {
    id: user.id,

    name: user.name || "",

    firstName:
      user.firstName || "",

    lastName:
      user.lastName || "",

    email:
      user.email || "",

    phone:
      user.phone || "",

    mobile:
      user.mobile || "",

    address:
      user.address || "",

    country:
      user.country || "",

    balance:
      Number(user.balance || 0),

    totalDeposit:
      Number(user.totalDeposit || 0),

    pendingDeposit:
      Number(user.pendingDeposit || 0),

    profit:
      Number(user.profit || 0),

    referralReward:
      Number(user.referralReward || 0),

    referralCode:
      user.referralCode || "",

    referrals:
      Array.isArray(user.referrals)
        ? user.referrals
        : [],

    createdAt:
      user.createdAt || "",
  };
}

/* =====================================================
   AUTH
===================================================== */

function getToken(req) {
  const header =
    req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.substring(7);
}

function getUserFromRequest(req) {
  const token = getToken(req);

  if (!token) {
    return null;
  }

  const users =
    read(USERS_FILE);

  return (
    users.find(
      (u) =>
        u.sessionToken === token
    ) || null
  );
}

function auth(req, res, next) {
  const user =
    getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      message:
        "Please login first.",
    });
  }

  req.user = user;

  next();
}

/* =====================================================
   TRANSACTIONS
===================================================== */

function createTransaction(
  userId,
  type,
  method,
  network,
  amount,
  status,
  referenceId,
  source = ""
) {
  const transactions =
    read(TRANSACTIONS_FILE);

  const transaction = {
    id: makeId("TX"),

    txnId: makeId("TXN"),

    userId,

    type,

    method:
      method || "",

    network:
      network || "",

    amount:
      Number(amount || 0),

    status,

    source:
      source || "",

    referenceId:
      referenceId || "",

    createdAt:
      now(),
  };

  transactions.push(
    transaction
  );

  write(
    TRANSACTIONS_FILE,
    transactions
  );

  return transaction;
}

/* =====================================================
   MULTER / UPLOAD
===================================================== */

const storage =
  multer.diskStorage({
    destination(
      req,
      file,
      cb
    ) {
      cb(
        null,
        UPLOAD_DIR
      );
    },

    filename(
      req,
      file,
      cb
    ) {
      const safeName =
        String(
          file.originalname ||
            "file"
        ).replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      cb(
        null,
        `${Date.now()}_${crypto
          .randomBytes(4)
          .toString(
            "hex"
          )}_${safeName}`
      );
    },
  });

const upload =
  multer({
    storage,

    limits: {
      fileSize:
        10 * 1024 * 1024,
    },

    fileFilter(
      req,
      file,
      cb
    ) {
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
        "application/pdf",
      ];

      if (
        allowed.includes(
          file.mimetype
        )
      ) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Only JPG, PNG, WEBP or PDF files are allowed."
          )
        );
      }
    },
  });

/*
  Uploaded files are publicly accessible
  through /uploads/filename
*/

app.use(
  "/uploads",
  express.static(
    UPLOAD_DIR
  )
);

/* =====================================================
   HEALTH
===================================================== */

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,

      message:
        "Tradenex Backend is running",

      port:
        PORT,
    });
  }
);

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,

      status:
        "ok",
    });
  }
);

/* =====================================================
   REGISTER
===================================================== */

app.post(
  "/api/register",
  (req, res) => {
    try {
      const {
        name,
        firstName,
        lastName,
        email,
        password,
        phone,
        mobile,
        address,
        country,
        referralCode,
      } = req.body;

      const fName =
        clean(
          firstName ||
            name
        );

      const lName =
        clean(lastName);

      const fullName =
        `${fName} ${lName}`.trim();

      const cleanEmail =
        clean(email)
          .toLowerCase();

      const phoneValue =
        clean(
          mobile ||
            phone
        );

      if (!fName) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "First name required.",
          });
      }

      if (
        !cleanEmail.includes(
          "@"
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Valid email required.",
          });
      }

      if (
        String(
          password || ""
        ).length < 6
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Password minimum 6 characters.",
          });
      }

      if (!phoneValue) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Mobile number required.",
          });
      }

      const users =
        read(USERS_FILE);

      const existing =
        users.find(
          (u) =>
            String(
              u.email || ""
            ).toLowerCase() ===
            cleanEmail
        );

      if (existing) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "Email already registered.",
          });
      }

      /* ==========================================
         CREATE UNIQUE REFERRAL CODE
      ========================================== */

      let generatedReferralCode =
        "";

      do {
        generatedReferralCode =
          "TN" +
          crypto
            .randomBytes(4)
            .toString(
              "hex"
            )
            .toUpperCase();
      } while (
        users.some(
          (u) =>
            u.referralCode ===
            generatedReferralCode
        )
      );

      /* ==========================================
         NEW USER
      ========================================== */

      const user = {
        id:
          makeId("USR"),

        firstName:
          fName,

        lastName:
          lName,

        name:
          fullName,

        email:
          cleanEmail,

        phone:
          phoneValue,

        mobile:
          phoneValue,

        address:
          clean(address),

        country:
          clean(country),

        passwordHash:
          hash(password),

        /*
          New users do not have
          a transaction password.
          They create it from Settings.
        */
        transactionPasswordHash:
          "",

        balance:
          0,

        totalDeposit:
          0,

        pendingDeposit:
          0,

        profit:
          0,

        referralCode:
          generatedReferralCode,

        referralReward:
          0,

        referrals:
          [],

        sessionToken:
          "",

        createdAt:
          now(),
      };

      /* ==========================================
         REFERRAL
      ========================================== */

      const enteredReferral =
        clean(
          referralCode
        ).toUpperCase();

      if (enteredReferral) {
        const referrer =
          users.find(
            (u) =>
              String(
                u.referralCode ||
                  ""
              ).toUpperCase() ===
              enteredReferral
          );

        if (!referrer) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid referral code.",
            });
        }

        if (
          !Array.isArray(
            referrer.referrals
          )
        ) {
          referrer.referrals =
            [];
        }

        referrer.referrals.push({
          userId:
            user.id,

          name:
            user.name,

          email:
            user.email,

          reward:
            REFERRAL_REWARD,

          createdAt:
            now(),
        });

        referrer.referralReward =
          Number(
            referrer.referralReward ||
              0
          ) +
          REFERRAL_REWARD;
      }

      users.push(user);

      write(
        USERS_FILE,
        users
      );

      res
        .status(201)
        .json({
          success:
            true,

          message:
            "Registration successful.",

          user:
            publicUser(
              user
            ),
        });
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            "Registration failed.",
        });
    }
  }
);

/* =====================================================
   LOGIN
===================================================== */

app.post(
  "/api/login",
  (req, res) => {
    try {
      const email =
        clean(
          req.body.email
        ).toLowerCase();

      const password =
        String(
          req.body.password ||
            ""
        );

      const users =
        read(USERS_FILE);

      const index =
        users.findIndex(
          (u) =>
            String(
              u.email || ""
            ).toLowerCase() ===
              email &&
            u.passwordHash ===
              hash(password)
        );

      if (index === -1) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Invalid email or password.",
          });
      }

      const token =
        crypto.randomBytes(
          32
        ).toString(
          "hex"
        );

      users[index].sessionToken =
        token;

      write(
        USERS_FILE,
        users
      );

      res.json({
        success:
          true,

        message:
          "Login successful.",

        token,

        user:
          publicUser(
            users[index]
          ),
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            "Login failed.",
        });
    }
  }
);

/* =====================================================
   LOGOUT
===================================================== */

app.post(
  "/api/logout",
  auth,
  (req, res) => {
    const users =
      read(USERS_FILE);

    const index =
      users.findIndex(
        (u) =>
          u.id ===
          req.user.id
      );

    if (index !== -1) {
      users[index].sessionToken =
        "";

      write(
        USERS_FILE,
        users
      );
    }

    res.json({
      success:
        true,

      message:
        "Logged out successfully.",
    });
  }
);

/* =====================================================
   ME
===================================================== */

app.get(
  "/api/me",
  auth,
  (req, res) => {
    const user =
      req.user;

    const transactions =
      read(
        TRANSACTIONS_FILE
      )
        .filter(
          (x) =>
            x.userId ===
            user.id
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        );

    const deposits =
      read(
        DEPOSITS_FILE
      )
        .filter(
          (x) =>
            x.userId ===
            user.id
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        );

    const withdrawals =
      read(
        WITHDRAWALS_FILE
      )
        .filter(
          (x) =>
            x.userId ===
            user.id
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        );

    res.json({
      success:
        true,

      user:
        publicUser(
          user
        ),

      stats: {
        balance:
          Number(
            user.balance ||
              0
          ),

        deposits:
          Number(
            user.totalDeposit ||
              0
          ),

        pendingDeposits:
          Number(
            user.pendingDeposit ||
              0
          ),

        profit:
          Number(
            user.profit ||
              0
          ),

        referralReward:
          Number(
            user.referralReward ||
              0
          ),
      },

      transactions,

      deposits,

      withdrawals,

      referrals:
        user.referrals ||
        [],
    });
  }
);

/* =====================================================
   COMPATIBLE USER ROUTE
===================================================== */

app.get(
  "/api/user/:id",
  auth,
  (req, res) => {
    if (
      req.params.id !==
      req.user.id
    ) {
      return res
        .status(403)
        .json({
          success:
            false,

          message:
            "Access denied.",
        });
    }

    const user =
      req.user;

    const transactions =
      read(
        TRANSACTIONS_FILE
      )
        .filter(
          (x) =>
            x.userId ===
            user.id
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        );

    res.json({
      success:
        true,

      user:
        publicUser(
          user
        ),

      stats: {
        balance:
          Number(
            user.balance ||
              0
          ),

        deposits:
          Number(
            user.totalDeposit ||
              0
          ),

        pendingDeposits:
          Number(
            user.pendingDeposit ||
              0
          ),

        profit:
          Number(
            user.profit ||
              0
          ),

        referralReward:
          Number(
            user.referralReward ||
              0
          ),
      },

      transactions,

      referrals:
        user.referrals ||
        [],
    });
  }
);

/* =====================================================
   PROFILE
===================================================== */

function profileHandler(
  req,
  res
) {
  const users =
    read(USERS_FILE);

  const index =
    users.findIndex(
      (u) =>
        u.id ===
        req.user.id
    );

  if (index === -1) {
    return res
      .status(404)
      .json({
        success:
          false,

        message:
          "User not found.",
      });
  }

  const body =
    req.body;

  if (
    body.name !==
    undefined
  ) {
    users[index].name =
      clean(
        body.name
      );
  }

  if (
    body.firstName !==
    undefined
  ) {
    users[index].firstName =
      clean(
        body.firstName
      );
  }

  if (
    body.lastName !==
    undefined
  ) {
    users[index].lastName =
      clean(
        body.lastName
      );
  }

  if (
    body.phone !==
    undefined
  ) {
    users[index].phone =
      clean(
        body.phone
      );

    users[index].mobile =
      clean(
        body.phone
      );
  }

  if (
    body.mobile !==
    undefined
  ) {
    users[index].mobile =
      clean(
        body.mobile
      );

    users[index].phone =
      clean(
        body.mobile
      );
  }

  if (
    body.address !==
    undefined
  ) {
    users[index].address =
      clean(
        body.address
      );
  }

  if (
    body.country !==
    undefined
  ) {
    users[index].country =
      clean(
        body.country
      );
  }

  write(
    USERS_FILE,
    users
  );

  res.json({
    success:
      true,

    message:
      "Profile updated successfully.",

    user:
      publicUser(
        users[index]
      ),
  });
}

app.post(
  "/api/profile",
  auth,
  profileHandler
);

app.put(
  "/api/user/:id/profile",
  auth,
  (req, res) => {
    if (
      req.params.id !==
      req.user.id
    ) {
      return res
        .status(403)
        .json({
          success:
            false,

          message:
            "Access denied.",
        });
    }

    profileHandler(
      req,
      res
    );
  }
);

/* =====================================================
   PASSWORD SETTINGS
===================================================== */

function passwordHandler(
  req,
  res
) {
  const users =
    read(USERS_FILE);

  const index =
    users.findIndex(
      (u) =>
        u.id ===
        req.user.id
    );

  if (index === -1) {
    return res
      .status(404)
      .json({
        success:
          false,

        message:
          "User not found.",
      });
  }

  const user =
    users[index];

  const {
    oldPassword,
    newPassword,

    oldTransactionPassword,
    newTransactionPassword,

    loginPassword,
    newLoginPassword,

    transactionPassword,
    newTransactionPassword: newTP,

    confirmNewPassword,
    confirmTransactionPassword,
  } = req.body;

  const finalOldLogin =
    oldPassword ||
    loginPassword;

  const finalNewLogin =
    newPassword ||
    newLoginPassword;

  const finalOldTransaction =
    oldTransactionPassword ||
    transactionPassword;

  const finalNewTransaction =
    newTransactionPassword ||
    newTP;

  /* ==========================================
     CONFIRM LOGIN PASSWORD
  ========================================== */

  if (
    finalNewLogin &&
    confirmNewPassword &&
    finalNewLogin !==
      confirmNewPassword
  ) {
    return res
      .status(400)
      .json({
        success:
          false,

        message:
          "New login passwords do not match.",
      });
  }

  /* ==========================================
     CONFIRM TRANSACTION PASSWORD
  ========================================== */

  if (
    finalNewTransaction &&
    confirmTransactionPassword &&
    finalNewTransaction !==
      confirmTransactionPassword
  ) {
    return res
      .status(400)
      .json({
        success:
          false,

        message:
          "Transaction passwords do not match.",
      });
  }

  /* ==========================================
     LOGIN PASSWORD
  ========================================== */

  if (finalNewLogin) {
    if (
      !finalOldLogin ||
      user.passwordHash !==
        hash(
          finalOldLogin
        )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Current login password is incorrect.",
        });
    }

    if (
      String(
        finalNewLogin
      ).length < 6
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "New login password minimum 6 characters.",
        });
    }

    user.passwordHash =
      hash(
        finalNewLogin
      );
  }

  /* ==========================================
     TRANSACTION PASSWORD
  ========================================== */

  if (
    finalNewTransaction
  ) {
    const alreadyExists =
      Boolean(
        user.transactionPasswordHash
      );

    /*
      If no transaction password
      exists, user can CREATE one.

      If it already exists,
      old password is required.
    */

    if (alreadyExists) {
      if (
        !finalOldTransaction ||
        user.transactionPasswordHash !==
          hash(
            finalOldTransaction
          )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Current transaction password is incorrect.",
          });
      }
    }

    if (
      String(
        finalNewTransaction
      ).length < 6
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Transaction password minimum 6 characters.",
        });
    }

    user.transactionPasswordHash =
      hash(
        finalNewTransaction
      );
  }

  if (
    !finalNewLogin &&
    !finalNewTransaction
  ) {
    return res
      .status(400)
      .json({
        success:
          false,

        message:
          "Enter a new password.",
      });
  }

  write(
    USERS_FILE,
    users
  );

  res.json({
    success:
      true,

    message:
      "Password settings updated successfully.",

    user:
      publicUser(
        user
      ),
  });
}

app.post(
  "/api/settings",
  auth,
  passwordHandler
);

app.put(
  "/api/user/:id/passwords",
  auth,
  (req, res) => {
    if (
      req.params.id !==
      req.user.id
    ) {
      return res
        .status(403)
        .json({
          success:
            false,

          message:
            "Access denied.",
        });
    }

    passwordHandler(
      req,
      res
    );
  }
);

/* =====================================================
   FORGOT PASSWORD
===================================================== */

app.post(
  "/api/forgot-password",
  (req, res) => {
    try {
      const {
        type,
        email,
        newPassword,
      } = req.body;

      const users =
        read(USERS_FILE);

      const cleanEmail =
        clean(email)
          .toLowerCase();

      const index =
        users.findIndex(
          (u) =>
            String(
              u.email || ""
            ).toLowerCase() ===
            cleanEmail
        );

      if (index === -1) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Account not found.",
          });
      }

      if (
        String(
          newPassword ||
            ""
        ).length < 6
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Password minimum 6 characters.",
          });
      }

      if (
        type ===
        "transaction"
      ) {
        users[index]
          .transactionPasswordHash =
          hash(
            newPassword
          );
      } else {
        users[index]
          .passwordHash =
          hash(
            newPassword
          );

        users[index]
          .sessionToken =
          "";
      }

      write(
        USERS_FILE,
        users
      );

      res.json({
        success:
          true,

        message:
          type ===
          "transaction"
            ? "Transaction password reset successfully."
            : "Login password reset successfully.",
      });
    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            "Password reset failed.",
        });
    }
  }
);

/* =====================================================
   DEPOSIT
   IMPORTANT:
   proof file is physically saved
   in data/uploads
===================================================== */

app.post(
  "/api/deposits",
  auth,
  upload.single("proof"),
  (req, res) => {
    try {
      const {
        method,
        network,
        amount,
        walletAddress,
        txid,
      } = req.body;

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <=
          0
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Valid amount required.",
          });
      }

      const cleanMethod =
        String(
          method || ""
        ).toUpperCase();

      if (
        ![
          "USDT",
          "CASH",
        ].includes(
          cleanMethod
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid deposit method.",
          });
      }

      if (
        cleanMethod ===
          "USDT" &&
        ![
          "TRC20",
          "BEP20",
        ].includes(
          network
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid USDT network.",
          });
      }

      /* ==========================================
         FILE REQUIRED
      ========================================== */

      if (!req.file) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Payment proof required.",
          });
      }

      /* ==========================================
         SAVE FILE URL
      ========================================== */

      const proofPath =
        "/uploads/" +
        req.file.filename;

      const proofUrl =
        `http://localhost:${PORT}` +
        proofPath;

      const deposits =
        read(
          DEPOSITS_FILE
        );

      const deposit = {
        id:
          makeId("DEP"),

        txnId:
          makeId("TXN"),

        userId:
          req.user.id,

        method:
          cleanMethod,

        network:
          cleanMethod ===
          "USDT"
            ? network
            : "CASH",

        amount:
          numericAmount,

        walletAddress:
          walletAddress ||
          "",

        txid:
          txid || "",

        /* FILE INFORMATION */

        proof:
          proofPath,

        proofUrl:
          proofUrl,

        proofFileName:
          req.file
            .originalname ||
          "",

        proofMimeType:
          req.file
            .mimetype ||
          "",

        proofSize:
          req.file
            .size ||
          0,

        status:
          "Pending",

        createdAt:
          now(),
      };

      deposits.push(
        deposit
      );

      write(
        DEPOSITS_FILE,
        deposits
      );

      /* ==========================================
         UPDATE USER PENDING DEPOSIT
      ========================================== */

      const users =
        read(
          USERS_FILE
        );

      const userIndex =
        users.findIndex(
          (u) =>
            u.id ===
            req.user.id
        );

      if (
        userIndex !==
        -1
      ) {
        users[userIndex]
          .pendingDeposit =
          Number(
            users[userIndex]
              .pendingDeposit ||
              0
          ) +
          numericAmount;

        write(
          USERS_FILE,
          users
        );
      }

      /* ==========================================
         TRANSACTION
      ========================================== */

      createTransaction(
        req.user.id,

        "Deposit",

        cleanMethod,

        network,

        numericAmount,

        "Pending",

        deposit.id
      );

      res
        .status(201)
        .json({
          success:
            true,

          message:
            "Deposit request submitted.",

          deposit,
        });
    } catch (error) {
      console.error(
        "DEPOSIT ERROR:",
        error
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message ||
            "Deposit failed.",
        });
    }
  }
);

/* =====================================================
   USER DEPOSITS
===================================================== */

app.get(
  "/api/deposits",
  auth,
  (req, res) => {
    const deposits =
      read(
        DEPOSITS_FILE
      )
        .filter(
          (d) =>
            d.userId ===
            req.user.id
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        )
        .map(
          (deposit) => ({
            ...deposit,

            proofUrl:
              deposit.proofUrl ||
              (
                deposit.proof
                  ? `http://localhost:${PORT}${deposit.proof}`
                  : ""
              ),
          })
        );

    res.json({
      success:
        true,

      deposits,
    });
  }
);

/* =====================================================
   WITHDRAWAL
===================================================== */

app.post(
  "/api/withdrawals",
  auth,
  (req, res) => {
    try {
      const {
        source,
        amount,
        network,
        walletAddress,
        transactionPassword,
      } = req.body;

      const numericAmount =
        Number(amount);

      const withdrawalSource =
        source ||
        "balance";

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <=
          0
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Valid amount required.",
          });
      }

      if (
        ![
          "TRC20",
          "BEP20",
        ].includes(
          network
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid network.",
          });
      }

      if (!walletAddress) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Wallet address required.",
          });
      }

      if (
        !transactionPassword
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Create your transaction password first from Settings.",
          });
      }

      if (
        !req.user
          .transactionPasswordHash
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Transaction password not created. Go to Settings and create one first.",
          });
      }

      if (
        req.user
          .transactionPasswordHash !==
        hash(
          transactionPassword
        )
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Incorrect transaction password.",
          });
      }

      const users =
        read(
          USERS_FILE
        );

      const userIndex =
        users.findIndex(
          (u) =>
            u.id ===
            req.user.id
        );

      if (
        userIndex ===
        -1
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "User not found.",
          });
      }

      const user =
        users[userIndex];

      /* BALANCE */

      if (
        withdrawalSource ===
        "balance"
      ) {
        if (
          numericAmount >
          Number(
            user.balance ||
              0
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Insufficient wallet balance.",
            });
        }
      }

      /* PROFIT */

      else if (
        withdrawalSource ===
        "profit"
      ) {
        if (
          numericAmount >
          Number(
            user.profit ||
              0
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Insufficient profit balance.",
            });
        }
      }

      /* REFERRAL */

      else if (
        withdrawalSource ===
        "referralReward"
      ) {
        const count =
          Array.isArray(
            user.referrals
          )
            ? user.referrals
                .length
            : 0;

        if (count < 3) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Minimum 3 referrals required.",
            });
        }

        if (
          numericAmount >
          Number(
            user.referralReward ||
              0
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Insufficient referral reward.",
            });
        }
      }

      else {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid withdrawal source.",
          });
      }

      const withdrawals =
        read(
          WITHDRAWALS_FILE
        );

      const withdrawal = {
        id:
          makeId("WDR"),

        txnId:
          makeId("TXN"),

        userId:
          req.user.id,

        source:
          withdrawalSource,

        network,

        amount:
          numericAmount,

        walletAddress,

        status:
          "Pending",

        createdAt:
          now(),
      };

      withdrawals.push(
        withdrawal
      );

      write(
        WITHDRAWALS_FILE,
        withdrawals
      );

      createTransaction(
        req.user.id,

        "Withdrawal",

        "USDT",

        network,

        numericAmount,

        "Pending",

        withdrawal.id,

        withdrawalSource
      );

      res
        .status(201)
        .json({
          success:
            true,

          message:
            "Withdrawal request submitted.",

          withdrawal,
        });
    } catch (error) {
      console.error(
        "WITHDRAW ERROR:",
        error
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            "Withdrawal failed.",
        });
    }
  }
);

/* =====================================================
   SUPPORT
===================================================== */

app.post(
  "/api/support",
  auth,
  (req, res) => {
    const {
      category,
      subject,
      message,
    } = req.body;

    if (
      !subject ||
      !message
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Subject and message required.",
        });
    }

    const tickets =
      read(
        SUPPORT_FILE
      );

    const ticket = {
      id:
        makeId("TKT"),

      userId:
        req.user.id,

      category:
        category ||
        "General",

      subject,

      message,

      status:
        "Open",

      createdAt:
        now(),
    };

    tickets.push(
      ticket
    );

    write(
      SUPPORT_FILE,
      tickets
    );

    res
      .status(201)
      .json({
        success:
          true,

        message:
          "Support request submitted.",

        ticket,
      });
  }
);

/* =====================================================
   ADMIN USERS
===================================================== */

app.get(
  "/api/admin/users",
  (req, res) => {
    try {
      const users =
        read(
          USERS_FILE
        );

      res.json({
        success:
          true,

        users:
          users.map(
            (u) => ({
              ...publicUser(
                u
              ),

              referralCount:
                Array.isArray(
                  u.referrals
                )
                  ? u
                      .referrals
                      .length
                  : 0,

              referrals:
                u.referrals ||
                [],
            })
          ),
      });
    } catch (error) {
      console.error(
        "ADMIN USERS ERROR:",
        error
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to load users.",
        });
    }
  }
);

/* =====================================================
   ADMIN DEPOSITS
   IMPORTANT:
   proofUrl is returned here
===================================================== */

app.get(
  "/api/admin/deposits",
  (req, res) => {
    try {
      const deposits =
        read(
          DEPOSITS_FILE
        );

      const depositsWithProof =
        deposits.map(
          (deposit) => {
            let proofUrl =
              "";

            if (
              deposit.proofUrl
            ) {
              proofUrl =
                deposit.proofUrl;
            } else if (
              deposit.proof
            ) {
              proofUrl =
                `http://localhost:${PORT}` +
                deposit.proof;
            }

            return {
              ...deposit,

              proofUrl,

              proofAvailable:
                Boolean(
                  proofUrl
                ),
            };
          }
        );

      res.json({
        success:
          true,

        deposits:
          depositsWithProof,
      });
    } catch (error) {
      console.error(
        "ADMIN DEPOSITS ERROR:",
        error
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to load deposits.",
        });
    }
  }
);

/* =====================================================
   ADMIN WITHDRAWALS
===================================================== */

app.get(
  "/api/admin/withdrawals",
  (req, res) => {
    try {
      const withdrawals =
        read(
          WITHDRAWALS_FILE
        );

      withdrawals.sort(
        (a, b) =>
          new Date(
            b.createdAt
          ) -
          new Date(
            a.createdAt
          )
      );

      res.json({
        success:
          true,

        withdrawals,
      });
    } catch (error) {
      console.error(
        "ADMIN WITHDRAWALS ERROR:",
        error
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to load withdrawals.",
        });
    }
  }
);

/* =====================================================
   ADMIN TRANSACTIONS
===================================================== */

app.get(
  "/api/admin/transactions",
  (req, res) => {
    try {
      const transactions =
        read(
          TRANSACTIONS_FILE
        );

      transactions.sort(
        (a, b) =>
          new Date(
            b.createdAt
          ) -
          new Date(
            a.createdAt
          )
      );

      res.json({
        success:
          true,

        transactions,
      });
    } catch (error) {
      console.error(
        "ADMIN TRANSACTIONS ERROR:",
        error
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to load transactions.",
        });
    }
  }
);

/* =====================================================
   ADMIN SUPPORT
===================================================== */

app.get(
  "/api/admin/support",
  (req, res) => {
    try {
      const support =
        read(
          SUPPORT_FILE
        );

      support.sort(
        (a, b) =>
          new Date(
            b.createdAt
          ) -
          new Date(
            a.createdAt
          )
      );

      res.json({
        success:
          true,

        support,
      });
    } catch (error) {
      console.error(
        "ADMIN SUPPORT ERROR:",
        error
      );

      res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to load support tickets.",
        });
    }
  }
);

/* =====================================================
   ADMIN APPROVE DEPOSIT
===================================================== */

app.post(
  "/api/admin/deposits/:id/approve",
  (req, res) => {
    const deposits =
      read(
        DEPOSITS_FILE
      );

    const index =
      deposits.findIndex(
        (d) =>
          d.id ===
          req.params.id
      );

    if (index === -1) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "Deposit not found.",
        });
    }

    const deposit =
      deposits[index];

    if (
      deposit.status !==
      "Pending"
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Deposit already processed.",
        });
    }

    const users =
      read(
        USERS_FILE
      );

    const userIndex =
      users.findIndex(
        (u) =>
          u.id ===
          deposit.userId
      );

    if (
      userIndex ===
      -1
    ) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "User not found.",
        });
    }

    const amount =
      Number(
        deposit.amount ||
          0
      );

    users[userIndex]
      .balance =
      Number(
        users[userIndex]
          .balance ||
          0
      ) +
      amount;

    users[userIndex]
      .totalDeposit =
      Number(
        users[userIndex]
          .totalDeposit ||
          0
      ) +
      amount;

    users[userIndex]
      .pendingDeposit =
      Math.max(
        0,

        Number(
          users[userIndex]
            .pendingDeposit ||
            0
        ) -
          amount
      );

    deposit.status =
      "Approved";

    deposit.approvedAt =
      now();

    write(
      USERS_FILE,
      users
    );

    write(
      DEPOSITS_FILE,
      deposits
    );

    createTransaction(
      deposit.userId,

      "Deposit",

      deposit.method,

      deposit.network,

      amount,

      "Approved",

      deposit.id
    );

    res.json({
      success:
        true,

      message:
        "Deposit approved.",

      deposit,
    });
  }
);

/* =====================================================
   ADMIN REJECT DEPOSIT
===================================================== */

app.post(
  "/api/admin/deposits/:id/reject",
  (req, res) => {
    const deposits =
      read(
        DEPOSITS_FILE
      );

    const index =
      deposits.findIndex(
        (d) =>
          d.id ===
          req.params.id
      );

    if (index === -1) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "Deposit not found.",
        });
    }

    const deposit =
      deposits[index];

    if (
      deposit.status !==
      "Pending"
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Deposit already processed.",
        });
    }

    const users =
      read(
        USERS_FILE
      );

    const userIndex =
      users.findIndex(
        (u) =>
          u.id ===
          deposit.userId
      );

    if (
      userIndex !==
      -1
    ) {
      users[userIndex]
        .pendingDeposit =
        Math.max(
          0,

          Number(
            users[userIndex]
              .pendingDeposit ||
              0
          ) -
            Number(
              deposit.amount ||
                0
            )
        );

      write(
        USERS_FILE,
        users
      );
    }

    deposit.status =
      "Rejected";

    deposit.rejectedAt =
      now();

    write(
      DEPOSITS_FILE,
      deposits
    );

    createTransaction(
      deposit.userId,

      "Deposit",

      deposit.method,

      deposit.network,

      Number(
        deposit.amount ||
          0
      ),

      "Rejected",

      deposit.id
    );

    res.json({
      success:
        true,

      message:
        "Deposit rejected.",

      deposit,
    });
  }
);

/* =====================================================
   ADMIN APPROVE WITHDRAWAL
===================================================== */

app.post(
  "/api/admin/withdrawals/:id/approve",
  (req, res) => {
    const withdrawals =
      read(
        WITHDRAWALS_FILE
      );

    const index =
      withdrawals.findIndex(
        (w) =>
          w.id ===
          req.params.id
      );

    if (index === -1) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "Withdrawal not found.",
        });
    }

    const withdrawal =
      withdrawals[index];

    if (
      withdrawal.status !==
      "Pending"
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Withdrawal already processed.",
        });
    }

    const users =
      read(
        USERS_FILE
      );

    const userIndex =
      users.findIndex(
        (u) =>
          u.id ===
          withdrawal.userId
      );

    if (
      userIndex ===
      -1
    ) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "User not found.",
        });
    }

    const user =
      users[userIndex];

    const amount =
      Number(
        withdrawal.amount ||
          0
      );

    const source =
      withdrawal.source ||
      "balance";

    /* BALANCE */

    if (
      source ===
      "balance"
    ) {
      if (
        Number(
          user.balance ||
            0
        ) <
        amount
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Insufficient balance.",
          });
      }

      user.balance =
        Number(
          user.balance ||
            0
        ) -
        amount;
    }

    /* PROFIT */

    else if (
      source ===
      "profit"
    ) {
      if (
        Number(
          user.profit ||
            0
        ) <
        amount
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Insufficient profit.",
          });
      }

      user.profit =
        Number(
          user.profit ||
            0
        ) -
        amount;
    }

    /* REFERRAL */

    else if (
      source ===
      "referralReward"
    ) {
      const count =
        Array.isArray(
          user.referrals
        )
          ? user
              .referrals
              .length
          : 0;

      if (
        count < 3
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Minimum 3 referrals required.",
          });
      }

      if (
        Number(
          user.referralReward ||
            0
        ) <
        amount
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Insufficient referral reward.",
          });
      }

      user.referralReward =
        Number(
          user.referralReward ||
            0
        ) -
        amount;
    }

    else {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Invalid withdrawal source.",
        });
    }

    withdrawal.status =
      "Approved";

    withdrawal.approvedAt =
      now();

    write(
      USERS_FILE,
      users
    );

    write(
      WITHDRAWALS_FILE,
      withdrawals
    );

    createTransaction(
      withdrawal.userId,

      "Withdrawal",

      "USDT",

      withdrawal.network,

      amount,

      "Approved",

      withdrawal.id,

      source
    );

    res.json({
      success:
        true,

      message:
        "Withdrawal approved.",

      withdrawal,
    });
  }
);

/* =====================================================
   ADMIN REJECT WITHDRAWAL
===================================================== */

app.post(
  "/api/admin/withdrawals/:id/reject",
  (req, res) => {
    const withdrawals =
      read(
        WITHDRAWALS_FILE
      );

    const index =
      withdrawals.findIndex(
        (w) =>
          w.id ===
          req.params.id
      );

    if (index === -1) {
      return res
        .status(404)
        .json({
          success:
            false,

          message:
            "Withdrawal not found.",
        });
    }

    if (
      withdrawals[index]
        .status !==
      "Pending"
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Withdrawal already processed.",
        });
    }

    withdrawals[index]
      .status =
      "Rejected";

    withdrawals[index]
      .rejectedAt =
      now();

    write(
      WITHDRAWALS_FILE,
      withdrawals
    );

    createTransaction(
      withdrawals[index]
        .userId,

      "Withdrawal",

      "USDT",

      withdrawals[index]
        .network,

      Number(
        withdrawals[index]
          .amount ||
          0
      ),

      "Rejected",

      withdrawals[index]
        .id,

      withdrawals[index]
        .source ||
        "balance"
    );

    res.json({
      success:
        true,

      message:
        "Withdrawal rejected.",

      withdrawal:
        withdrawals[index],
    });
  }
);

/* =====================================================
   404
===================================================== */

app.use(
  (req, res) => {
    res
      .status(404)
      .json({
        success:
          false,

        message:
          "API route not found",

        route:
          req.method +
          " " +
          req.originalUrl,
      });
  }
);

/* =====================================================
   ERROR HANDLER
===================================================== */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "SERVER ERROR:",
      error
    );

    res
      .status(500)
      .json({
        success:
          false,

        message:
          error.message ||
          "Internal server error.",
      });
  }
);

/* =====================================================
   START
===================================================== */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log("");

    console.log(
      "======================================"
    );

    console.log(
      "       TRADENEX BACKEND RUNNING"
    );

    console.log(
      "======================================"
    );

    console.log(
      `Local: http://localhost:${PORT}`
    );

    console.log(
      `Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      `Admin API: http://localhost:${PORT}/api/admin`
    );

    console.log(
      `Uploads: http://localhost:${PORT}/uploads/`
    );

    console.log(
      `Referral Reward: $${REFERRAL_REWARD}`
    );

    console.log(
      "======================================"
    );

    console.log("");
  }
);