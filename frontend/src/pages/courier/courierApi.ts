/**
 * Courier API Client
 */

import { CourierDashboardData, Language } from './types';
import { getCsrfToken } from '../../api/client';

export async function fetchCourierDashboard(
  lang: Language = 'uz',
  courierId?: number | null
): Promise<CourierDashboardData> {
  const params = new URLSearchParams({
    format: 'json',
    lang: lang,
  });
  if (courierId) {
    params.append('courier_id', courierId.toString());
  }

  const response = await fetch(`/dashboard/courier/?${params.toString()}`, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch courier dashboard: ${response.status}`);
  }

  return response.json();
}

export async function updateCourierLocation(
  lat: number,
  lng: number,
  courierId?: number | null
): Promise<any> {
  const csrf = getCsrfToken() || '';
  const body: Record<string, any> = { lat, lng };
  if (courierId) body.courier_id = courierId;

  const response = await fetch('/dashboard/api/courier-location/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrf,
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to update courier location: ${response.status}`);
  }

  return response.json();
}

export async function takeOrder(
  orderId: number,
  courierId?: number | null
): Promise<any> {
  const csrf = getCsrfToken() || '';
  const formData = new FormData();
  formData.append('order_id', orderId.toString());
  formData.append('action', 'take');
  if (courierId) {
    formData.append('courier_id', courierId.toString());
  }

  const response = await fetch('/dashboard/api/courier-update-order/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrf,
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to take order: ${response.status}`);
  }

  return response.json();
}

export async function completeOrder(
  orderId: number,
  courierId?: number | null
): Promise<any> {
  const csrf = getCsrfToken() || '';
  const formData = new FormData();
  formData.append('order_id', orderId.toString());
  formData.append('status', 'COMPLETED');
  if (courierId) {
    formData.append('courier_id', courierId.toString());
  }

  const response = await fetch('/dashboard/api/courier-update-order/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrf,
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to complete order: ${response.status}`);
  }

  return response.json();
}

export async function toggleCourierShift(
  courierId?: number | null
): Promise<{ success: boolean; is_active: boolean }> {
  const csrf = getCsrfToken() || '';
  const formData = new FormData();
  formData.append('action', 'toggle_shift');
  if (courierId) {
    formData.append('courier_id', courierId.toString());
  }

  const response = await fetch('/dashboard/api/courier-update-order/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrf,
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle shift: ${response.status}`);
  }

  return response.json();
}

export async function createDemoOrder(
  lat?: number | null,
  lng?: number | null,
  courierId?: number | null
): Promise<any> {
  const csrf = getCsrfToken() || '';
  const formData = new FormData();
  formData.append('action', 'create_demo_order');
  if (lat && lng) {
    formData.append('lat', lat.toString());
    formData.append('lng', lng.toString());
  }
  if (courierId) {
    formData.append('courier_id', courierId.toString());
  }

  const response = await fetch('/dashboard/api/courier-update-order/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrf,
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to create demo order: ${response.status}`);
  }

  return response.json();
}

export async function fetchFallbackRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): Promise<{ coordinates: [number, number][]; distance: number; duration: number }> {
  const params = new URLSearchParams({
    start_lat: startLat.toString(),
    start_lng: startLng.toString(),
    dest_lat: destLat.toString(),
    dest_lng: destLng.toString(),
  });

  const response = await fetch(`/dashboard/api/courier-route/?${params.toString()}`, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error('Fallback route failed');
  }

  const data = await response.json();
  return {
    coordinates: data.coordinates || [],
    distance: data.distance || 0,
    duration: data.duration || 0,
  };
}
