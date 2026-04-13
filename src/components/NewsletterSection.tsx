import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, Send } from "lucide-react";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section className="pt-4 pb-2">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-secondary px-7 py-10 text-secondary-foreground shadow-[0_28px_90px_-48px_rgba(15,23,42,0.7)] md:px-12"
        >
          
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <Mail className="h-3.5 w-3.5" />
                Stay updated
              </div>
              <h2 className="mt-5 font-display text-4xl font-bold md:text-5xl">
                Get deals before everyone else.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-secondary-foreground/72">
                Subscribe to our updates and be the first to know about flash sales, new arrivals, and exclusive discounts for Kabale shoppers.
              </p>
            </div>

            <div>
              {submitted ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-6"
                >
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">You're on the list!</p>
                    <p className="mt-1 text-sm text-secondary-foreground/72">We'll send you the best deals directly.</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="h-14 w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-5 text-sm text-secondary-foreground placeholder:text-secondary-foreground/40 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                    Subscribe for exclusive deals
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
