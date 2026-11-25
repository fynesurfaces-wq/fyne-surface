'use strict';

const env = require('../config/env');
const { Setting } = require('../models');
const cities = require('../data/metroCities');
const { asyncHandler } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const dataFor = (location) => ({
  ...location,
  title: `Premium Artificial Plants in ${location.city}`,
  description: `Explore artificial plants, decorative greenery and vertical garden products for ${location.city}, ${location.state}. Compare product details and check delivery availability for your address at checkout.`,
  quickSummary: `FYNE SURFACES offers an online catalogue of artificial plants and vertical garden products for customers in ${location.city}. Product specifications, prices and delivery availability are shown on the relevant product and checkout pages.`,
  url: `${env.siteUrl}/locations/${location.slug}`,
});

exports.list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: cities.map(dataFor), total: cities.length });
});

exports.get = asyncHandler(async (req, res) => {
  const location = cities.find((item) => item.slug === req.params.city);
  if (!location) throw new ApiError(404, 'Location page not found');
  const settings = await Setting.getStore();
  const page = dataFor(location);
  const faqs = [
    { question: `Where can I find artificial plants in ${location.city}?`, answer: `Browse FYNE SURFACES online to compare artificial plants, trees and vertical garden products. Check the current delivery availability for your address during checkout.` },
    { question: `Can I check product sizes before ordering in ${location.city}?`, answer: 'Yes. Product pages show the specifications and images provided for each item. Contact the FYNE SURFACES team if you need help choosing products for a project.' },
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness', '@id': `${page.url}#business`, name: settings.storeName, url: page.url,
        description: page.description,
        areaServed: { '@type': 'City', name: location.city, containedInPlace: { '@type': 'AdministrativeArea', name: location.state } },
        email: settings.contact?.email, telephone: settings.contact?.phone, image: settings.logo?.url,
        ...(settings.contact?.address ? { address: { '@type': 'PostalAddress', streetAddress: settings.contact.address, addressLocality: 'Mumbai', addressRegion: 'Maharashtra', addressCountry: 'IN' } } : {}),
      },
      { '@type': 'FAQPage', mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) },
    ],
  };
  res.json({ success: true, data: { ...page, business: { name: settings.storeName, url: env.siteUrl, email: settings.contact?.email, telephone: settings.contact?.phone, address: settings.contact?.address, logo: settings.logo?.url }, faqs, jsonLd } });
});
