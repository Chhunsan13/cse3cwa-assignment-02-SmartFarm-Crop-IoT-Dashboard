async function request(path, options = {}) {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
  
    return data;
  }
  
  export function getCrops() {
    return request("/api/crops");
  }
  
  export function createCrop(body) {
    return request("/api/crops", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
  
  export function updateCrop(id, body) {
    return request(`/api/crops/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
  
  export function deleteCrop(id) {
    return request(`/api/crops/${id}`, { method: "DELETE" });
  }
  
  export function getReadings() {
    return request("/api/readings");
  }