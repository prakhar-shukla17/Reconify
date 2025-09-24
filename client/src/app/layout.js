import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Reconify - IT Asset Management",
  description: "Comprehensive IT Asset Management and Reconnaissance System",
  icons: {
    icon: [
      { url: '/itam-logo.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                theme: {
                  primary: "#4aed88",
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
