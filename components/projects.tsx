"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

// Sample project data
const projects = [
  {
    id: 1,
    title: "Brand Identity Design",
    description:
      "Complete brand identity design for a tech startup, including logo, color palette, typography, and brand guidelines.",
    image: "/placeholder.svg?height=600&width=800",
    tags: ["Branding", "Design", "Identity"],
    link: "#",
  },
  {
    id: 2,
    title: "E-commerce Website",
    description:
      "Fully responsive e-commerce platform with custom product filtering, cart functionality, and seamless checkout experience.",
    image: "/placeholder.svg?height=600&width=800",
    tags: ["Web Development", "E-commerce", "UI/UX"],
    link: "#",
  },
  {
    id: 3,
    title: "Mobile App Design",
    description:
      "User-centered design for a health and fitness tracking mobile application with intuitive navigation and data visualization.",
    image: "/placeholder.svg?height=600&width=800",
    tags: ["Mobile", "UI/UX", "App Design"],
    link: "#",
  },
  {
    id: 4,
    title: "Marketing Campaign",
    description:
      "Comprehensive digital marketing campaign that increased client conversion rates by 45% through strategic content and design.",
    image: "/placeholder.svg?height=600&width=800",
    tags: ["Marketing", "Strategy", "Content"],
    link: "#",
  },
]

export default function Projects() {
  const [hoveredProject, setHoveredProject] = useState<number | null>(null)

  return (
    <section id="projects" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Featured Projects
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            A selection of my recent work showcasing my skills and expertise in creating impactful digital solutions.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              className="group relative rounded-xl overflow-hidden bg-background shadow-md hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  fill
                  className={`object-cover transition-transform duration-500 ${
                    hoveredProject === project.id ? "scale-110" : "scale-100"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                <p className="text-muted-foreground mb-4">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button variant="ghost" size="sm" className="group/btn" asChild>
                  <a href={project.link} target="_blank" rel="noopener noreferrer">
                    View Project
                    <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </a>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            View All Projects
          </Button>
        </div>
      </div>
    </section>
  )
}

