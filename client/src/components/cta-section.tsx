import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-16 bg-blue-600">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Join organizations already using our IT Asset Management system to streamline their operations.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 px-8 gap-2">
            Create Your Account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
