'use client';

import React from 'react';
import MyRequestsPage from '@/app/requests/page';

/**
 * Legacy route alias: /bookings redirects seamlessly to the updated My Requests tracking portal.
 */
export default function BookingsPage() {
  return <MyRequestsPage />;
}
