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
  fingerprint: string;
  sessionId: string;
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
  const [fingerprint, setFingerprint] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate session ID (persists for browser session)
  const generateSessionId = (): string => {
    let sessionId = sessionStorage.getItem("form_session_id");
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem("form_session_id", sessionId);
    }
    return sessionId;
  };

  // Generate comprehensive browser fingerprint
  const generateBrowserFingerprint = (): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let canvasHash = "";
    
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillText("Browser fingerprint", 2, 2);
      canvasHash = canvas.toDataURL().substring(0, 50);
    }

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(",") || "",
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || 0,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      canvas: canvasHash,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || "unspecified",
      plugins: Array.from(navigator.plugins || []).map(p => p.name).join(","),
    };

    const fingerprintString = JSON.stringify(fingerprint);
    return btoa(fingerprintString).substring(0, 40);
  };

  // Initialize all tracking mechanisms
  useEffect(() => {
    const init = async () => {
      // Generate fingerprint immediately
      const fp = generateBrowserFingerprint();
      setFingerprint(fp);

      // Generate/retrieve session ID
      const sid = generateSessionId();
      setSessionId(sid);

      // Try to fetch IP
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setUserIp(data.ip);
      } catch (error) {
        console.error("Error fetching IP:", error);
        // Use fingerprint as fallback
        setUserIp(fp);
      }

      setIsInitialized(true);
    };

    init();
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

  // Get submission history from localStorage with integrity check
  const getSubmissionHistory = (): SubmissionRecord[] => {
    try {
      const history = localStorage.getItem("formSubmissions");
      const checksum = localStorage.getItem("formSubmissions_checksum");
      
      if (!history) return [];

      const parsed = JSON.parse(history);
      
      // Verify checksum to detect tampering
      const calculatedChecksum = btoa(history).substring(0, 20);
      if (checksum && checksum !== calculatedChecksum) {
        // Data was tampered with, reset everything
        console.warn("Submission history tampered with, resetting...");
        localStorage.removeItem("formSubmissions");
        localStorage.removeItem("formSubmissions_checksum");
        return [];
      }

      return parsed;
    } catch (error) {
      console.error("Error reading submission history:", error);
      return [];
    }
  };

  // Save submission with checksum
  const saveSubmission = (ip: string, fp: string, sid: string) => {
    try {
      const history = getSubmissionHistory();
      const newSubmission: SubmissionRecord = {
        timestamp: Date.now(),
        ip: ip,
        fingerprint: fp,
        sessionId: sid,
      };
      history.push(newSubmission);
      
      const historyString = JSON.stringify(history);
      localStorage.setItem("formSubmissions", historyString);
      
      // Create checksum to prevent tampering
      const checksum = btoa(historyString).substring(0, 20);
      localStorage.setItem("formSubmissions_checksum", checksum);
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
    
    if (cleaned.length !== history.length) {
      const cleanedString = JSON.stringify(cleaned);
      localStorage.setItem("formSubmissions", cleanedString);
      const checksum = btoa(cleanedString).substring(0, 20);
      localStorage.setItem("formSubmissions_checksum", checksum);
    }
    
    return cleaned;
  };

  // Multi-layer check: IP, fingerprint, and session ID
  const canSubmit = (): { allowed: boolean; message: string; remainingTime?: number } => {
    if (!isInitialized) {
      return { allowed: false, message: "Initializing security checks..." };
    }

    if (!userIp || !fingerprint || !sessionId) {
      return { allowed: false, message: "Unable to verify your identity. Please refresh the page." };
    }

    const recentSubmissions = cleanOldSubmissions();
    
    // Check against IP, fingerprint, OR session ID (any match counts)
    const userSubmissions = recentSubmissions.filter(
      (record) => 
        record.ip === userIp || 
        record.fingerprint === fingerprint || 
        record.sessionId === sessionId
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
        // Cooldown period has passed, clear old submissions for this user
        const updatedHistory = recentSubmissions.filter(
          (record) => 
            record.ip !== userIp && 
            record.fingerprint !== fingerprint && 
            record.sessionId !== sessionId
        );
        const historyString = JSON.stringify(updatedHistory);
        localStorage.setItem("formSubmissions", historyString);
        const checksum = btoa(historyString).substring(0, 20);
        localStorage.setItem("formSubmissions_checksum", checksum);
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

    // Re-verify fingerprint at submission time to prevent manipulation
    const currentFingerprint = generateBrowserFingerprint();
    if (currentFingerprint !== fingerprint) {
      alert("Security verification failed. Please refresh the page.");
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

      // Save submission record with all tracking data
      saveSubmission(userIp, fingerprint, sessionId);

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
      } else if (updatedCheck.remainingTime) {
        setCooldownRemaining(updatedCheck.remainingTime);
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
                {/* Initialization status */}
                {!isInitialized && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      🔒 Initializing security checks...
                    </p>
                  </div>
                )}

                {/* Rate limit warning */}
                {cooldownRemaining > 0 && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                      ⏱️ Submission limit reached. Please wait {formatTimeRemaining(cooldownRemaining)} before trying again.
                    </p>
                  </div>
                )}

                {/* Submission status */}
                {submitStatus.allowed && !isSubmitting && isInitialized && (
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
                        disabled={!submitStatus.allowed || isSubmitting || !isInitialized}
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
                        disabled={!submitStatus.allowed || isSubmitting || !isInitialized}
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
                      disabled={!submitStatus.allowed || isSubmitting || !isInitialized}
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
                      disabled={!submitStatus.allowed || isSubmitting || !isInitialized}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!submitStatus.allowed || isSubmitting || !isInitialized}
                  >
                    {isSubmitting ? "Sending..." : !isInitialized ? "Initializing..." : "Send Message"}
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