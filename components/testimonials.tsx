"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sample testimonials data
const testimonials = [
  {
    id: 1,
    name: "Arun Khatri",
    role: "React Developer",
    company: "Silicon-Soft",
    image: "/Images/arun.jpg",
    quote:
      "Ram is a highly skilled React Developer with a keen eye for detail and a passion for creating seamless user experiences. His expertise in modern web technologies and dedication to delivering high-quality code make him an invaluable asset to any development team.",
  },
  {
    id: 2,
    name: "Sarah Williams",
    role: "CEO",
    company: "Design Studio",
    image: "/placeholder.svg?height=200&width=200",
    quote:
      "An exceptional talent who brings both creativity and strategic thinking to every project. Their work has significantly improved our user engagement and conversion rates. Highly recommended!",
  },
  {
    id: 3,
    name: "Michael Chen",
    role: "Product Manager",
    company: "Innovate Inc",
    image: "/placeholder.svg?height=200&width=200",
    quote:
      "Reliable, professional, and incredibly skilled. They took our vague concept and transformed it into a polished product that our customers love. We'll definitely be working together again.",
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoplay]);

  const handlePrev = () => {
    setAutoplay(false);
    setActiveIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const handleNext = () => {
    setAutoplay(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Client Testimonials
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Hear what my clients have to say about their experience working with
            me.
          </motion.p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-background rounded-xl p-8 shadow-md">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 flex-shrink-0">
                        <Image
                          src={testimonial.image || "/placeholder.svg"}
                          alt={testimonial.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <Quote className="h-10 w-10 text-primary/20 mb-4" />
                        <p className="text-lg italic mb-6">
                          {testimonial.quote}
                        </p>
                        <div>
                          <h4 className="font-bold text-lg">
                            {testimonial.name}
                          </h4>
                          <p className="text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center mt-8 gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous testimonial</span>
            </Button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeIndex
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  }`}
                  onClick={() => {
                    setAutoplay(false);
                    setActiveIndex(index);
                  }}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next testimonial</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
