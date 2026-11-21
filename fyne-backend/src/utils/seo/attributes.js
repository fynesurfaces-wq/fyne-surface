'use strict';

/**
 * Turns typed `specifications` into a normalised attribute list.
 * Shared by the JSON-LD generator (Schema.org PropertyValue) and the AEO
 * presenter (human/AI-readable "Height: 5.5 ft").
 */
const UNIT_CODES = { ft: 'FOT', m: 'MTR', cm: 'CMT', in: 'INH' }; // UN/CEFACT codes used by Schema.org
const UNIT_LABELS = { ft: 'ft', m: 'm', cm: 'cm', in: 'in' };
const MATERIAL_LABELS = {
  PE: 'PE (polyethylene)',
  PU: 'PU (polyurethane)',
  PVC: 'PVC',
  SILK: 'silk fabric',
  POLYESTER: 'polyester fabric',
};

const materialLabel = (m) => (m ? MATERIAL_LABELS[String(m).toUpperCase()] || m : undefined);
const yesNo = (b) => (b ? 'Yes' : 'No');
const num = (n) => Number(n).toLocaleString('en-IN');

function buildAttributes(specs = {}) {
  const s = typeof specs.toObject === 'function' ? specs.toObject() : specs;
  const attrs = [];

  if (s.height?.value != null) {
    const unit = s.height.unit || 'ft';
    attrs.push({ key: 'height', name: 'Height', value: s.height.value, unit, unitCode: UNIT_CODES[unit], display: `${s.height.value} ${UNIT_LABELS[unit]}` });
  }
  if (s.leaves?.count != null) {
    attrs.push({ key: 'leafCount', name: 'Leaf count', value: s.leaves.count, display: num(s.leaves.count) });
  }
  if (s.leaves?.material) {
    attrs.push({ key: 'leafMaterial', name: 'Leaf material', value: materialLabel(s.leaves.material), display: materialLabel(s.leaves.material) });
  }
  if (s.trunkMaterial) attrs.push({ key: 'trunkMaterial', name: 'Trunk material', value: s.trunkMaterial, display: s.trunkMaterial });
  if (s.flowers != null) attrs.push({ key: 'flowerCount', name: 'Flower count', value: s.flowers, display: num(s.flowers) });
  if (s.packSize != null) attrs.push({ key: 'packSize', name: 'Pack size', value: s.packSize, display: `${s.packSize} pcs` });
  if (s.indoorOutdoor) {
    const map = { indoor: 'Indoor', outdoor: 'Outdoor', both: 'Indoor & outdoor' };
    attrs.push({ key: 'placement', name: 'Suitable for', value: map[s.indoorOutdoor], display: map[s.indoorOutdoor] });
  }
  if (s.potIncluded != null) attrs.push({ key: 'potIncluded', name: 'Pot included', value: yesNo(s.potIncluded), display: yesNo(s.potIncluded) });
  if (s.uvResistant != null) attrs.push({ key: 'uvResistant', name: 'UV resistant', value: yesNo(s.uvResistant), display: yesNo(s.uvResistant) });
  if (s.fireRetardant != null) attrs.push({ key: 'fireRetardant', name: 'Fire retardant', value: yesNo(s.fireRetardant), display: yesNo(s.fireRetardant) });

  const additional = s.additional instanceof Map ? Object.fromEntries(s.additional) : s.additional || {};
  for (const [name, value] of Object.entries(additional)) {
    if (value !== undefined && value !== '') attrs.push({ key: name, name, value, display: String(value) });
  }
  return attrs;
}

module.exports = { buildAttributes, materialLabel, UNIT_CODES };
