"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  X, 
  Check, 
  AlertCircle, 
  Loader2,
  Shield,
  Lock
} from "lucide-react";

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  subscription, 
  billingCycle,
  onSuccess 
}) {
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: ""
  });
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setPaymentMethod("stripe");
      setError(null);
      setCardDetails({ number: "", expiry: "", cvc: "", name: "" });
    }
  }, [isOpen]);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleCardInputChange = (field, value) => {
    let formattedValue = value;
    
    if (field === "number") {
      formattedValue = formatCardNumber(value);
    } else if (field === "expiry") {
      formattedValue = formatExpiry(value);
    } else if (field === "cvc") {
      formattedValue = value.replace(/\D/g, "").substring(0, 4);
    }

    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleStripePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      // Create payment intent
      const response = await fetch("/api/subscription/payment/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription_id: subscription.id,
          payment_method_id: "pm_card_visa" // This would be created with Stripe Elements
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Handle successful payment
        onSuccess(data);
        onClose();
      } else {
        setError(data.error || "Payment failed");
      }
    } catch (error) {
      console.error("Stripe payment error:", error);
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    setPaypalLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/subscription/payment/paypal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription_id: subscription.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to PayPal or open PayPal window
        window.open(data.payment.payment_url, "_blank");
        // In a real implementation, you'd handle the PayPal callback
        onSuccess(data);
        onClose();
      } else {
        setError(data.error || "PayPal payment failed");
      }
    } catch (error) {
      console.error("PayPal payment error:", error);
      setError("PayPal payment failed. Please try again.");
    } finally {
      setPaypalLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setRazorpayLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/subscription/payment/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription_id: subscription.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Initialize Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: subscription.amount,
          currency: subscription.currency,
          name: "ITAM",
          description: subscription.description,
          order_id: data.payment.razorpay_order_id,
          handler: function (response) {
            onSuccess({ ...data, razorpay_payment_id: response.razorpay_payment_id });
            onClose();
          },
          prefill: {
            name: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).fullName : "",
            email: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).email : ""
          },
          theme: {
            color: "#3B82F6"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setError(data.error || "Razorpay payment failed");
      }
    } catch (error) {
      console.error("Razorpay payment error:", error);
      setError("Razorpay payment failed. Please try again.");
    } finally {
      setRazorpayLoading(false);
    }
  };

  const formatPrice = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Subscription Summary */}
        <div className="p-6 border-b border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">{subscription.plan_name}</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                {formatPrice(subscription.amount, subscription.currency)}
              </span>
              <span className="text-gray-600">
                /{billingCycle === "yearly" ? "year" : "month"}
              </span>
            </div>
            {subscription.trial_days > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                {subscription.trial_days}-day free trial, then billed {billingCycle}
              </p>
            )}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">Choose Payment Method</h3>
          
          <div className="space-y-3 mb-6">
            {/* Stripe */}
            <button
              onClick={() => setPaymentMethod("stripe")}
              className={`w-full p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === "stripe"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
                  </div>
                </div>
                {paymentMethod === "stripe" && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>

            {/* PayPal */}
            <button
              onClick={() => setPaymentMethod("paypal")}
              className={`w-full p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === "paypal"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-600 rounded mr-3 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">PP</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">PayPal</div>
                    <div className="text-sm text-gray-500">Pay with your PayPal account</div>
                  </div>
                </div>
                {paymentMethod === "paypal" && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>

            {/* Razorpay */}
            <button
              onClick={() => setPaymentMethod("razorpay")}
              className={`w-full p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === "razorpay"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-600 rounded mr-3 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">R</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Razorpay</div>
                    <div className="text-sm text-gray-500">UPI, Cards, Net Banking</div>
                  </div>
                </div>
                {paymentMethod === "razorpay" && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>
          </div>

          {/* Stripe Card Form */}
          {paymentMethod === "stripe" && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardDetails.number}
                  onChange={(e) => handleCardInputChange("number", e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength="19"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardDetails.expiry}
                    onChange={(e) => handleCardInputChange("expiry", e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={cardDetails.cvc}
                    onChange={(e) => handleCardInputChange("cvc", e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength="4"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardDetails.name}
                  onChange={(e) => handleCardInputChange("name", e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-green-500 mr-2" />
              <div className="text-sm text-green-700">
                <div className="font-medium">Secure Payment</div>
                <div>Your payment information is encrypted and secure</div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={() => {
              if (paymentMethod === "stripe") handleStripePayment();
              else if (paymentMethod === "paypal") handlePayPalPayment();
              else if (paymentMethod === "razorpay") handleRazorpayPayment();
            }}
            disabled={loading || paypalLoading || razorpayLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading || paypalLoading || razorpayLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Complete Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


