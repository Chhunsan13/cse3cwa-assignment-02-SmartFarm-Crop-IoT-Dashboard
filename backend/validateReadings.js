const ALLOWED_CROPS = ["Tomato", "Lettuce", "Wheat", "Maize"];
const ALLOWED_STATUS = ["Online", "Offline", "Faulty"];
const TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

function isNumber(value) {
  return typeof value === "number" && !Number.isNaN(value);
}

function validateReadings(data) {
  if (!Array.isArray(data) || data.length !== 20) {
    throw new Error("invalid");
  }

  const cropCounts = { Tomato: 0, Lettuce: 0, Wheat: 0, Maize: 0 };
  const timestampsByCrop = { Tomato: new Set(), Lettuce: new Set(), Wheat: new Set(), Maize: new Set() };

  for (const reading of data) {
    const keys = Object.keys(reading);
    if (keys.length !== 7) {
      throw new Error("invalid");
    }

    const { crop_name, timestamp, soil_moisture, temperature, rainfall, sensor_status, notes } = reading;

    if (!ALLOWED_CROPS.includes(crop_name)) {
      throw new Error("invalid");
    }
    if (typeof timestamp !== "string" || !TIMESTAMP_REGEX.test(timestamp)) {
      throw new Error("invalid");
    }
    if (!isNumber(soil_moisture) || !isNumber(temperature) || !isNumber(rainfall)) {
      throw new Error("invalid");
    }
    if (!ALLOWED_STATUS.includes(sensor_status)) {
      throw new Error("invalid");
    }
    if (typeof notes !== "string") {
      throw new Error("invalid");
    }

    cropCounts[crop_name] += 1;

    if (timestampsByCrop[crop_name].has(timestamp)) {
      throw new Error("invalid");
    }
    timestampsByCrop[crop_name].add(timestamp);
  }

  for (const crop of ALLOWED_CROPS) {
    if (cropCounts[crop] !== 5) {
      throw new Error("invalid");
    }
  }

  return data;
}

module.exports = { validateReadings };