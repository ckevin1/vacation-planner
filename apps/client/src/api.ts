export type Trip = any;
async function request(path: string, options?: RequestInit) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.validation?.fieldErrors
        ? Object.values(body.validation.fieldErrors).flat().join(", ")
        : (body.error ?? "Request failed"),
    );
  }
  return response.status === 204 ? null : response.json();
}
export const api = {
  trips: () => request("/api/trips"),
  trip: (id: string) => request(`/api/trips/${id}`),
  createTrip: (body: any) =>
    request("/api/trips", { method: "POST", body: JSON.stringify(body) }),
  updateTrip: (id: string, body: any) =>
    request(`/api/trips/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTrip: (id: string) => request(`/api/trips/${id}`, { method: "DELETE" }),
  addDestination: (id: string, body: any) =>
    request(`/api/trips/${id}/destinations`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateDestination: (id: string, body: any) =>
    request(`/api/destinations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteDestination: (id: string) =>
    request(`/api/destinations/${id}`, { method: "DELETE" }),
  addItem: (id: string, body: any) =>
    request(`/api/trips/${id}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateItem: (id: string, body: any) =>
    request(`/api/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteItem: (id: string) => request(`/api/items/${id}`, { method: "DELETE" }),
  addOptional: (id: string, body: any) =>
    request(`/api/trips/${id}/optional`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteOptional: (id: string) =>
    request(`/api/optional/${id}`, { method: "DELETE" }),
  addLoyalty: (id: string, body: any) =>
    request(`/api/trips/${id}/loyalty`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteLoyalty: (id: string) =>
    request(`/api/loyalty/${id}`, { method: "DELETE" }),
  addTraveler: (id: string, body: any) =>
    request(`/api/trips/${id}/travelers`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTraveler: (id: string, body: any) =>
    request(`/api/travelers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTraveler: (id: string) =>
    request(`/api/travelers/${id}`, { method: "DELETE" }),
};
