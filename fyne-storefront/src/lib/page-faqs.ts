import type { CollectionSummary, ProductSummary, StoreSettings } from '@/lib/types';
import type { Faq } from '@/components/seo/FaqSection';

const brand = 'FYNE SURFACES';

export function homeFaqs(collections: CollectionSummary[]): Faq[] {
  const collectionNames = collections.length ? collections.map((item) => item.name).join(', ') : 'artificial plants and vertical garden plants';
  return [
    { question: `What does ${brand} offer?`, answer: 'FYNE SURFACES offers lifelike artificial trees, plants, bush packs, hanging creepers and plants for vertical gardens.' },
    { question: 'Are the plants artificial?', answer: 'Yes. The store specializes in lifelike artificial plants designed for decoration.' },
    { question: 'Do artificial plants need watering?', answer: 'No watering is needed. Artificial plants also do not need sunlight or pruning.' },
    { question: 'Where can artificial plants be used?', answer: 'The catalog presents plants for homes, offices, hotels, retail spaces and other interiors.' },
    { question: 'Which collections can I browse?', answer: `Current collections include ${collectionNames}.` },
    { question: 'How do I choose the right size?', answer: 'Compare the listed height and other specifications on each product page with the space where you plan to place it.' },
    { question: 'Where can I see product prices?', answer: 'Prices are shown on product cards and product detail pages in Indian rupees.' },
    { question: 'How do I check product availability?', answer: 'Open a product page to see its current availability status before adding it to your cart.' },
    { question: 'Can I order products online?', answer: 'Yes. Add an available product to your cart and continue to checkout to place an online order.' },
    { question: 'How is shipping calculated?', answer: 'Available shipping charges are calculated and shown during checkout.' },
    { question: 'Can I ask for help with a larger project?', answer: 'Yes. Use the contact page to discuss a vertical garden, green wall or business installation with the team.' },
    { question: 'How can I contact FYNE SURFACES?', answer: 'Visit the contact page for the store address and phone number, or use the contact form if one is available.' },
  ];
}

export function collectionIndexFaqs(collections: CollectionSummary[]): Faq[] {
  const collectionNames = collections.length ? collections.map((item) => item.name).join(', ') : 'the available plant collections';
  return [
    { question: 'How are products organised?', answer: `Products are grouped into collections such as ${collectionNames}, so you can browse by plant type.` },
    { question: 'How do I open a collection?', answer: 'Choose a collection tile to view its products and collection details.' },
    { question: 'Can I compare product sizes?', answer: 'Open product pages and compare their listed dimensions and specifications.' },
    { question: 'Are these real plants?', answer: 'The collections feature lifelike artificial plants.' },
    { question: 'Do artificial plants need water or sunlight?', answer: 'No. Artificial plants do not need watering or sunlight.' },
    { question: 'Where can I see a product price?', answer: 'Each product card and detail page displays the listed price in Indian rupees.' },
    { question: 'How do I check if an item is available?', answer: 'Open the product page to see its current availability status.' },
    { question: 'Can I filter products in a collection?', answer: 'Collection pages provide filters where available, including product attributes such as height and price.' },
    { question: 'How do I place an order?', answer: 'Select a product, add it to your cart and continue to checkout.' },
    { question: 'When are shipping charges shown?', answer: 'Shipping charges are calculated and displayed during checkout.' },
    { question: 'Can businesses ask about larger orders?', answer: 'Yes. Contact the team to discuss a business or vertical garden project.' },
    { question: 'Where can I get help choosing products?', answer: 'Use the contact page to ask the FYNE SURFACES team for product or project guidance.' },
  ];
}

export function collectionFaqs(name: string, productCount: number): Faq[] {
  const collectionSummary = productCount
    ? `This collection brings together ${productCount} listed ${productCount === 1 ? 'product' : 'products'} under ${name}.`
    : `There are currently no product listings in ${name}. Contact FYNE SURFACES for help finding a suitable product.`;
  return [
    { question: `What is included in the ${name} collection?`, answer: collectionSummary },
    { question: `Are the ${name} products artificial?`, answer: 'FYNE SURFACES specializes in lifelike artificial plants for decorative spaces.' },
    { question: 'How can I compare the products here?', answer: 'Open individual product pages to compare their photos, prices and catalog specifications.' },
    { question: 'Where can I find product dimensions?', answer: 'Product dimensions and other catalog specifications appear on each product detail page.' },
    { question: 'How do I check availability?', answer: 'Each product page shows the current availability status.' },
    { question: 'Where are prices listed?', answer: 'The product card and product detail page show the listed price in Indian rupees.' },
    { question: 'Can I filter this collection?', answer: 'Use the collection filters, when available, to narrow products by listed attributes such as height or price.' },
    { question: 'Do these products need watering?', answer: 'No watering is needed for artificial plants.' },
    { question: 'Do these products need sunlight?', answer: 'Artificial plants do not need sunlight; check each product page for its listed use and specifications.' },
    { question: 'How do I order an item?', answer: 'Open an available product, add it to your cart and continue to checkout.' },
    { question: 'How is shipping calculated?', answer: 'Shipping charges are calculated during checkout.' },
    { question: 'Can I get help selecting products for a project?', answer: 'Yes. Contact the FYNE SURFACES team to discuss a space or larger project.' },
  ];
}

export function productFaqs(product: ProductSummary): Faq[] {
  const name = product.name;
  const specs = product.specifications;
  const height = specs.height ? `${specs.height.value ?? 'Not specified'} ${specs.height.unit || ''}`.trim() : null;
  const material = [specs.trunkMaterial, specs.leaves?.material && `${specs.leaves.material} leaves`].filter(Boolean).join(', ');
  const generated: Faq[] = [
    { question: `What is ${name}?`, answer: product.summary || `${name} is listed in the ${product.collection?.name || 'FYNE SURFACES'} collection.` },
    { question: `What is the SKU for ${name}?`, answer: `The SKU is ${product.sku}.` },
    { question: `What is the listed price of ${name}?`, answer: `${name} is currently listed at ${product.price.formatted}. The product page shows its tax information.` },
    { question: `Is ${name} currently available?`, answer: product.availability.inStock ? 'The product page currently shows this item as in stock.' : 'The product page currently shows this item as out of stock.' },
    { question: `What is the height of ${name}?`, answer: height ? `The catalog lists the height as ${height}. See the specifications for other dimensions.` : 'Check the specifications section on this page for any dimensions supplied in the catalog.' },
    { question: `How many pieces are included with ${name}?`, answer: specs.packSize ? `The catalog lists a pack size of ${specs.packSize} ${specs.packSize === 1 ? 'piece' : 'pieces'}.` : 'A pack size is not listed in the product specifications.' },
    { question: `What material details are listed for ${name}?`, answer: material || 'See the specifications section for the material details provided in the catalog.' },
    { question: `Does ${name} need watering?`, answer: 'No watering is needed for this artificial plant.' },
    { question: `Does ${name} need sunlight?`, answer: 'Artificial plants do not need sunlight. Check this page for product-specific use details.' },
    { question: `Where can I use ${name}?`, answer: `Review the product description and specifications for its recommended use. The ${brand} catalog covers plants for homes, offices, hotels and retail spaces.` },
    { question: `How do I order ${name}?`, answer: 'If the item is available, use Add to cart and continue to checkout.' },
    { question: `Who can help me choose ${name}?`, answer: 'Contact the FYNE SURFACES team for help matching the product to your space or project.' },
  ];
  const supplied = product.faqs || [];
  const combined = [...supplied, ...generated];
  const seen = new Set<string>();
  return combined.filter((faq) => {
    const key = faq.question.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

export function contentPageFaqs(slug: string, title: string, excerpt?: string, settings?: StoreSettings | null): Faq[] {
  if (slug === 'contact') {
    const address = settings?.contact?.address || 'See the contact details shown on this page.';
    const phone = settings?.contact?.phone || 'Use the contact options shown on this page.';
    return [
      { question: 'Where is the FYNE SURFACES store?', answer: `The store address is ${address.replace(/\n/g, ', ')}.` },
      { question: 'What phone number can I call?', answer: `Call FYNE SURFACES at ${phone}.` },
      { question: 'How can I ask a product question?', answer: 'Call the store using the number shown above or use the contact options on this page.' },
      { question: 'Can I discuss a vertical garden project?', answer: 'Yes. Contact the team with your space details to discuss a vertical garden or green wall project.' },
      { question: 'Can I ask for help choosing artificial plants?', answer: 'Yes. Contact the team for help comparing products and catalog specifications.' },
      { question: 'Can I place an order online?', answer: 'Yes. Products can be added to the cart and ordered through the online checkout when available.' },
      { question: 'Where can I check product prices?', answer: 'Prices are displayed on product cards and product detail pages.' },
      { question: 'Where can I check product availability?', answer: 'Open the product detail page to see its current availability.' },
      { question: 'What details should I share for a project enquiry?', answer: 'Share the type of space, approximate dimensions and the plant style you are considering.' },
      { question: 'Can offices and businesses contact the team?', answer: 'Yes. The team can discuss plant needs for offices, hotels, retail spaces and larger installations.' },
      { question: 'Do artificial plants need maintenance?', answer: 'Artificial plants do not require watering, sunlight or pruning.' },
      { question: 'Can I visit the store?', answer: 'Contact the store using the listed phone number to confirm visit arrangements before travelling.' },
    ];
  }

  if (slug === 'shipping-policy') {
    const policyRef = 'Refer to the shipping policy text above for the current details. If it does not answer your question, contact FYNE SURFACES.';
    return [
      { question: 'Where can I read the shipping terms?', answer: `The current shipping terms are published on this ${title} page.` },
      { question: 'When are shipping charges shown?', answer: 'Shipping charges are calculated and shown during checkout.' },
      { question: 'How long does delivery take?', answer: policyRef },
      { question: 'Which locations can FYNE SURFACES deliver to?', answer: policyRef },
      { question: 'Can I change my delivery address after ordering?', answer: 'Contact FYNE SURFACES as soon as possible with your order details to ask whether an address change can be made.' },
      { question: 'How can I ask about an existing shipment?', answer: 'Contact FYNE SURFACES with your order details for assistance.' },
      { question: 'Is shipping free?', answer: 'Check the shipping terms and the total shown at checkout for the current order.' },
      { question: 'Can I request delivery for a business project?', answer: 'Contact the team to discuss shipping for a larger or business order.' },
      { question: 'What should I do if my delivery is delayed?', answer: 'Contact FYNE SURFACES with your order details so the team can help.' },
      { question: 'Can I ask about a damaged delivery?', answer: 'Contact FYNE SURFACES with your order details and information about the issue.' },
      { question: 'Do shipping terms change by product?', answer: policyRef },
      { question: 'How do I contact the store about shipping?', answer: 'Use the phone number or address listed on the contact page.' },
    ];
  }

  if (slug === 'about') {
    return [
      { question: 'What is FYNE SURFACES?', answer: excerpt?.trim() || 'FYNE SURFACES offers lifelike artificial plants and vertical garden products.' },
      { question: 'What products does FYNE SURFACES offer?', answer: 'The store offers artificial trees, plants, bush packs, hanging creepers and plants for vertical gardens.' },
      { question: 'Are the plants artificial?', answer: 'Yes. FYNE SURFACES specializes in lifelike artificial plants.' },
      { question: 'Do artificial plants need watering?', answer: 'No watering is needed for artificial plants.' },
      { question: 'Do artificial plants need sunlight?', answer: 'Artificial plants do not need sunlight.' },
      { question: 'Where can I browse the collections?', answer: 'Visit the collections page to browse the available product groups.' },
      { question: 'Where can I see product dimensions?', answer: 'Product pages show the dimensions and other specifications supplied in the catalog.' },
      { question: 'Can I order products online?', answer: 'Available products can be added to the cart and ordered through checkout.' },
      { question: 'Where are product prices listed?', answer: 'Prices appear on product cards and product detail pages.' },
      { question: 'How can I check availability?', answer: 'Open a product page to see its current availability status.' },
      { question: 'Does FYNE SURFACES work with businesses?', answer: 'The team can discuss plant needs for offices, hotels, retail spaces and larger installations.' },
      { question: 'How can I contact FYNE SURFACES?', answer: 'Use the phone number or address shown on the contact page.' },
    ];
  }

  const pageSummary = excerpt?.trim() || `Read the ${title} page for FYNE SURFACES information and guidance.`;
  return [
    { question: `What is covered on the ${title} page?`, answer: pageSummary },
    { question: `Where can I find the latest ${title} information?`, answer: 'The information published on this page is the current reference. Contact FYNE SURFACES if you need clarification.' },
    { question: `Who can I contact about ${title.toLowerCase()}?`, answer: 'Use the phone number or other contact details on the contact page to reach FYNE SURFACES.' },
    { question: 'What products does FYNE SURFACES offer?', answer: 'The store offers lifelike artificial trees, plants, bush packs, hanging creepers and plants for vertical gardens.' },
    { question: 'Are the plants artificial?', answer: 'Yes. FYNE SURFACES specializes in lifelike artificial plants.' },
    { question: 'Do artificial plants need watering?', answer: 'No watering is needed for artificial plants.' },
    { question: 'Do artificial plants need sunlight?', answer: 'Artificial plants do not need sunlight.' },
    { question: 'Where can I browse the collections?', answer: 'Visit the collections page to browse the available product groups.' },
    { question: 'Where can I see product dimensions?', answer: 'Product pages show the dimensions and other specifications supplied in the catalog.' },
    { question: 'How can I check product availability?', answer: 'Open a product page to see its current availability status.' },
    { question: 'Can I order products online?', answer: 'Available products can be added to the cart and ordered through checkout.' },
    { question: 'How do I request help for a project?', answer: 'Use the contact page to discuss your space or a larger artificial plant project with the team.' },
  ];
}
