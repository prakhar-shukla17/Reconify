"use client";

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
      <p>This is a minimal version to test imports.</p>
    </div>
  );
};

export default SuperAdminDashboard;
