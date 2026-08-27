export function getAvailableCropNames(readings, crops) {
    const used = new Set(crops.map((c) => c.crop_name));
    const names = [];
  
    for (const reading of readings) {
      const name = reading.crop_name;
      if (!used.has(name) && !names.includes(name)) {
        names.push(name);
      }
    }
  
    return names;
  }
  export function getLatestReading(cropName, readings) {
    const matches = readings.filter((r) => r.crop_name === cropName);
  
    if (matches.length === 0) {
      return null;
    }
  
    return [...matches].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  }
  export function analyseCrop(cropCard, reading) {
    if (!reading) {
      return {
        crop: cropCard,
        latest_reading: null,
        condition: "N/A",
        recommended_water: "N/A",
        alerts: [],
        action: "N/A",
      };
    }
  
    const alerts = [];
  
    // Priority 1: Sensor Problem
    if (reading.sensor_status === "Offline" || reading.sensor_status === "Faulty") {
      return {
        crop: cropCard,
        latest_reading: reading,
        condition: "Sensor Problem",
        recommended_water: "N/A",
        alerts: ["Check sensor"],
        action: "Check sensor",
      };
    }
  
    // Priority 2: Invalid Data (Online + out of range)
    const invalidFields = [];
    if (reading.soil_moisture < 0 || reading.soil_moisture > 100) {
      invalidFields.push("soil_moisture");
    }
    if (reading.temperature < 0 || reading.temperature > 50) {
      invalidFields.push("temperature");
    }
    if (reading.rainfall < 0 || reading.rainfall > 50) {
      invalidFields.push("rainfall");
    }
  
    if (invalidFields.length > 0) {
      return {
        crop: cropCard,
        latest_reading: reading,
        condition: "Invalid Data",
        recommended_water: "N/A",
        alerts: [`Invalid field: ${invalidFields.join(", ")}`],
        action: "Check reading",
      };
    }
  
    // Extra alerts only for valid Online readings
    if (reading.temperature > 35) {
      alerts.push("High temperature");
    }
    if (reading.rainfall >= 5) {
      alerts.push("Rain detected");
    }
  
    // Priority 3–5: moisture vs targets
    if (reading.soil_moisture < cropCard.target_min) {
      return {
        crop: cropCard,
        latest_reading: reading,
        condition: "Dry",
        recommended_water: `${cropCard.normal_water} L`,
        alerts,
        action: "Water crop",
      };
    }
  
    if (reading.soil_moisture <= cropCard.target_max) {
      return {
        crop: cropCard,
        latest_reading: reading,
        condition: "Healthy",
        recommended_water: "0 L",
        alerts,
        action: "Monitor",
      };
    }
  
    return {
      crop: cropCard,
      latest_reading: reading,
      condition: "Too Wet",
      recommended_water: "0 L",
      alerts,
      action: "Stop watering",
    };
  }
  export function calculateFarmStatus(results, sensorAvailable) {
    if (!results || results.length === 0) {
      return "No Crops";
    }
  
    if (!sensorAvailable) {
      return "Sensor Feed Unavailable";
    }
  
    if (results.some((r) => r.condition === "Sensor Problem" || r.condition === "Invalid Data")) {
      return "Critical";
    }
  
    if (
      results.some(
        (r) =>
          r.condition === "Dry" ||
          r.condition === "Too Wet" ||
          (r.alerts && r.alerts.includes("High temperature"))
      )
    ) {
      return "Watch";
    }
  
    return "Normal";
  }