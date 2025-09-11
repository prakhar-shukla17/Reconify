// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Monitor, Users, Shield, Package, Activity, Lock } from "lucide-react"

// const features = [
//   {
//     icon: Monitor,
//     title: "Hardware Tracking",
//     description:
//       "Automatically discover and track all hardware components including CPU, memory, storage, and network interfaces across your organization.",
//     color: "text-blue-600",
//     bgColor: "bg-blue-50",
//   },
//   {
//     icon: Users,
//     title: "User Management",
//     description:
//       "Manage user accounts, assign assets, and control access with role-based permissions for users and administrators.",
//     color: "text-green-600",
//     bgColor: "bg-green-50",
//   },
//   {
//     icon: Shield,
//     title: "Admin Controls",
//     description:
//       "Comprehensive admin dashboard to manage all assets, assign devices to users, and monitor system-wide statistics and performance.",
//     color: "text-purple-600",
//     bgColor: "bg-purple-50",
//   },
//   {
//     icon: Package,
//     title: "Asset Assignment",
//     description:
//       "Easily assign and track which devices belong to which users, with detailed hardware specifications and usage monitoring.",
//     color: "text-red-600",
//     bgColor: "bg-red-50",
//   },
//   {
//     icon: Activity,
//     title: "Real-time Monitoring",
//     description:
//       "Monitor system health, performance metrics, and hardware status in real-time with automated scanning and reporting.",
//     color: "text-yellow-600",
//     bgColor: "bg-yellow-50",
//   },
//   {
//     icon: Lock,
//     title: "Secure Access",
//     description:
//       "Role-based authentication ensures users only see their assigned assets while administrators have full system visibility and control.",
//     color: "text-blue-600",
//     bgColor: "bg-blue-50",
//   },
// ]

// export function FeaturesSection() {
//   return (
//     <section className="py-16 bg-white">
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//           {features.map((feature, index) => (
//             <Card key={index} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
//               <CardHeader className="text-center pb-4">
//                 <div
//                   className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor} mx-auto mb-4`}
//                 >
//                   <feature.icon className={`h-6 w-6 ${feature.color}`} />
//                 </div>
//                 <CardTitle className="text-lg font-semibold text-gray-900">{feature.title}</CardTitle>
//               </CardHeader>
//               <CardContent className="pt-0">
//                 <CardDescription className="text-gray-600 text-sm leading-relaxed text-center">
//                   {feature.description}
//                 </CardDescription>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }
