let msg91Loading = null;

export function loadMSG91() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser required"));
  }

  if (
    typeof window.sendOtp === "function" &&
    typeof window.verifyOtp === "function"
  ) {
    return Promise.resolve();
  }

  if (msg91Loading) return msg91Loading;

  const widgetId = String(
    import.meta.env.VITE_MSG91_WIDGET_ID || ""
  ).trim();

  const tokenAuth = String(
    import.meta.env.VITE_MSG91_TOKEN_AUTH || ""
  ).trim();

  if (!widgetId || !tokenAuth) {
    return Promise.reject(
      new Error("MSG91 Widget configuration missing.")
    );
  }

  msg91Loading = new Promise((resolve, reject) => {
    let finished = false;

    const configuration = {
      widgetId,
      tokenAuth,
      exposeMethods: true,

      success: (data) => {
        console.log("MSG91 OTP success");
      },

      failure: (error) => {
        console.error("MSG91 OTP error:", error);
      },
    };

    window.msg91OTPConfiguration = configuration;

    const waitForMethods = () => {
      let attempts = 0;

      const check = () => {
        if (
          typeof window.sendOtp === "function" &&
          typeof window.verifyOtp === "function"
        ) {
          finished = true;
          resolve();
          return;
        }

        attempts++;

        if (attempts >= 100) {
          finished = true;
          reject(
            new Error(
              "MSG91 OTP methods load नहीं हुए. Please refresh and try again."
            )
          );
          return;
        }

        setTimeout(check, 100);
      };

      check();
    };

    const initialize = () => {
      if (typeof window.initSendOTP !== "function") {
        reject(
          new Error(
            "MSG91 OTP SDK loaded but initSendOTP unavailable है."
          )
        );
        return;
      }

      try {
        window.initSendOTP(configuration);
        waitForMethods();
      } catch (error) {
        reject(error);
      }
    };

    const existing = document.querySelector(
      'script[src="https://verify.msg91.com/otp-provider.js"]'
    );

    if (existing) {
      initialize();
      return;
    }

    const script = document.createElement("script");

    script.src = "https://verify.msg91.com/otp-provider.js";
    script.async = true;

    script.onload = initialize;

    script.onerror = () => {
      if (!finished) {
        reject(
          new Error("MSG91 OTP SDK could not be loaded.")
        );
      }
    };

    document.head.appendChild(script);
  });

  return msg91Loading;
}
