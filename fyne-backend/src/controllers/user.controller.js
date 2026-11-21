'use strict';

/** Superadmin-only staff management (Settings → Users & permissions). */
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');
const { ROLES, permissionsFor, ROLE_PERMISSIONS } = require('../config/permissions');
const { parsePagination, parseSort, searchFilter, combine, paginate } = require('../utils/query');

async function loadManageableUser(req) {
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, 'User not found');
  if (String(target._id) === String(req.user._id)) throw new ApiError(400, 'You cannot modify your own account here', 'SELF_MODIFY');
  if (target.role === ROLES.SUPERADMIN) throw new ApiError(403, 'Superadmin accounts cannot be modified', 'PROTECTED_ACCOUNT');
  return target;
}

/** POST /api/v1/admin/users — create an admin or editor. */
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, password, role, createdBy: req.user._id });
  res.status(201).json({ success: true, data: user });
});

/** GET /api/v1/admin/users?role=&isActive=&q= */
exports.getUsers = asyncHandler(async (req, res) => {
  const pg = parsePagination(req.query);
  const sort = parseSort(req.query.sort, ['name', 'email', 'role', 'createdAt', 'lastLoginAt']);
  const base = {};
  if (Object.values(ROLES).includes(req.query.role)) base.role = req.query.role;
  if (req.query.isActive === 'true' || req.query.isActive === 'false') base.isActive = req.query.isActive === 'true';
  const filter = combine(base, searchFilter(req.query.q, ['name', 'email']));
  const { items, pagination } = await paginate(User, filter, { ...pg, sort, populate: { path: 'createdBy', select: 'name email' } });
  res.json({ success: true, data: items, pagination });
});

/** GET /api/v1/admin/users/roles — role → permission matrix (for the "Roles" UI). */
exports.getRoles = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: Object.keys(ROLE_PERMISSIONS).map((role) => ({ role, permissions: permissionsFor(role) })) });
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('createdBy', 'name email');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

/** PATCH /api/v1/admin/users/:id/role */
exports.updateUserRole = asyncHandler(async (req, res) => {
  const user = await loadManageableUser(req);
  user.role = req.body.role;
  await user.save();
  res.json({ success: true, data: user });
});

/** PATCH /api/v1/admin/users/:id/status — deactivate also kills their session. */
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const user = await loadManageableUser(req);
  user.isActive = req.body.isActive;
  if (!user.isActive) user.refreshToken = undefined;
  await user.save();
  res.json({ success: true, data: user });
});

/** DELETE /api/v1/admin/users/:id */
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await loadManageableUser(req);
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});
