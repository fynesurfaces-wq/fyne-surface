'use strict';

const { Lead, User, Product } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, pick } = require('../utils/helpers');
const { parsePagination, parseSort, searchFilter, combine, paginate } = require('../utils/query');

/** POST /api/v1/store/leads — public enquiry / quote request form. */
exports.createPublic = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['name', 'email', 'phone', 'company', 'city', 'message', 'source', 'projectType', 'areaSqFt', 'budgetRange', 'interestedProducts', 'utm']);
  if (data.interestedProducts?.length) {
    const found = await Product.find({ _id: { $in: data.interestedProducts }, isActive: true }).select('_id').lean();
    data.interestedProducts = found.map((p) => p._id);
  }
  if (data.utm) data.utm = pick(data.utm, ['source', 'medium', 'campaign']);
  const lead = await Lead.create(data);
  res.status(201).json({ success: true, data: { id: lead._id, message: 'Thank you! Our team will contact you shortly.' } });
});

/** GET /api/v1/admin/leads?status&source&q */
exports.list = asyncHandler(async (req, res) => {
  const pg = parsePagination(req.query);
  const sort = parseSort(req.query.sort, ['createdAt', 'status', 'name', 'areaSqFt']);
  const f = {};
  if (req.query.status) f.status = req.query.status;
  if (req.query.source) f.source = String(req.query.source);
  if (req.query.assignedTo === 'me') f.assignedTo = req.user._id;
  const filter = combine(f, searchFilter(req.query.q, ['name', 'email', 'phone', 'company', 'city']));
  const { items, pagination } = await paginate(Lead, filter, { ...pg, sort, populate: { path: 'assignedTo', select: 'name' } });
  const pipeline = await Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  res.json({ success: true, data: items, pagination, pipeline: Object.fromEntries(pipeline.map((p) => [p._id, p.count])) });
});

exports.get = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('assignedTo notes.by', 'name')
    .populate('interestedProducts', 'name sku slug price images');
  if (!lead) throw new ApiError(404, 'Lead not found');
  res.json({ success: true, data: lead });
});

/** PATCH /api/v1/admin/leads/:id — status / assignment (Kanban drag & drop). */
exports.update = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  const data = pick(req.body, ['status', 'assignedTo', 'projectType', 'budgetRange', 'company']);
  if (data.assignedTo && !(await User.exists({ _id: data.assignedTo, isActive: true }))) throw new ApiError(422, 'Assignee not found');
  if (data.status && data.status !== lead.status) lead.notes.push({ text: `Status: ${lead.status} → ${data.status}`, by: req.user._id });
  lead.set(data);
  await lead.save();
  res.json({ success: true, data: lead });
});

/** POST /api/v1/admin/leads/:id/notes */
exports.addNote = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, { $push: { notes: { text: req.body.text, by: req.user._id } } }, { new: true }).populate('notes.by', 'name');
  if (!lead) throw new ApiError(404, 'Lead not found');
  res.status(201).json({ success: true, data: lead.notes });
});

exports.remove = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  res.json({ success: true, message: 'Lead deleted' });
});
