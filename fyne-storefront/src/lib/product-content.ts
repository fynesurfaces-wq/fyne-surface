import type { ProductSummary } from './types';
import { ftToCm, heightInFeet } from './utils';
import type { SpecSection } from '@/components/product/SpecsAccordion';

const MATERIAL: Record<string, string> = { PE: 'PE (polyethylene)', PU: 'PU (polyurethane)', PVC: 'PVC', SILK: 'silk fabric', POLYESTER: 'polyester fabric' };
const material = (m?: string) => (m ? MATERIAL[m.toUpperCase()] || m : undefined);
const n = (x: number) => x.toLocaleString('en-IN');
const PLACEMENT = { indoor: 'Indoor', outdoor: 'Outdoor', both: 'Indoor & outdoor' } as const;

/**
 * AEO/GEO: short, factual, self-contained statements built ONLY from the
 * product's typed data — e.g. "Stands 5.5 ft (168 cm) tall." Answer engines
 * can quote these verbatim without misattributing anything.
 */
export function keyFacts(p: ProductSummary): string[] {
  const s = p.specifications || {};
  const facts: string[] = [];
  const ft = heightInFeet(s.height);
  if (ft && s.height?.value != null) facts.push(`Stands ${s.height.value} ${s.height.unit ?? 'ft'} (${ftToCm(ft)} cm) tall.`);
  if (s.leaves?.count != null) facts.push(`Includes ${n(s.leaves.count)} ${s.leaves.material ? `${material(s.leaves.material)} ` : ''}leaves.`);
  else if (s.leaves?.material) facts.push(`Leaves made of ${material(s.leaves.material)}.`);
  if (s.flowers != null) facts.push(`Features ${n(s.flowers)} flowers.`);
  if (s.trunkMaterial) facts.push(`Built on a ${s.trunkMaterial.toLowerCase()} trunk.`);
  if (s.packSize) facts.push(`Sold as a pack of ${s.packSize} pieces.`);
  if (s.indoorOutdoor) facts.push(`Suitable for ${PLACEMENT[s.indoorOutdoor].toLowerCase()} use.`);
  if (s.uvResistant) facts.push('UV resistant.');
  if (s.fireRetardant) facts.push('Fire retardant.');
  if (s.potIncluded === true) facts.push('Supplied with a pot.');
  for (const [name, value] of Object.entries(s.additional || {})) {
    if (name.trim() && String(value).trim()) facts.push(`${name.trim()}: ${String(value).trim()}.`);
  }
  if (s.additionalNotes?.trim()) facts.push(s.additionalNotes.trim());
  facts.push('No watering, sunlight or pruning required.');
  return facts;
}

/** Grouped specs for the accordion — only sections that have data. */
export function specSections(p: ProductSummary): SpecSection[] {
  const s = p.specifications || {};
  const sections: SpecSection[] = [];
  const ft = heightInFeet(s.height);

  if (ft && s.height?.value != null) {
    sections.push({
      id: 'height',
      title: 'Height & Dimensions',
      rows: [
        { label: 'Height', value: `${s.height.value} ${s.height.unit ?? 'ft'}` },
        { label: 'Height (cm)', value: `${ftToCm(ft)} cm` },
        { label: 'Height (m)', value: `${(ft * 0.3048).toFixed(2)} m` },
      ],
    });
  }
  const foliage = [
    s.leaves?.count != null && { label: 'Leaf count', value: n(s.leaves.count) },
    s.leaves?.material && { label: 'Leaf material', value: material(s.leaves.material)! },
    s.flowers != null && { label: 'Flowers', value: n(s.flowers) },
  ].filter(Boolean) as SpecSection['rows'];
  if (foliage.length) sections.push({ id: 'leaves', title: 'Leaves & Foliage', rows: foliage });

  if (s.trunkMaterial) sections.push({ id: 'trunk', title: 'Trunk & Structure', rows: [{ label: 'Trunk material', value: s.trunkMaterial }] });

  const additional = Object.entries(s.additional || {})
    .filter(([name, value]) => name.trim() && String(value).trim())
    .map(([label, value]) => ({ label: label.trim(), value: String(value).trim() }));
  if (additional.length || s.additionalNotes?.trim()) sections.push({
    id: 'additional',
    title: 'Additional Specifications',
    rows: additional,
    note: s.additionalNotes?.trim(),
  });

  if (s.packSize) sections.push({ id: 'pack', title: 'Pack Contents', rows: [{ label: 'Pieces per pack', value: `${s.packSize}` }] });

  const pot = [
    s.potIncluded != null && { label: 'Pot included', value: s.potIncluded ? 'Yes' : 'No' },
    s.indoorOutdoor && { label: 'Suitable for', value: PLACEMENT[s.indoorOutdoor] },
    s.uvResistant && { label: 'UV resistant', value: 'Yes' },
    s.fireRetardant && { label: 'Fire retardant', value: 'Yes' },
  ].filter(Boolean) as SpecSection['rows'];
  sections.push({
    id: 'pot',
    title: 'Pot & Placement',
    rows: pot.length ? pot : [{ label: 'Planter', value: 'Not specified' }],
    note: s.potIncluded ? undefined : 'Looking for a matching planter? Contact our team for options sized to this product.',
  });

  sections.push({
    id: 'care',
    title: 'Care',
    rows: [
      { label: 'Watering', value: 'Not required' },
      { label: 'Sunlight', value: 'Not required' },
      { label: 'Cleaning', value: 'Dust with a soft, dry cloth' },
    ],
  });
  return sections;
}
