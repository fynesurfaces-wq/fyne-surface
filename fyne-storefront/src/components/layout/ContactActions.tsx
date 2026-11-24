'use client';

import { MessageCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

function internationalNumber(value?: string) {
  if (!value) return '';
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : '';
}

export function ContactActions({ phone, whatsapp }: { phone?: string; whatsapp?: string }) {
  const callNumber = internationalNumber(phone);
  const whatsappNumber = internationalNumber(whatsapp || phone);
  if (!callNumber && !whatsappNumber) return null;

  return (
    <nav aria-label="Contact FYNE SURFACES" className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-end px-4 sm:bottom-6 sm:px-6">
      <div className="flex max-w-full flex-col items-end gap-3">
        {whatsappNumber && (
          <motion.a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi, I would like to know more about your artificial plants.')}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with FYNE SURFACES on WhatsApp"
            title="WhatsApp"
            initial={{ opacity: 0, x: 20, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition-colors hover:bg-[#1DA851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </motion.a>
        )}
        {callNumber && (
          <motion.a
            href={`tel:+${callNumber}`}
            aria-label="Call FYNE SURFACES"
            title="Call"
            initial={{ opacity: 0, x: 20, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.35, delay: 0.16 }}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-lift transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </motion.a>
        )}
      </div>
    </nav>
  );
}
