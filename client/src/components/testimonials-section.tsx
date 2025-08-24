import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Operations Manager",
    company: "TechCorp Industries",
    content:
      "AssetTrack has transformed how we manage our infrastructure. The real-time alerts have prevented multiple costly outages.",
    rating: 5,
    avatar: "/professional-woman-headshot.png",
  },
  {
    name: "Michael Rodriguez",
    role: "IT Director",
    company: "Global Manufacturing",
    content:
      "The predictive analytics feature is incredible. We've reduced maintenance costs by 40% since implementing AssetTrack.",
    rating: 5,
    avatar: "/professional-man-headshot.png",
  },
  {
    name: "Emily Johnson",
    role: "Facility Manager",
    company: "Healthcare Systems",
    content:
      "Easy to use, powerful features, and excellent support. AssetTrack has become essential to our daily operations.",
    rating: 5,
    avatar: "/professional-woman-headshot.png",
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-muted py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Trusted by industry leaders
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">See what our customers are saying about AssetTrack</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-background border-border">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>

                <blockquote className="text-card-foreground leading-relaxed mb-6">"{testimonial.content}"</blockquote>

                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-card-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
