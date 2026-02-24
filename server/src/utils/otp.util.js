import otpGenerator from "otp-generator";
import { sendEmail } from "./email.service.js";

export const OTP_PURPOSE = Object.freeze({
    SIGNUP: "SIGNUP",
    FORGOT_PASSWORD: "FORGOT_PASSWORD",
    EMAIL_CHANGE: "EMAIL_CHANGE",
});

export const sendOTPEmail = async (options) => {
    const { to, email, otp, purpose } = options;
    const targetEmail = to || email;

    console.log('----------------------------------------------------------------------')
    console.log(`[OTP SERVICE] Generating ${purpose} for ${targetEmail}: ${otp}`);
    console.log('----------------------------------------------------------------------')

    if (!targetEmail) throw new Error("Target email is missing");

    const subjectMap = {
        SIGNUP: "Verify your NEXTZEN Account",
        FORGOT_PASSWORD: "Reset your NEXTZEN Password",
        EMAIL_CHANGE: "Confirm your new email address",
    };

    const html = `
    <div style="background-color: #f9fafb; padding: 50px 20px; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px; text-align: center; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <div style="margin-bottom: 32px;">
                <div style="display: inline-block; width: 40px; height: 40px; background-color: #7a6af6; border-radius: 10px; line-height: 40px; text-align: center; margin-bottom: 16px;">
                    <span style="color: white; font-weight: bold; font-size: 20px;">N</span>
                </div>
                <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: #6b7280; margin: 0;">NextZen Archive</h2>
            </div>

            <h1 style="font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 12px; letter-spacing: -0.025em;">
                ${subjectMap[purpose.toUpperCase()] || "Verification Code"}
            </h1>
            
            <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 32px;">
                Please enter the code below to securely verify your identity.
            </p>

            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #7a6af6; margin-left: 8px;">${otp}</span>
            </div>

            <p style="font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 32px;">
                Valid for 10 minutes only
            </p>

            <div style="border-top: 1px solid #f3f4f6; pt: 24px; padding-top: 24px;">
                <p style="font-size: 11px; color: #9ca3af; line-height: 1.6; margin: 0;">
                    If you didn't request this, you can safely ignore this email. Someone probably just typed their email address wrong.
                </p>
            </div>
        </div>

        <div style="text-align: center; margin-top: 24px;">
            <p style="font-size: 11px; color: #9ca3af; font-weight: 500;">
                &copy; 2026 NEXTZEN. All rights reserved.
            </p>
        </div>
    </div>
    `;

    return await sendEmail({
        to: targetEmail,
        subject: subjectMap[purpose.toUpperCase()] || "NEXTZEN Verification",
        html,
    });
};

export const generateOTP = () => {
    return otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
};