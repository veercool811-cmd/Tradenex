let msg91Loading = null;

export function loadMSG91() {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser required"));

  if (typeof window.initSendOTP === "function") {
    return Promise.resolve(window.initSendOTP);
  }

  if (msg91Loading) return msg91Loading;

  msg91Loading = new Promise((resolve, reject) => {
    const widgetId = import.meta.env.VITE_MSG91_WIDGET_ID;
    const tokenAuth = import.meta.env.VITE_MSG91_TOKEN_AUTH;

    if (!widgetId || !tokenAuth) {
      reject(new Error("MSG91 Widget configuration missing."));
      return;
    }

    window.msg91OTPConfiguration = {
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

    const script = document.createElement("script");
    script.src = "https://verify.msg91.com/otp-provider.js";
    script.async = true;

    script.onload = () => {
      if (typeof window.initSendOTP === "function") {
        window.initSendOTP(window.msg91OTPConfiguration);
        resolve(window.initSendOTP);
      } else {
        reject(new Error("MSG91 OTP SDK loaded but initSendOTP is unavailable."));
      }
    };

    script.onerror = () => {
      reject(new Error("MSG91 OTP SDK could not be loaded."));
    };

    document.head.appendChild(script);
  });

  return msg91Loading;
}
