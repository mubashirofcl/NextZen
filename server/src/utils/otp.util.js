import otpGenerator from "otp-generator";
import { sendEmail } from "./email.service.js";

export const OTP_PURPOSE = Object.freeze({
    SIGNUP: "SIGNUP",
    FORGOT_PASSWORD: "FORGOT_PASSWORD",
    EMAIL_CHANGE: "EMAIL_CHANGE",
});

export const generateOTP = () => {
    return otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
};

export const sendOTPEmail = async ({ email, otp, purpose }) => {
    const normalizedPurpose = purpose?.toUpperCase();
    if (!email || !otp || !normalizedPurpose) {
        throw new Error("email, otp, and purpose are required");
    }

    if (!Object.values(OTP_PURPOSE).includes(normalizedPurpose)) {
        throw new Error("Invalid OTP purpose");
    }

    console.log(otp);

    const subjectMap = {
        [OTP_PURPOSE.SIGNUP]: "Verify your NEXTZEN Account",
        [OTP_PURPOSE.FORGOT_PASSWORD]: "Reset your NEXTZEN Password",
        [OTP_PURPOSE.EMAIL_CHANGE]: "Verify Your New Email Address",
    };

    const headingMap = {
        [OTP_PURPOSE.SIGNUP]: "Verify Your Email Address",
        [OTP_PURPOSE.FORGOT_PASSWORD]: "Reset Your Password",
        [OTP_PURPOSE.EMAIL_CHANGE]: "Confirm Email Change",
    };

    const messageMap = {
        [OTP_PURPOSE.SIGNUP]:
            "Welcome to NEXTZEN! Use the OTP below to complete your registration.",
        [OTP_PURPOSE.FORGOT_PASSWORD]:
            "You requested a password reset. Use the OTP below to proceed.",
        [OTP_PURPOSE.EMAIL_CHANGE]:
            "You are changing your account email. Use the OTP below to confirm.",



    };

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial;background:#f9f9f9;padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:6px;overflow:hidden;">
            <div style="background:#111;color:#fff;padding:30px;text-align:center;">
                <h1 style="margin:0;letter-spacing:4px;">NEXTZEN</h1>
                <p style="font-size:12px;opacity:.8;">PREMIUM MEN'S CLOTHING</p>
            </div>

            <div style="padding:40px;color:#333;">
                <h2>${headingMap[normalizedPurpose]}</h2>
                <p>${messageMap[normalizedPurpose]}</p>

                <div style="margin:30px 0;padding:20px;background:#f4f4f5;text-align:center;border-radius:8px;">
                    <p style="font-size:36px;letter-spacing:6px;font-weight:bold;margin:0;">
                        ${otp}
                    </p>
                </div>

                <p style="font-size:14px;">
                    This OTP is valid for <strong>10 minutes</strong>.
                </p>

                <p style="font-size:13px;color:#777;">
                    If you didn’t request this, you can safely ignore this email.
                </p>

                <p style="margin-top:30px;">— The NEXTZEN Team</p>
            </div>

            <div style="text-align:center;padding:20px;font-size:12px;color:#999;">
                © 2026 NEXTZEN. This is an automated email.
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: subjectMap[normalizedPurpose],
        html,
    });
};
