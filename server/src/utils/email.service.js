import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
    },
});

export const sendEmail = async ({ to, subject, html }) => {
    // 🟢 Validation check
    if (!to) throw new Error("Email Service Error: 'to' recipient is undefined.");

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, 
        },
    });

    const mailOptions = {
        from: `"NEXTZEN" <${process.env.EMAIL_USER}>`,
        to, 
        subject,
        html,
    };

    return await transporter.sendMail(mailOptions);
};