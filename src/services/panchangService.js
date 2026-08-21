// A simplified service for computing panchang (Hindu calendar) details.
// Since full astrological calculations require significant ephemeris data,
// this uses approximate lunar phase calculations to find the Tithi.

const TITHIS = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya"
  ];
  
  const DAYS = [
    { name: "Sunday", deity: "Surya (Sun)", auspicious: false },
    { name: "Monday", deity: "Shiva", auspicious: true },
    { name: "Tuesday", deity: "Hanuman/Mangal", auspicious: false },
    { name: "Wednesday", deity: "Ganesha/Krishna", auspicious: true },
    { name: "Thursday", deity: "Vishnu/Brihaspati", auspicious: true },
    { name: "Friday", deity: "Devi/Shukra", auspicious: true },
    { name: "Saturday", deity: "Shani/Hanuman", auspicious: false }
  ];
  
  // Cache to avoid recalculating for the same day
  const panchangCache = new Map();
  
  // Known new moon timestamp to base lunar calculations off of (Jan 11, 2024, ~11:57 UTC)
  const KNOWN_NEW_MOON_MS = Date.UTC(2024, 0, 11, 11, 57, 0);
  const LUNAR_MONTH_DAYS = 29.53058868; // Synodic month
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  
  export const getPanchang = (date = new Date(), timezone = 'Asia/Kolkata') => {
    // Generate cache key based on the local date string for the given timezone
    const dateOptions = { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateString = date.toLocaleDateString('en-US', dateOptions);
    
    if (panchangCache.has(dateString)) {
      return panchangCache.get(dateString);
    }
  
    // Calculate approximate Moon age
    const diffMs = date.getTime() - KNOWN_NEW_MOON_MS;
    const diffDays = diffMs / MS_PER_DAY;
    const cycles = diffDays / LUNAR_MONTH_DAYS;
    let moonAge = (cycles % 1) * LUNAR_MONTH_DAYS;
    if (moonAge < 0) moonAge += LUNAR_MONTH_DAYS;
    
    // 30 tithis in a 29.53 day cycle -> each tithi is roughly ~0.984 days long
    const tithiIndex = Math.floor(moonAge * (30 / LUNAR_MONTH_DAYS));
    const tithiName = TITHIS[tithiIndex] || TITHIS[0];
    
    const paksha = tithiIndex < 15 ? "Shukla Paksha (Waxing)" : "Krishna Paksha (Waning)";
    
    const dayOfWeek = date.getDay();
    const dayInfo = DAYS[dayOfWeek];
  
    // Simplified sunrise/sunset for a generic central location in India (e.g., Ujjain/Nagpur)
    // In a real app, this would use lat/long formulas. We return approximate times.
    const month = date.getMonth();
    const isSummer = month > 3 && month < 9;
    const sunrise = isSummer ? "05:45 AM" : "06:45 AM";
    const sunset = isSummer ? "07:00 PM" : "05:45 PM";
    
    const rahuKaalMap = {
      0: "04:30 PM - 06:00 PM", // Sun
      1: "07:30 AM - 09:00 AM", // Mon
      2: "03:00 PM - 04:30 PM", // Tue
      3: "12:00 PM - 01:30 PM", // Wed
      4: "01:30 PM - 03:00 PM", // Thu
      5: "10:30 AM - 12:00 PM", // Fri
      6: "09:00 AM - 10:30 AM"  // Sat
    };
  
    const result = {
      date: dateString,
      day: dayInfo.name,
      tithi: tithiName,
      paksha: paksha,
      deity: dayInfo.deity,
      sunrise: sunrise,
      sunset: sunset,
      rahuKaal: rahuKaalMap[dayOfWeek],
      auspicious: dayInfo.auspicious,
      note: "Note: This is an approximate computed panchang. For exact muhurtas and rituals, please consult a detailed Drik Panchang."
    };
  
    panchangCache.set(dateString, result);
    
    // Keep cache from growing indefinitely (clean up older entries randomly for simplicity)
    if (panchangCache.size > 10) {
      const firstKey = panchangCache.keys().next().value;
      panchangCache.delete(firstKey);
    }
  
    return result;
  };
  
