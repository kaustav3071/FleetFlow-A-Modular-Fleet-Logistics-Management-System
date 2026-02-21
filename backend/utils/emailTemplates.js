/**
 * HTML email templates for FleetFlow
 */

export const verificationEmailTemplate = (name, verificationUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 32px;text-align:center;">
      <h1 style="color:#ffffff;font-size:28px;margin:0;letter-spacing:-0.5px;">🚛 FleetFlow</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:8px;">Modular Fleet & Logistics Management</p>
    </div>
    <!-- Body -->
    <div style="padding:40px 32px;">
      <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">Welcome aboard, ${name}! 👋</h2>
      <p style="color:#4a5568;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Thank you for signing up for FleetFlow. Please verify your email address to activate your account and start managing your fleet.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verificationUrl}" 
           style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
          ✅ Verify Email Address
        </a>
      </div>
      <p style="color:#718096;font-size:13px;line-height:1.6;margin:24px 0 0;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color:#667eea;word-break:break-all;">${verificationUrl}</a>
      </p>
      <p style="color:#a0aec0;font-size:12px;margin-top:24px;">
        This link expires in <strong>24 hours</strong>. If you didn't create an account, please ignore this email.
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#f7fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#a0aec0;font-size:12px;margin:0;">© ${new Date().getFullYear()} FleetFlow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const resetPasswordEmailTemplate = (name, resetUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#e53e3e 0%,#dd6b20 100%);padding:40px 32px;text-align:center;">
      <h1 style="color:#ffffff;font-size:28px;margin:0;letter-spacing:-0.5px;">🚛 FleetFlow</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:8px;">Password Reset Request</p>
    </div>
    <!-- Body -->
    <div style="padding:40px 32px;">
      <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">Hi ${name},</h2>
      <p style="color:#4a5568;font-size:15px;line-height:1.7;margin:0 0 24px;">
        We received a request to reset your password. Click the button below to set a new password for your account.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" 
           style="display:inline-block;background:linear-gradient(135deg,#e53e3e 0%,#dd6b20 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
          🔐 Reset Password
        </a>
      </div>
      <p style="color:#718096;font-size:13px;line-height:1.6;margin:24px 0 0;">
        If the button doesn't work, copy and paste this link:<br>
        <a href="${resetUrl}" style="color:#e53e3e;word-break:break-all;">${resetUrl}</a>
      </p>
      <p style="color:#a0aec0;font-size:12px;margin-top:24px;">
        This link expires in <strong>1 hour</strong>. If you didn't request this, your account is safe — just ignore this email.
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#f7fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#a0aec0;font-size:12px;margin:0;">© ${new Date().getFullYear()} FleetFlow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
