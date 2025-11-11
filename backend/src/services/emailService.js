import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendVerificationEmail = async (email, token, username) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Email - Team Builder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Team Builder, ${username}!</h2>
        <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #4F46E5; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6B7280; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          This link will expire in ${process.env.MAGIC_LINK_EXPIRY || 15} minutes.
        </p>
        <p style="color: #6B7280; font-size: 14px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendLoginEmail = async (email, token, username) => {
  const transporter = createTransporter();
  const loginUrl = `${process.env.FRONTEND_URL}/login-verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Login to Team Builder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Login to Team Builder</h2>
        <p>Hi ${username},</p>
        <p>Click the link below to log in to your account:</p>
        <div style="margin: 30px 0;">
          <a href="${loginUrl}"
             style="background-color: #4F46E5; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Login to Your Account
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6B7280; word-break: break-all;">${loginUrl}</p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          This link will expire in ${process.env.MAGIC_LINK_EXPIRY || 15} minutes.
        </p>
        <p style="color: #6B7280; font-size: 14px;">
          If you didn't request this login link, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Login email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending login email:', error);
    throw error;
  }
};
