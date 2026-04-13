import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    location: "Kabale Town",
    rating: 5,
    text: "Ordered a Samsung phone and got it delivered the same day. The price was better than what I found in Kampala. Highly recommend!",
  },
  {
    name: "David K.",
    location: "Rukungiri",
    rating: 5,
    text: "The transport calculator at checkout was super helpful. I knew exactly how much delivery would cost before placing my order.",
  },
  {
    name: "Grace N.",
    location: "Kabale",
    rating: 4,
    text: "Great selection of laptops and accessories. The warranty support gives me confidence to buy electronics locally instead of traveling.",
  },
];

const TestimonialsSection = () => (
  <section className="pt-6">
    <div className="container">
      <div className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Customer stories</p>
        <h2 className="mt-3 font-display text-4xl font-bold text-foreground md:text-5xl">
          What our shoppers say
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
          Real feedback from customers who shop with us regularly.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_22px_70px_-52px_rgba(15,23,42,0.45)]"
          >
            <Quote className="h-8 w-8 text-primary/30" />
            <p className="mt-4 text-sm leading-7 text-muted-foreground">"{t.text}"</p>
            <div className="mt-5 flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`h-4 w-4 ${idx < t.rating ? "fill-primary text-primary" : "text-border"}`}
                />
              ))}
            </div>
            <div className="mt-3">
              <p className="text-sm font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.location}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
