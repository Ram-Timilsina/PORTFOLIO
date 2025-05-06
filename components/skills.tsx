"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "@/components/ui/chart";
import AnimatedMarquee from "./AnimatedMarque";

// Sample skills data
const skills = [
  { name: "Design", value: 90 },
  { name: "Development", value: 85 },
  { name: "Strategy", value: 80 },
  { name: "UX Research", value: 75 },
  { name: "Animation", value: 70 },
  { name: "Marketing", value: 65 },
];

const technicalSkills = [
  { name: "Figma", level: 95 },
  { name: "Adobe Creative Suite", level: 90 },
  { name: "HTML/CSS", level: 85 },
  { name: "JavaScript", level: 80 },
  { name: "React", level: 75 },
  { name: "Node.js", level: 70 },
];

export default function Skills() {
  const progressRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = progressRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (index !== -1) {
              const target = entry.target as HTMLDivElement;
              const level = technicalSkills[index].level;
              target.style.width = `${level}%`;
              target.style.opacity = "1";
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    progressRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      progressRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <section id="skills" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            My Skills & Expertise
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            A comprehensive overview of my professional capabilities and
            technical proficiencies.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Radar Chart */}
          <motion.div
            className="bg-background rounded-xl p-6 shadow-md"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-bold mb-6 text-center">
              Core Competencies
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <Radar
                    name="Skills"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Progress Bars */}
          <motion.div
            className="bg-background rounded-xl p-6 shadow-md"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-bold mb-6 text-center">
              Technical Proficiencies
            </h3>
            <div className="space-y-6">
              {technicalSkills.map((skill, index) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-muted-foreground">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      ref={(el) => {
                        progressRefs.current[index] = el;
                      }}
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out opacity-0"
                      style={{ width: "0%" }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div>
          <AnimatedMarquee />
        </div>
      </div>
    </section>
  );
}
