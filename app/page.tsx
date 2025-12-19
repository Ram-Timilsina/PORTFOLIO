"use client";
import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Projects from "@/components/projects";
import Skills from "@/components/skills";
import Testimonials from "@/components/testimonials";
import Contact from "@/components/contact";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import Snowfall from "react-snowfall";
import { SnowflakeIcon } from "lucide-react";
export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <Snowfall color="white" snowflakeCount={200} />
        <Navbar />
        <main>
          <Hero />
          <Projects />
          <Skills />
          <Testimonials />
          <Contact />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
