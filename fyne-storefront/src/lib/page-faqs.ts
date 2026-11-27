import type { CollectionSummary, ProductSummary, StoreSettings } from '@/lib/types';
import type { Faq } from '@/components/seo/FaqSection';

const brand = 'FYNE SURFACES';

export function homeFaqs(collections: CollectionSummary[]): Faq[] {
  const collectionNames = collections.length ? collections.map((item) => item.name).join(', ') : 'artificial plants and vertical garden plants';
  return [
    { question: `What artificial plants does ${brand} sell?`, answer: `Browse lifelike decorative trees, plants and greenery products in collections such as ${collectionNames}. The live catalogue shows the products currently available.` },
    { question: 'Are artificial plants suitable for home decoration?', answer: 'The catalogue includes decorative greenery for living rooms, bedrooms, balconies and other spaces. Compare each product’s size and listed suitability with the place you have in mind.' },
    { question: 'Can artificial plants be used in offices or shops?', answer: 'Yes, decorative artificial greenery can be used in offices, hotels, retail spaces and other settings. Check the individual listing for dimensions and material details.' },
    { question: 'Do artificial plants need water or sunlight?', answer: 'Artificial plants do not need watering or sunlight. Follow the product listing for material-specific care and indoor or outdoor suitability.' },
    { question: 'How do I choose an artificial plant for my room?', answer: 'Measure the available floor, shelf or wall space, decide on the height and style you want, then compare product dimensions and photos.' },
    { question: 'Are artificial plants available for green walls and vertical gardens?', answer: 'Browse the current green wall, bush pack and vertical garden collections to see the products listed for those projects.' },
    { question: 'How do I clean artificial plants?', answer: 'Check the product materials and care details. For routine dust, use gentle cleaning suitable for the listed material and avoid harsh chemicals unless the manufacturer says they are safe.' },
    { question: 'Where can I compare artificial plant prices and sizes?', answer: 'Product cards show listed prices, while each product page provides its available dimensions, specifications, photos and stock status.' },
    { question: 'Can I buy artificial plants online in India?', answer: 'Browse the online catalogue, add an available item to your cart and enter your address at checkout to review delivery availability and the order total.' },
    { question: 'Can I enquire about wholesale or bulk artificial plants?', answer: 'Contact FYNE SURFACES with the products and quantities you need to confirm current bulk pricing, minimum quantities and delivery options.' },
    { question: 'Can FYNE help plan a vertical garden or green wall?', answer: 'Share your city, approximate measurements and preferred products through the contact page to discuss catalogue options and any project support available.' },
    { question: 'How do I check delivery and place an order?', answer: 'Enter your delivery address during checkout to review available shipping charges and the order total before placing an order.' },
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

export function locationIndexFaqs(): Faq[] {
  return [
    { question: 'What can I find on the FYNE locations page?', answer: 'Browse city guides for artificial plants and vertical garden products, then open a guide for location-specific shopping information.' },
    { question: 'How many city guides are available?', answer: `The directory currently includes ${brand} guides for 50 Indian cities.` },
    { question: 'Does a city guide show local product prices?', answer: 'Prices are listed on product cards and product pages and are displayed in Indian rupees.' },
    { question: 'How can I browse products by type?', answer: 'Visit the collections page to browse products grouped by their catalog collection.' },
    { question: 'Can I compare product dimensions?', answer: 'Yes. Review the dimensions and specifications listed on each product page.' },
    { question: 'How can I check stock?', answer: 'Product pages show current availability. Stock is checked again when an order is placed.' },
    { question: 'How do I check delivery availability for my address?', answer: 'Enter your delivery address during checkout to submit an order for that location.' },
    { question: 'What payment method is available online?', answer: 'Checkout currently offers Cash on Delivery.' },
    { question: 'Are the plants real or artificial?', answer: 'FYNE SURFACES sells artificial decorative plants and related greenery products.' },
    { question: 'Do artificial plants need sunlight or water?', answer: 'Artificial plants do not need watering or sunlight. Check each listing for its product-specific details.' },
    { question: 'Can I ask about a larger project?', answer: 'Yes. Use the contact page to share the space, approximate measurements and the products you are considering.' },
    { question: 'How do I get help with an order?', answer: 'Sign in to track an order or contact the team with your order number.' },
  ];
}

export function locationFaqs(city: string, state: string): Faq[] {
  return [
    { question: `Where can I buy artificial plants in ${city}?`, answer: `Use the FYNE SURFACES online catalogue to compare artificial plants and vertical garden products in ${city}, ${state}.` },
    { question: `What artificial greenery can I find in ${city}?`, answer: 'Browse the live collections for artificial trees, plants, bush packs and green wall products. The catalogue shows what is currently listed.' },
    { question: `How do I choose artificial plants in ${city} for my home or office?`, answer: 'Measure the space, compare the product dimensions and review each listing’s description and specifications before ordering.' },
    { question: `Can I see product sizes before ordering in ${city}?`, answer: 'Product pages display the dimensions and other specifications available in the catalogue.' },
    { question: `Where can I compare artificial plant prices in ${city}?`, answer: 'Prices are shown on product cards and product detail pages in Indian rupees.' },
    { question: `How do I check product availability in ${city}?`, answer: 'Check the product page for current stock status. Enter your address at checkout to review delivery availability.' },
    { question: `How do I check delivery availability in ${city}?`, answer: 'Enter your complete address during checkout. The order flow checks product availability and shows the final server-calculated total.' },
    { question: 'Can I pay by Cash on Delivery?', answer: 'Yes. The current checkout method is Cash on Delivery, with the order total payable on delivery.' },
    { question: 'Can I save my delivery address?', answer: 'Sign in and select the option to save the address to your customer profile during checkout.' },
    { question: `Can I order artificial plants for my business in ${city}?`, answer: 'Use the contact form to describe your space, approximate measurements and the products you are considering.' },
    { question: 'Do artificial plants need regular watering?', answer: 'No. Artificial plants do not need watering or sunlight. Follow the product listing for specific care or use details.' },
    { question: 'How can I track an order to my address?', answer: 'Sign in, open Your orders and select an order to view its status and delivery timeline.' },
  ];
}

export function journalFaqs(articleTitle?: string): Faq[] {
  const title = articleTitle ? `“${articleTitle}”` : 'the FYNE Journal';
  return [
    { question: `What is ${title} about?`, answer: 'The FYNE Journal shares ideas and practical information about artificial plants, green walls and interior greenery.' },
    { question: 'Are the products discussed in the journal real plants?', answer: 'FYNE SURFACES focuses on artificial decorative plants and related greenery products.' },
    { question: 'Where can I find the products mentioned in an article?', answer: 'Browse the collections or use the product search to find currently listed products.' },
    { question: 'How can I check a product’s dimensions?', answer: 'Open its product page and review the specifications provided in the catalogue.' },
    { question: 'How do I check price and stock?', answer: 'Current prices and availability are shown on product pages and are checked again at checkout.' },
    { question: 'Can I use artificial plants in an office?', answer: 'Review each listing’s description and specifications to decide whether it suits your space.' },
    { question: 'Do artificial plants need water or sunlight?', answer: 'Artificial plants do not need watering or sunlight.' },
    { question: 'Can I order items mentioned in a guide?', answer: 'If a product is in stock, add it to your cart and complete checkout with Cash on Delivery.' },
    { question: 'How are delivery charges calculated?', answer: 'The server calculates shipping and shows the amount in the checkout summary before you place an order.' },
    { question: 'Can FYNE help with larger green wall projects?', answer: 'Contact the team with your project details to discuss the products and quantities listed in the catalogue.' },
    { question: 'How do I track an order?', answer: 'Sign in and visit Your orders to view the order status and delivery timeline.' },
    { question: 'How do I contact FYNE SURFACES?', answer: 'Use the contact page form or the contact details published on the website.' },
  ];
}

export function searchFaqs(query: string): Faq[] {
  const subject = query ? ` for “${query}”` : '';
  return [
    { question: `How does catalogue search${subject} work?`, answer: 'Search checks product names, SKUs, descriptions, product types and collection names in the current catalogue.' },
    { question: 'Can I search by SKU?', answer: 'Yes. Enter the product SKU in the search box to find a matching listing.' },
    { question: 'Can I search for a collection name?', answer: 'Yes. Matching collections appear above matching products. Select a collection to browse its products.' },
    { question: 'Why might search return no results?', answer: 'The phrase may not match a current product, type or collection. Try a shorter term or browse collections.' },
    { question: 'Are search results in stock?', answer: 'Availability is shown on each product card and checked again at checkout.' },
    { question: 'Where can I see product prices?', answer: 'The product cards and product detail pages show the current listed price.' },
    { question: 'How can I compare product sizes?', answer: 'Open the product page and review its dimensions and specifications.' },
    { question: 'Can I filter search results?', answer: 'Use the collection pages for price, collection and other available product filters.' },
    { question: 'Are these products artificial?', answer: 'FYNE SURFACES lists artificial plants and decorative greenery products.' },
    { question: 'How do I place an order?', answer: 'Open an in-stock product, add it to your cart and continue to checkout.' },
    { question: 'Which payment method is available?', answer: 'The current checkout method is Cash on Delivery.' },
    { question: 'Where can I get product advice?', answer: 'Contact the FYNE SURFACES team with the product name or SKU and your project details.' },
  ];
}

export function policyFaqs(topic: 'privacy' | 'terms'): Faq[] {
  if (topic === 'privacy') return [
    { question: 'What personal information does FYNE collect?', answer: 'Information may include your account details, contact information, delivery address, order details and messages you submit.' },
    { question: 'Why is my information used?', answer: 'It is used to manage accounts, process orders, arrange fulfilment, answer enquiries and secure the website.' },
    { question: 'Does FYNE store my account password in my profile?', answer: 'Passwords are handled by the account system and are not included in the customer profile response.' },
    { question: 'Is payment card information collected at checkout?', answer: 'The current checkout uses Cash on Delivery and does not collect online card payments.' },
    { question: 'Does FYNE sell customer contact details?', answer: 'The published policy states customer contact details are not sold.' },
    { question: 'Who may receive my information?', answer: 'Service providers may receive information when needed to operate the store, send email or fulfil orders.' },
    { question: 'How long is my information kept?', answer: 'Information is kept as long as needed to provide the service, maintain records and resolve issues.' },
    { question: 'How can I update my profile?', answer: 'Sign in and use the account page to update the profile information available there.' },
    { question: 'Can I ask for my information to be corrected?', answer: 'Contact FYNE SURFACES through the contact page to request a correction or ask a privacy question.' },
    { question: 'Can I opt out of marketing?', answer: 'Optional marketing is separate from essential order and account service messages.' },
    { question: 'How does FYNE protect information?', answer: 'The site uses access controls and security measures intended to protect account, order and enquiry information.' },
    { question: 'How will policy changes be shared?', answer: 'The current privacy policy will be published on this page.' },
  ];
  return [
    { question: 'What are these terms for?', answer: 'They explain the conditions for using the FYNE SURFACES website and placing store orders.' },
    { question: 'What payment method does checkout accept?', answer: 'The current storefront checkout accepts Cash on Delivery.' },
    { question: 'When is an order confirmed?', answer: 'Orders are subject to product availability and fulfilment confirmation.' },
    { question: 'Can prices and availability change?', answer: 'Product prices, details and stock may change; the store checks price and stock when the order is placed.' },
    { question: 'Where can I see delivery charges?', answer: 'The checkout summary shows the server-calculated shipping charge before the order is placed.' },
    { question: 'How can I change or cancel an order?', answer: 'Contact FYNE SURFACES promptly with the order number to ask whether a change or cancellation is possible.' },
    { question: 'Where can I read the return instructions?', answer: 'The Return Policy page explains how to contact the team before sending an item back.' },
    { question: 'How do I track my order?', answer: 'Sign in and open Your orders to follow the status timeline.' },
    { question: 'What should I do if product photos look different on my screen?', answer: 'Display settings can affect colour appearance. Review the written description and specifications too.' },
    { question: 'May I copy product images or website text?', answer: 'Do not reuse site content commercially without permission from its owner.' },
    { question: 'What if I need help with a product?', answer: 'Contact the team with the product name or SKU and your question.' },
    { question: 'Where are changes to these terms published?', answer: 'The current terms will be published on this page.' },
  ];
}

export function productFaqs(product: ProductSummary): Faq[] {
  const name = product.name || `SKU ${product.sku}`;
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
      { question: 'Which payment method is available for orders?', answer: 'The current checkout method is Cash on Delivery. The checkout summary shows the final order total before placement.' },
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
