import Newsletter from "./newsletter.model.js";
import { sendEmail } from "../../../utils/email.service.js";

export const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const existing = await Newsletter.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (existing.isActive) {
        return res.status(409).json({ success: false, message: "You're already subscribed!" });
      }

      existing.isActive = true;
      await existing.save();
    } else {
      await Newsletter.create({ email: email.toLowerCase() });
    }

    try {
      await sendEmail({
        to: email.toLowerCase(),
        subject: "Welcome to NEXTZEN — You're In.",
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 24px; overflow: hidden;">
            <div style="padding: 48px 40px; text-align: center;">
              <h1 style="font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -1px; margin: 0 0 8px 0;">
                NEXT<span style="color: #7a6af6;">ZEN</span>
              </h1>
              <div style="width: 40px; height: 2px; background: #7a6af6; margin: 16px auto;"></div>
              <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 24px 0 12px 0; letter-spacing: -0.5px;">
                You're on the list.
              </h2>
              <p style="font-size: 13px; color: #888888; line-height: 1.7; margin: 0 0 32px 0;">
                Welcome to the NEXTZEN inner circle. You'll be the first to know about exclusive drops, limited collections, and members-only offers.
              </p>
              <a href="https://nextzen.mubashiir.in/shop" style="display: inline-block; background: #7a6af6; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                SHOP NOW
              </a>
            </div>
            <div style="padding: 20px 40px; border-top: 1px solid #1a1a1a; text-align: center;">
              <p style="font-size: 10px; color: #444444; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
                © ${new Date().getFullYear()} NextZen Outfit — Crafted for the Bold
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Newsletter welcome email failed:", emailErr.message);
    }

    return res.status(200).json({ success: true, message: "Successfully subscribed! Check your inbox." });
  } catch (err) {
    next(err);
  }
};
