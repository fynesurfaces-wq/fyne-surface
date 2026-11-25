'use strict';

const { ContactMessage } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, pick } = require('../utils/helpers');
const { parsePagination, parseSort, searchFilter, combine, paginate } = require('../utils/query');

exports.list = asyncHandler(async (req, res) => {
  const pg = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = combine(req.query.status ? { status: req.query.status } : null, searchFilter(req.query.q, ['name', 'email', 'phone', 'subject', 'message']));
  const { items, pagination } = await paginate(ContactMessage, filter, {
    ...pg,
    sort: parseSort(req.query.sort, ['createdAt', 'status', 'name', 'subject']),
    select: '-ipHash',
  });
  res.json({ success: true, data: items, pagination });
});

exports.get = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findById(req.params.id).select('-ipHash').lean();
  if (!message) throw new ApiError(404, 'Contact message not found');
  res.json({ success: true, data: message });
});

exports.update = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: pick(req.body, ['status']) }, { new: true, runValidators: true }).select('-ipHash').lean();
  if (!message) throw new ApiError(404, 'Contact message not found');
  res.json({ success: true, data: message });
});

exports.remove = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) throw new ApiError(404, 'Contact message not found');
  res.json({ success: true, message: 'Contact message deleted' });
});
