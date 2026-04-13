import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const WhatsAppButton = () => (
  <motion.a
    href="https://wa.me/256706643297?text=Hi%20Dubai%20Shopping%20Centre%2C%20I%20need%20help%20with%20an%20order"
    target="_blank"
    rel="noopener noreferrer"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_24px_-4px_rgba(37,211,102,0.5)] transition hover:shadow-[0_8px_32px_-4px_rgba(37,211,102,0.6)]"
    aria-label="Chat on WhatsApp"
  >
    <MessageCircle className="h-6 w-6" />
  </motion.a>
);

export default WhatsAppButton;
