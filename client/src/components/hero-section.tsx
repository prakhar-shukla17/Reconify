import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="bg-gray-50 py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            IT Asset Management <span className="text-blue-600">Made Simple</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Comprehensive hardware tracking, user management, and asset monitoring for modern IT organizations. Keep
            track of every device, every user, every detail.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8">
              Start Managing Assets
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              Sign in to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
