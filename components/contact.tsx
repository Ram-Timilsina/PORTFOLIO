"use client";

import type React from "react";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import emailjs from "@emailjs/browser";

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxSubmissions: 3, // Maximum submissions allowed
  timeWindow: 3600000, // Time window in milliseconds (1 hour)
  cooldownPeriod: 300000, // Cooldown period after limit reached (5 minutes)
};

interface SubmissionRecord {
  timestamp: number;
  ip: string;
}

export default function Contact() {
  const form = useRef<HTMLFormElement>(null);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userIp, setUserIp] = useState<string>("");
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Fetch user's IP address on component mount
  useEffect(() => {
    fetchUserIP();
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1000) {
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  const fetchUserIP = async () => {
    try {
      // Using ipify API to get user's IP
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      setUserIp(data.ip);
    } catch (error) {
      console.error("Error fetching IP:", error);
      // Fallback: use a browser fingerprint or session ID
      setUserIp(generateBrowserFingerprint());
    }
  };

  // Generate a browser fingerprint as fallback
  const generateBrowserFingerprint = (): string => {
    const fingerprint = `${navigator.userAgent}-${navigator.language}-${screen.colorDepth}-${screen.width}x${screen.height}`;
    return btoa(fingerprint).substring(0, 20);
  };

  // Get submission history from localStorage
  const getSubmissionHistory = (): SubmissionRecord[] => {
    try {
      const history = localStorage.getItem("formSubmissions");
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error("Error reading submission history:", error);
      return [];
    }
  };

  // Save submission to localStorage
  const saveSubmission = (ip: string) => {
    try {
      const history = getSubmissionHistory();
      const newSubmission: SubmissionRecord = {
        timestamp: Date.now(),
        ip: ip,
      };
      history.push(newSubmission);
      localStorage.setItem("formSubmissions", JSON.stringify(history));
    } catch (error) {
      console.error("Error saving submission:", error);
    }
  };

  // Clean old submissions outside the time window
  const cleanOldSubmissions = (): SubmissionRecord[] => {
    const history = getSubmissionHistory();
    const now = Date.now();
    const cleaned = history.filter(
      (record) => now - record.timestamp < RATE_LIMIT_CONFIG.timeWindow
    );
    
    // Update localStorage with cleaned data
    localStorage.setItem("formSubmissions", JSON.stringify(cleaned));
    return cleaned;
  };

  // Check if user can submit
  const canSubmit = (): { allowed: boolean; message: string; remainingTime?: number } => {
    if (!userIp) {
      return { allowed: false, message: "Unable to verify your connection. Please refresh the page." };
    }

    const recentSubmissions = cleanOldSubmissions();
    const userSubmissions = recentSubmissions.filter(
      (record) => record.ip === userIp
    );

    // Check if user is in cooldown period
    if (userSubmissions.length >= RATE_LIMIT_CONFIG.maxSubmissions) {
      const lastSubmission = userSubmissions[userSubmissions.length - 1];
      const timeSinceLastSubmission = Date.now() - lastSubmission.timestamp;
      
      if (timeSinceLastSubmission < RATE_LIMIT_CONFIG.cooldownPeriod) {
        const remainingTime = RATE_LIMIT_CONFIG.cooldownPeriod - timeSinceLastSubmission;
        return {
          allowed: false,
          message: `You've reached the submission limit. Please try again later.`,
          remainingTime: remainingTime,
        };
      } else {
        // Cooldown period has passed, clear old submissions for this IP
        const updatedHistory = recentSubmissions.filter(
          (record) => record.ip !== userIp
        );
        localStorage.setItem("formSubmissions", JSON.stringify(updatedHistory));
        return { allowed: true, message: "You can submit now." };
      }
    }

    const remainingSubmissions = RATE_LIMIT_CONFIG.maxSubmissions - userSubmissions.length;
    return {
      allowed: true,
      message: `${remainingSubmissions} submission${remainingSubmissions !== 1 ? 's' : ''} remaining in this hour.`,
    };
  };

  // Format time remaining
  const formatTimeRemaining = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.current) {
      alert("Form reference is not available");
      return;
    }

    // Check rate limit
    const submitCheck = canSubmit();
    if (!submitCheck.allowed) {
      if (submitCheck.remainingTime) {
        setCooldownRemaining(submitCheck.remainingTime);
      }
      alert(submitCheck.message);
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email via EmailJS
      await emailjs.sendForm(
        "service_jo9fhd7",
        "template_iaqrwa9",
        form.current,
        {
          publicKey: "Gr31mCB9z1bwMjK3M",
        }
      );

      // Save submission record
      saveSubmission(userIp);

      alert("Message sent successfully!");
      
      // Reset form
      setFormState({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      // Show remaining submissions
      const updatedCheck = canSubmit();
      if (updatedCheck.allowed) {
        console.log(updatedCheck.message);
      }

    } catch (error) {
      console.log("EmailJS Error:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitStatus = canSubmit();

  return (
    <section id="contact" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Get In Touch
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Have a project in mind or want to discuss a potential collaboration?
            I'd love to hear from you.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-foreground">
                    <a
                      href="mailto:ramtimilsina16@gmail.com"
                      className="hover:text-primary transition-colors"
                    >
                      ramtimilsina16@gmail.com
                    </a>
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Phone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-foreground">
                    <a
                      href="tel:+9779869203810"
                      className="hover:text-primary transition-colors"
                    >
                      +977 9869203810
                    </a>
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-foreground">
                    Kamalbinayak, Bhaktapur
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5 pb-6">
                <CardTitle>Send Me a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and I'll get back to you as soon as
                  possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Rate limit warning */}
                {cooldownRemaining > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⏱️ Please wait {formatTimeRemaining(cooldownRemaining)} before submitting again.
                    </p>
                  </div>
                )}

                {/* Submission status */}
                {submitStatus.allowed && !isSubmitting && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      ℹ️ {submitStatus.message}
                    </p>
                  </div>
                )}

                <form ref={form} onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Your name"
                        value={formState.name}
                        onChange={handleChange}
                        required
                        disabled={!submitStatus.allowed || isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Your email"
                        value={formState.email}
                        onChange={handleChange}
                        required
                        disabled={!submitStatus.allowed || isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Subject of your message"
                      value={formState.subject}
                      onChange={handleChange}
                      required
                      disabled={!submitStatus.allowed || isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Your message"
                      rows={5}
                      value={formState.message}
                      onChange={handleChange}
                      required
                      disabled={!submitStatus.allowed || isSubmitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!submitStatus.allowed || isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}