"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/src/frontend/components/ui/button"
import { Input } from "@/src/frontend/components/ui/input" 
import { Textarea } from "@/src/frontend/components/ui/textarea"
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react"




export default function ContactSection() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the form data to your backend
    console.log("Form submitted:", formData)
    setIsSubmitted(true)

    // Reset form after submission
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
    })

    // Reset submission status after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false)
    }, 5000)
  }

  const iconMap = {
    email: Mail,
    phone: Phone,
    address: MapPin,
  }

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="inline-block mb-6">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm">
                <span className="text-primary font-medium">Let’s Connect</span>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">Kickstart your next release with Prism</h2>

            <p className="text-muted-foreground mb-8 max-w-lg">
              Have questions or want a demo? We’re here to help.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Email</h3>
                  <p className="text-muted-foreground">hello@useprism.ai</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Phone</h3>
                  <p className="text-muted-foreground">+1 (555) 123‑4567</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Address</h3>
                  <p className="text-muted-foreground">88 Silicon Ave, Suite 12, San Francisco, CA | Mon–Fri, 9am–6pm PT</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-xl filter blur-xl opacity-50"></div>
            <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 md:p-8">
              <h3 className="text-xl font-bold mb-6">Drop Us a Line</h3>

              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <CheckCircle className="h-12 w-12 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Got it!</h4>
                  <p className="text-muted-foreground">Thanks for reaching out — we’ll reply soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Input
                        name="name"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="bg-card/50 border-border focus:border-primary"
                      />
                    </div>
                    <div>
                      <Input
                        name="email"
                        type="email"
                        placeholder="Your Best Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-card/50 border-border focus:border-primary"
                      />
                    </div>
                    <div>
                      <Input
                        name="phone"
                        placeholder="Your Phone (optional)"
                        value={formData.phone}
                        onChange={handleChange}
                        className="bg-card/50 border-border focus:border-primary"
                      />
                    </div>
                    <div>
                      <Textarea
                        name="message"
                        placeholder="Your Message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="bg-card/50 border-border focus:border-primary min-h-[120px]"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">
                    Send Message
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

