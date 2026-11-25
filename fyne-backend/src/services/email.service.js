'use strict';

const env = require('../config/env');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function shell({ preheader, title, body }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f7f4;font-family:Arial,Helvetica,sans-serif;color:#1d2920"><span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0">${escapeHtml(preheader)}</span><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7f4;padding:32px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:#2E7D32;padding:25px 36px;color:#fff"><div style="font-size:20px;font-weight:700;letter-spacing:1.8px">FYNE <span style="color:#F57C00">SURFACES</span></div><div style="font-size:11px;letter-spacing:2px;margin-top:5px;color:#e6f0e5">PREMIUM VERTICAL GARDEN</div></td></tr><tr><td style="padding:36px"><h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;color:#173d1b">${title}</h1>${body}<p style="margin:30px 0 0;color:#68736a;font-size:14px;line-height:1.7">Warm regards,<br><strong style="color:#2E7D32">FYNE SURFACES</strong></p></td></tr><tr><td style="padding:18px 36px;background:#f8faf7;border-top:1px solid #e7ece6;color:#79827a;font-size:12px;line-height:1.6">Thoughtful greenery for homes, offices and everyday spaces.<br><a href="${env.siteUrl}" style="color:#2E7D32">${escapeHtml(env.siteUrl)}</a></td></tr></table></td></tr></table></body></html>`;
}

function button(label, href) {
  return `<p style="margin:26px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#F57C00;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:999px">${escapeHtml(label)}</a></p>`;
}

async function send({ to, subject, html, kind }) {
  try {
    const smtp = env.email.smtp;
    if (smtp.host && smtp.user && smtp.pass && env.email.from) {
      const transporter = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure, auth: { user: smtp.user, pass: smtp.pass } });
      await transporter.sendMail({ from: env.email.from, to, subject, html });
      logger.info('email_sent', { kind, to, provider: 'smtp' });
      return true;
    }
    if (!env.email.apiKey || !env.email.from) {
      logger.warn('email_skipped_not_configured', { kind, to });
      return false;
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.email.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.email.from, to: [to], subject, html }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || `Resend request failed (${response.status})`);
    logger.info('email_sent', { kind, to, provider: 'resend' });
    return true;
  } catch (error) {
    logger.error('email_send_failed', { kind, to, message: error.message });
    return false;
  }
}

function sendWelcome(customer) {
  const name = escapeHtml(customer.name || 'there');
  return send({
    to: customer.email,
    subject: 'Welcome to FYNE SURFACES',
    kind: 'welcome',
    html: shell({
      preheader: 'Welcome to FYNE SURFACES — thoughtful greenery for your space.',
      title: `Welcome, ${name}.`,
      body: `<p style="font-size:16px;line-height:1.75;color:#526057">We’re glad you found us. Explore lifelike greenery designed to bring lasting warmth and texture to your space.</p>${button('Explore collections', `${env.siteUrl}/collections`)}`,
    }),
  });
}

function sendCustomerVerification(customer, verificationUrl) {
  const name = escapeHtml(customer.name || 'there');
  return send({
    to: customer.email,
    subject: 'Verify your FYNE SURFACES account',
    kind: 'customer_email_verification',
    html: shell({
      preheader: 'Verify your email to finish creating your FYNE SURFACES account.',
      title: `One quick step, ${name}.`,
      body: `<p style="font-size:15px;line-height:1.7;color:#526057">Confirm this email address to activate your account and continue to checkout.</p>${button('Verify email address', verificationUrl)}<p style="font-size:13px;color:#68736a">This link expires in 24 hours. If you did not create an account, you can ignore this message.</p>`,
    }),
  });
}

function sendCustomerPasswordReset(customer, resetUrl) {
  const name = escapeHtml(customer.name || 'there');
  return send({
    to: customer.email,
    subject: 'Reset your FYNE SURFACES password',
    kind: 'customer_password_reset',
    html: shell({
      preheader: 'Use this secure link to reset your account password.',
      title: `Password reset, ${name}.`,
      body: `<p style="font-size:15px;line-height:1.7;color:#526057">We received a request to reset your FYNE SURFACES password. Use the button below to choose a new password.</p>${button('Reset password', resetUrl)}<p style="font-size:13px;color:#68736a">This link expires in one hour. If you did not request a reset, you can ignore this email.</p>`,
    }),
  });
}

function sendOrderConfirmation(order) {
  const items = (order.orderItems || []).map((item) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e7ece6;color:#344239">${escapeHtml(item.name)} <span style="color:#7a857c">× ${item.qty}</span></td><td align="right" style="padding:10px 0;border-bottom:1px solid #e7ece6;font-weight:700">₹${(item.lineTotal || item.price * item.qty).toLocaleString('en-IN')}</td></tr>`).join('');
  const total = Number(order.totalAmount || 0).toLocaleString('en-IN');
  return send({
    to: order.email,
    subject: `Order #${order.orderNumber} confirmed`,
    kind: 'order_confirmation',
    html: shell({
      preheader: `Your order #${order.orderNumber} is confirmed.`,
      title: 'Your order is confirmed.',
      body: `<p style="font-size:15px;line-height:1.7;color:#526057">Thank you for your order. We’ve received your payment and are preparing your greenery.</p><p style="margin:24px 0 12px;font-weight:700;color:#2E7D32">ORDER #${escapeHtml(order.orderNumber)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${items}<tr><td style="padding:16px 0;font-weight:700">Total</td><td align="right" style="padding:16px 0;font-size:18px;font-weight:700;color:#2E7D32">₹${total}</td></tr></table>${button('Continue browsing', `${env.siteUrl}/collections`)}`,
    }),
  });
}

function sendCodOrderConfirmation(order) {
  const items = (order.orderItems || []).map((item) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e7ece6;color:#344239">${escapeHtml(item.name)} <span style="color:#7a857c">× ${item.qty}</span></td><td align="right" style="padding:10px 0;border-bottom:1px solid #e7ece6;font-weight:700">₹${(item.lineTotal || item.price * item.qty).toLocaleString('en-IN')}</td></tr>`).join('');
  const total = Number(order.totalAmount || 0).toLocaleString('en-IN');
  const customerEmail = send({
    to: order.email,
    subject: `COD order #${order.orderNumber} received`,
    kind: 'cod_order_confirmation',
    html: shell({
      preheader: `Your Cash on Delivery order #${order.orderNumber} has been received.`,
      title: 'We’ve received your order.',
      body: `<p style="font-size:15px;line-height:1.7;color:#526057">Thank you for your order. We’re preparing your greenery. Pay the total below when it is delivered.</p><p style="margin:24px 0 12px;font-weight:700;color:#2E7D32">ORDER #${escapeHtml(order.orderNumber)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${items}<tr><td style="padding:16px 0;font-weight:700">Cash due on delivery</td><td align="right" style="padding:16px 0;font-size:18px;font-weight:700;color:#2E7D32">₹${total}</td></tr></table>${button('Track your order', `${env.siteUrl}/account/orders`)}`,
    }),
  });
  const internalEmail = env.email.orderTo
    ? send({ to: env.email.orderTo, subject: `New COD order #${order.orderNumber}`, kind: 'new_cod_order_notification', html: shell({ preheader: `New COD order #${order.orderNumber}.`, title: 'A new COD order was placed.', body: `<p style="font-size:15px;line-height:1.7;color:#526057">Order <strong>#${escapeHtml(order.orderNumber)}</strong> has a total of ₹${total} and is awaiting fulfilment.</p>` }) })
    : Promise.resolve(true);
  return Promise.all([customerEmail, internalEmail]).then((results) => results.every(Boolean));
}

function sendContactNotification(message) {
  if (!env.email.contactTo) {
    logger.info('contact_notification_skipped_no_recipient', { messageId: String(message._id) });
    return Promise.resolve(false);
  }
  const details = [message.email && `Email: ${escapeHtml(message.email)}`, message.phone && `Phone: ${escapeHtml(message.phone)}`].filter(Boolean).join('<br>');
  return send({
    to: env.email.contactTo,
    subject: `Website enquiry${message.subject ? `: ${String(message.subject).replace(/[\r\n]+/g, ' ').slice(0, 120)}` : ''}`,
    kind: 'contact_message_notification',
    html: shell({ preheader: 'A new message was submitted through the FYNE SURFACES website.', title: 'New website enquiry', body: `<p><strong>From:</strong> ${escapeHtml(message.name)}</p><p>${details}</p><p><strong>Subject:</strong> ${escapeHtml(message.subject || 'General enquiry')}</p><p style="white-space:pre-wrap;line-height:1.7;color:#526057">${escapeHtml(message.message)}</p>` }),
  });
}

function sendOrderShipped(order) {
  const tracking = order.tracking || {};
  const trackingBlock = tracking.url
    ? button('Track your shipment', tracking.url)
    : tracking.number
      ? `<p style="padding:14px 16px;background:#f5f7f4;border-radius:10px;color:#526057">${escapeHtml(tracking.carrier || 'Tracking')} number: <strong>${escapeHtml(tracking.number)}</strong></p>`
      : '';
  return send({
    to: order.email,
    subject: `Order #${order.orderNumber} is on its way`,
    kind: 'order_shipped',
    html: shell({
      preheader: `Order #${order.orderNumber} has shipped.`,
      title: 'Your order is on its way.',
      body: `<p style="font-size:15px;line-height:1.7;color:#526057">Good news — order <strong>#${escapeHtml(order.orderNumber)}</strong> has shipped. We hope it brings a little more green to your space.</p>${trackingBlock}${button('Visit FYNE SURFACES', env.siteUrl)}`,
    }),
  });
}

function sendOrderStatusUpdate(order, previousStatus) {
  const status = escapeHtml(order.orderStatus || 'updated');
  const previous = escapeHtml(previousStatus || '');
  const tracking = order.tracking || {};
  const trackingLine = tracking.number ? `<p style="padding:14px 16px;background:#f5f7f4;border-radius:10px;color:#526057">${escapeHtml(tracking.carrier || 'Tracking')} number: <strong>${escapeHtml(tracking.number)}</strong></p>` : '';
  return send({
    to: order.email,
    subject: `Order #${order.orderNumber} update: ${order.orderStatus}`,
    kind: 'order_status_update',
    html: shell({
      preheader: `Your order #${order.orderNumber} status is now ${status}.`,
      title: `Order ${status.toLowerCase()}.`,
      body: `<p style="font-size:15px;line-height:1.7;color:#526057">The status of order <strong>#${escapeHtml(order.orderNumber)}</strong> changed from ${previous || 'new'} to <strong>${status}</strong>.</p>${trackingLine}${button('Visit FYNE SURFACES', env.siteUrl)}`,
    }),
  });
}

module.exports = { sendWelcome, sendCustomerVerification, sendCustomerPasswordReset, sendOrderConfirmation, sendCodOrderConfirmation, sendContactNotification, sendOrderShipped, sendOrderStatusUpdate };
