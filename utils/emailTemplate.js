// Builds a themed HTML email with a heading, a line of body text,
// and a big button. Colors mirror web/src/theme.css (navy & amber).
function emailTemplate({ heading, body, buttonText, buttonUrl, footer }) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#0d2b45;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d2b45; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:480px; background-color:#123152; border:1px solid #1e4269; border-radius:12px; padding:32px;">
          <tr>
            <td align="center" style="font-family:Arial, Helvetica, sans-serif;">
              <h1 style="margin:0 0 8px; font-size:22px; color:#ffffff;">Team Calendar</h1>
              <h2 style="margin:0 0 16px; font-size:17px; color:#ffffff; font-weight:600;">${heading}</h2>
              <p style="margin:0 0 28px; font-size:14px; line-height:1.6; color:#a9c2d8;">${body}</p>
              <a href="${buttonUrl}"
                 style="display:inline-block; background-color:#ffb020; color:#0d2b45;
                        font-size:15px; font-weight:bold; text-decoration:none;
                        padding:14px 32px; border-radius:10px;">
                ${buttonText}
              </a>
              <p style="margin:28px 0 0; font-size:12px; line-height:1.6; color:#a9c2d8;">
                ${footer || "If the button doesn't work, copy and paste this link into your browser:"}
                <br>
                <a href="${buttonUrl}" style="color:#ffb020; word-break:break-all;">${buttonUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#a9c2d8; margin-top:16px;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = emailTemplate;