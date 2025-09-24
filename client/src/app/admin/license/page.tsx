"use client"

import React from "react"
import Link from "next/link"

export default function AdminLicensePage() {
  const [license, setLicense] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Try the subscription endpoint first (adjust if your backend uses a different route)
        const res = await fetch("/api/subscription", { credentials: "include" })
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const json = await res.json()

        // Normalize common shapes
        const data = json.license ?? json.data ?? json ?? null
        const tenantId = data?.tenantId ?? data?.tenant_id ?? data?.tenant ?? json?.tenantId
        const startDate = data?.startDate ?? data?.start_date ?? data?.start
        const endDate = data?.endDate ?? data?.end_date ?? data?.end

        if (!mounted) return
        setLicense({ tenantId, startDate, endDate, raw: json })
      } catch (e) {
        if (!mounted) return
        setError("Unable to load license info. Check API or auth.")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  function fmt(d: any) {
    if (!d) return "—"
    const parsed = new Date(d)
    if (isNaN(parsed.getTime())) return String(d)
    return parsed.toLocaleDateString()
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">License</h1>
        <Link href="/admin">
          <a className="text-sm text-gray-600 hover:text-gray-900">Back to Admin</a>
        </Link>
      </header>

      <section className="mt-6 bg-white p-6 rounded-md shadow-sm">
        {loading && <div>Loading license information…</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && license && (
          <>
            <div className="mb-4">
              <div className="text-sm text-gray-500">License ID (Tenant ID)</div>
              <div className="mt-2 font-mono bg-gray-100 p-3 rounded">{license.tenantId ?? "Not available"}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Start Date</div>
                <div className="mt-2 font-medium">{fmt(license.startDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">End Date</div>
                <div className="mt-2 font-medium">{fmt(license.endDate)}</div>
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600">Raw response</summary>
              <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto">{JSON.stringify(license.raw, null, 2)}</pre>
            </details>
          </>
        )}
      </section>
    </div>
  )
}