import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_SENDER_EMAIL = 'no-reply@learn-dashboard.shopsheap.online';
const DEFAULT_SENDER_NAME = 'Hệ thống Quản lý Học Lập Trình';

const stripHtml = (htmlContent) => htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const getRawBrevoKey = () => process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '';

const isBrevoSmtpKey = (key) => key.trim().startsWith('xsmtpsib-');

const getBrevoApiKey = () => {
  const key = getRawBrevoKey();
  return key && !isBrevoSmtpKey(key) ? key : '';
};

const getSenderEmail = () => process.env.EMAIL_FROM || DEFAULT_SENDER_EMAIL;

const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT || 587),
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || (isBrevoSmtpKey(getRawBrevoKey()) ? getRawBrevoKey() : ''),
});

const logEmailFallback = ({ to, subject, textContent }) => {
  console.warn('Brevo API key chưa được cấu hình. Chỉ log nội dung email để test local.');
  console.log('Email content:', {
    to,
    subject,
    body: textContent,
  });

  return {
    success: true,
    message: 'Email config chưa setup - chỉ log',
  };
};

const sendEmailViaBrevoAPI = async ({ to, toName, subject, htmlContent, textContent }) => {
  const apiKey = getBrevoApiKey();
  const emailFrom = getSenderEmail();
  const plainText = textContent || stripHtml(htmlContent);

  if (!apiKey) {
    throw new Error('Brevo API key is not configured');
  }

  const payload = {
    sender: {
      name: DEFAULT_SENDER_NAME,
      email: emailFrom,
    },
    to: [
      {
        email: to,
        name: toName || to,
      },
    ],
    subject,
    htmlContent,
    textContent: plainText,
  };

  try {
    console.log('Sending email via Brevo API...');
    console.log('Email details:', {
      to,
      subject,
      from: emailFrom,
    });

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('Brevo API error:', responseData);
      const message = responseData?.message || responseData?.error || response.statusText;
      throw new Error(`Brevo API error: ${message} (${response.status})`);
    }

    console.log('Email sent via Brevo API successfully');
    console.log('Brevo response:', {
      messageId: responseData?.messageId,
      status: response.status,
    });

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: responseData?.messageId,
      response: responseData,
    };
  } catch (error) {
    console.error('Error sending email via Brevo API:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    throw error;
  }
};

const sendEmailViaBrevoSMTP = async ({ to, toName, subject, htmlContent, textContent }) => {
  const emailFrom = getSenderEmail();
  const smtpConfig = getSmtpConfig();
  const plainText = textContent || stripHtml(htmlContent);

  if (!smtpConfig.user || !smtpConfig.pass) {
    return logEmailFallback({ to, subject, textContent: plainText });
  }

  try {
    console.log('Sending email via Brevo SMTP...');
    console.log('Email details:', {
      to,
      subject,
      from: emailFrom,
    });

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const response = await transporter.sendMail({
      from: `"${DEFAULT_SENDER_NAME}" <${emailFrom}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      html: htmlContent,
      text: plainText,
    });

    console.log('Email sent via Brevo SMTP successfully');
    console.log('Brevo SMTP response:', {
      messageId: response.messageId,
      accepted: response.accepted,
      rejected: response.rejected,
    });

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: response.messageId,
      response,
    };
  } catch (error) {
    console.error('Error sending email via Brevo SMTP:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    throw error;
  }
};

const sendEmail = async (emailOptions) => {
  if (getBrevoApiKey()) {
    return sendEmailViaBrevoAPI(emailOptions);
  }

  return sendEmailViaBrevoSMTP(emailOptions);
};

export const sendMSSVEmail = async (email, fullName, mssv) => {
  try {
    const subject = 'Thông tin đăng ký tài khoản - MSSV của bạn';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Chúc mừng bạn đã đăng ký thành công!</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Chúc mừng bạn đã đăng ký tài khoản thành công trên hệ thống.</p>
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;"><strong>MSSV của bạn:</strong></p>
          <p style="margin: 10px 0; font-size: 24px; color: #007bff; font-weight: bold;">${mssv}</p>
        </div>
        <p>Vui lòng sử dụng <strong>MSSV</strong> và <strong>mật khẩu</strong> đã đăng ký để đăng nhập vào hệ thống.</p>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">Trân trọng,<br>${DEFAULT_SENDER_NAME}</p>
      </div>
    `;

    const textBody = `
Xin chào ${fullName},

Chúc mừng bạn đã đăng ký tài khoản thành công!

MSSV của bạn: ${mssv}

Vui lòng sử dụng MSSV và mật khẩu đã đăng ký để đăng nhập vào hệ thống.

Trân trọng,
${DEFAULT_SENDER_NAME}
    `;

    console.log(`Attempting to send MSSV email to: ${email}`);
    return sendEmail({
      to: email,
      toName: fullName,
      subject,
      htmlContent: htmlBody,
      textContent: textBody,
    });
  } catch (error) {
    console.error('Error sending MSSV email:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    return {
      success: false,
      message: error.message || 'Failed to send email',
      error: {
        message: error.message,
      },
    };
  }
};

export const sendResetPasswordEmail = async (email, fullName, resetToken) => {
  try {
    const resetUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;
    const subject = 'Đặt lại mật khẩu';
    const htmlBody = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt lại mật khẩu</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Đặt lại mật khẩu</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Xin chào <strong style="color: #2563eb;">${fullName}</strong>,
              </p>
              <p style="margin: 0 0 30px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-size: 16px; font-weight: 600; display: inline-block;">
                      Đặt lại mật khẩu
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; color: #9a3412; font-size: 14px; line-height: 1.5;">
                  Link này sẽ hết hạn sau <strong>15 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">Trân trọng,</p>
              <p style="margin: 0; color: #2563eb; font-size: 15px; font-weight: 600;">${DEFAULT_SENDER_NAME}</p>
              <p style="margin: 15px 0 0 0; color: #999999; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textBody = `
Xin chào ${fullName},

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng nhấn nút "Đặt lại mật khẩu" trong email để tạo mật khẩu mới.

Link này sẽ hết hạn sau 15 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
${DEFAULT_SENDER_NAME}
    `;

    console.log(`Attempting to send reset password email to: ${email}`);
    return sendEmail({
      to: email,
      toName: fullName,
      subject,
      htmlContent: htmlBody,
      textContent: textBody,
    });
  } catch (error) {
    console.error('Error sending reset password email:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);

    return {
      success: false,
      message: error.message || 'Failed to send email',
      error: {
        message: error.message,
      },
    };
  }
};

export const sendInactivityReminderEmail = async (email, fullName, inactivityDays) => {
  try {
    const subject = 'Bạn đã vắng mặt một thời gian, quay lại học nhé';
    const displayName = fullName || 'bạn';
    const loginUrl = getFrontendUrl();
    const htmlBody = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nhắc học lại</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fb; font-family: Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fb; padding: 32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #dbe4f0; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb, #38bdf8); padding: 28px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Quay lại nhịp học của bạn</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; line-height: 1.7;">
                Xin chào <strong>${displayName}</strong>,
              </p>
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                Hệ thống ghi nhận bạn đã chưa quay lại học trong khoảng <strong>${inactivityDays} ngày</strong>.
                Nếu đang tạm gián đoạn, đây là lúc tốt để tiếp tục một bài ngắn và lấy lại nhịp học.
              </p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                Chỉ cần quay lại hệ thống và làm tiếp bài đang mở hoặc bắt đầu một bài dễ trước để khởi động lại.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; border-radius: 999px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600;">
                      Quay lại học ngay
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px 28px; color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #e5edf7;">
              Email này được gửi tự động từ ${DEFAULT_SENDER_NAME}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textBody = `
Xin chào ${displayName},

Hệ thống ghi nhận bạn đã chưa quay lại học trong khoảng ${inactivityDays} ngày.
Nếu đang tạm gián đoạn, đây là lúc tốt để tiếp tục một bài ngắn và lấy lại nhịp học.

Truy cập lại hệ thống tại: ${loginUrl}

Trân trọng,
${DEFAULT_SENDER_NAME}
    `;

    return sendEmail({
      to: email,
      toName: displayName,
      subject,
      htmlContent: htmlBody,
      textContent: textBody,
    });
  } catch (error) {
    console.error('Error sending inactivity reminder email:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);

    return {
      success: false,
      message: error.message || 'Failed to send email',
      error: {
        message: error.message,
      },
    };
  }
};

export const sendOverdueExerciseEmail = async (email, fullName, exerciseTitle, courseName, overdueLabel, deadline) => {
  try {
    const displayName = fullName || 'bạn';
    const loginUrl = getFrontendUrl();
    const deadlineStr = deadline
      ? new Date(deadline).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';
    const subject = `Bạn đã trễ bài "${exerciseTitle}"`;
    const htmlBody = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nhắc trễ bài tập</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fb; font-family: Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fb; padding: 32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #dbe4f0; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b, #f97316); padding: 28px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">Bạn đã trễ hạn nộp bài</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; line-height: 1.7;">
                Xin chào <strong>${displayName}</strong>,
              </p>
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                Bài tập <strong style="color: #d97706;">"${exerciseTitle}"</strong> thuộc môn <strong>${courseName}</strong> đã quá hạn nộp.
              </p>
              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 6px 0; color: #9a3412; font-size: 14px;"><strong>Hạn nộp:</strong> ${deadlineStr}</p>
                <p style="margin: 0; color: #9a3412; font-size: 14px;"><strong>Tình trạng:</strong> ${overdueLabel}</p>
              </div>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                Hãy quay lại hệ thống để hoàn thành bài tập sớm nhé!
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; border-radius: 999px; background-color: #f59e0b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600;">
                      Mở bài tập ngay
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px 28px; color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #e5edf7;">
              Email này được gửi tự động từ ${DEFAULT_SENDER_NAME}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textBody = `
Xin chào ${displayName},

Bài tập "${exerciseTitle}" thuộc môn ${courseName} đã quá hạn nộp.
Hạn nộp: ${deadlineStr}
Tình trạng: ${overdueLabel}

Hãy quay lại hệ thống để hoàn thành bài tập sớm nhé!
Truy cập: ${loginUrl}

Trân trọng,
${DEFAULT_SENDER_NAME}
    `;

    console.log(`Attempting to send overdue exercise email to: ${email}`);
    return sendEmail({
      to: email,
      toName: displayName,
      subject,
      htmlContent: htmlBody,
      textContent: textBody,
    });
  } catch (error) {
    console.error('Error sending overdue exercise email:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);

    return {
      success: false,
      message: error.message || 'Failed to send email',
      error: {
        message: error.message,
      },
    };
  }
};

export default {
  sendMSSVEmail,
  sendResetPasswordEmail,
  sendInactivityReminderEmail,
  sendOverdueExerciseEmail,
};
