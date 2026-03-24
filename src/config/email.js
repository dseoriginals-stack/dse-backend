import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

/* =========================
   PASSWORD RESET EMAIL
========================= */

export async function sendPasswordResetEmail(email, resetUrl) {

  await sgMail.send({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Reset your password",
    html: `
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `
  })

}

/* =========================
   ORDER INVOICE EMAIL
========================= */

export async function sendInvoiceEmail(email, order) {

  await sgMail.send({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: `Order #${order.id} confirmation`,
    html: `
      <h2>Thank you for your order</h2>
      <p>Order ID: ${order.id}</p>
      <p>Total: ${order.total}</p>
      <p>Status: ${order.status}</p>
    `
  })

}