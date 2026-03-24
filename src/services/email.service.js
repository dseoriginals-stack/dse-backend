import nodemailer from "nodemailer"

/*
-----------------------------------
TRANSPORT
-----------------------------------
*/

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

/*
-----------------------------------
BASE TEMPLATE (PREMIUM UI)
-----------------------------------
*/

const baseTemplate = (content) => `
  <div style="background:#f1f5f9;padding:40px 0;font-family:Arial,sans-serif;">
    
    <div style="max-width:600px;margin:auto;background:white;border-radius:16px;overflow:hidden;">

      <!-- HEADER -->
      <div style="background:#274C77;color:white;padding:20px 30px;">
        <h2 style="margin:0;">DSE Originals</h2>
      </div>

      <!-- BODY -->
      <div style="padding:30px;">
        ${content}
      </div>

      <!-- FOOTER -->
      <div style="background:#f8fafc;padding:20px 30px;font-size:12px;color:#64748b;">
        <p style="margin:0;">Need help? Contact support anytime.</p>
        <p style="margin-top:6px;">© ${new Date().getFullYear()} DSE Originals</p>
      </div>

    </div>

  </div>
`

/*
-----------------------------------
PRODUCT LIST HTML
-----------------------------------
*/

const renderItems = (items = []) => {
  return items.map(item => `
    <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
      <span>${item.productName} × ${item.quantity}</span>
      <strong>₱${Number(item.price * item.quantity).toLocaleString()}</strong>
    </div>
  `).join("")
}

/*
-----------------------------------
BUTTON
-----------------------------------
*/

const button = (label, url) => `
  <a href="${url}"
     style="
       display:inline-block;
       margin-top:20px;
       padding:12px 20px;
       background:#274C77;
       color:white;
       border-radius:8px;
       text-decoration:none;
       font-weight:600;
     ">
     ${label}
  </a>
`

/*
-----------------------------------
ORDER PAID EMAIL
-----------------------------------
*/

export const sendOrderPaidEmail = async (to, order) => {

  const content = `
    <h2 style="margin-top:0;">🎉 Payment Confirmed</h2>

    <p>Your order has been successfully paid.</p>

    <div style="margin:20px 0;">
      <strong>Order ID:</strong> ${order.id}<br/>
      <strong>Total:</strong> ₱${Number(order.total).toLocaleString()}
    </div>

    <hr style="margin:20px 0"/>

    <h3>Items</h3>

    ${renderItems(order.items || [])}

    ${button("View Order", `${process.env.CLIENT_URL}/orders/${order.id}`)}
  `

  await transporter.sendMail({
    from: `"DSE Originals" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Payment Confirmed",
    html: baseTemplate(content)
  })
}

/*
-----------------------------------
SHIPPED EMAIL
-----------------------------------
*/

export const sendShippedEmail = async (to, order) => {

  const content = `
    <h2 style="margin-top:0;">🚚 Your Order is on the Way</h2>

    <p>Your package has been shipped.</p>

    <div style="margin:20px 0;">
      <strong>Order ID:</strong> ${order.id}<br/>
      ${order.trackingNo ? `<strong>Tracking #:</strong> ${order.trackingNo}` : ""}
    </div>

    <hr style="margin:20px 0"/>

    <h3>Items</h3>

    ${renderItems(order.items || [])}

    ${button("Track Order", `${process.env.CLIENT_URL}/orders/${order.id}`)}
  `

  await transporter.sendMail({
    from: `"DSE Originals" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Order Has Shipped",
    html: baseTemplate(content)
  })
}
/*
-----------------------------------
ABANDONED CART EMAIL (RECOVERY)
-----------------------------------
*/

export const sendAbandonedCartEmail = async (to, cart, recoveryUrl) => {

  const items = cart.items.map(item => ({
    productName: item.variant.product.name,
    quantity: item.quantity,
    price: item.variant.price
  }))

  const content = `
    <h2 style="margin-top:0;">🛒 You Left Something Behind</h2>

    <p>Your cart is waiting for you. Complete your purchase before items run out.</p>

    <div style="margin:20px 0;">
      <strong>Items in your cart:</strong>
    </div>

    ${renderItems(items)}

    ${button("Restore Cart", recoveryUrl)}
  `

  await transporter.sendMail({
    from: `"DSE Originals" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Complete your order before it's gone",
    html: baseTemplate(content)
  })
}