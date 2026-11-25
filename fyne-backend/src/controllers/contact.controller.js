'use strict';

const crypto = require('crypto');
const { ContactMessage } = require('../models');
const { asyncHandler, pick } = require('../utils/helpers');
const env = require('../config/env');
const email = require('../services/email.service');

exports.create = asyncHandler(async (req, res) => {
  // Whitelist fields; honeypot and arbitrary client fields are never persisted.
  const data = pick(req.body, ['name', 'email', 'phone', 'subject', 'message']);
  const ipHash = crypto.createHmac('sha256', env.jwt.accessSecret).update(String(req.ip || '')).digest('hex');
  const record = await ContactMessage.create({ ...data, ipHash });
  void email.sendContactNotification(record);
  res.status(201).json({ success: true, data: { id: record._id, message: 'Your message has been received.' } });
});
