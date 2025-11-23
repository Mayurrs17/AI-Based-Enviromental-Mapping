import os
import io
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file
import requests
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


app = Flask(__name__)


OSRM_BASE_URL = "https://router.project-osrm.org"
# Set your OpenWeather key here if you prefer hardcoding (optional).
# Example: HARDCODED_OPENWEATHER_API_KEY = "your_openweather_api_key_here"
HARDCODED_OPENWEATHER_API_KEY = "ba956bf304fcfcd4beb556a88a75d57a"

# Priority: hardcoded key (if provided) > environment variable > empty string
OPENWEATHER_API_KEY = HARDCODED_OPENWEATHER_API_KEY or os.environ.get("OPENWEATHER_API_KEY", "")


def format_duration(seconds: float) -> str:
    minutes = int(seconds // 60)
    hours = minutes // 60
    minutes = minutes % 60
    if hours:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def format_distance(meters: float) -> str:
    km = meters / 1000.0
    if km >= 1:
        return f"{km:.1f} km"
    return f"{meters:.0f} m"


@app.route("/")
def index():
    return render_template("index.html", has_weather_key=bool(OPENWEATHER_API_KEY))


@app.route("/static/manifest.json")
def manifest():
    return send_file("static/manifest.json", mimetype="application/json")


@app.route("/static/sw.js")
def service_worker():
    return send_file("static/sw.js", mimetype="application/javascript")


@app.route("/api/route")
def api_route():
    """Compute driving route via OSRM between start and end coordinates.
    Query params: start=lat,lon end=lat,lon
    Returns: geometry, distance, duration, checkpoints (sampled coords along route)
    """
    start = request.args.get("start")
    end = request.args.get("end")
    if not start or not end:
        return jsonify({"error": "Missing start or end coordinates."}), 400

    try:
        start_lat, start_lon = [float(x.strip()) for x in start.split(",")]
        end_lat, end_lon = [float(x.strip()) for x in end.split(",")]
    except Exception:
        return jsonify({"error": "Invalid coordinate format. Use 'lat,lon'."}), 400

    # OSRM expects lon,lat order
    coords = f"{start_lon},{start_lat};{end_lon},{end_lat}"
    url = f"{OSRM_BASE_URL}/route/v1/driving/{coords}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "true",
        "annotations": "true",
        "alternatives": "false",
    }
    try:
        r = requests.get(url, params=params, timeout=20)
        r.raise_for_status()
        data = r.json()
        if not data.get("routes"):
            return jsonify({"error": "No route found."}), 404

        route = data["routes"][0]
        geometry = route["geometry"]
        distance = route["distance"]
        duration = route["duration"]

        # Sample checkpoints along geometry coordinates (lat, lon from geojson is [lon, lat])
        coords_list = geometry.get("coordinates", [])
        if len(coords_list) <= 1:
            return jsonify({"error": "Insufficient route geometry."}), 500

        # sample ~ every 10th point, plus start/end, capped at ~60 points
        step = max(1, len(coords_list) // 50)
        sampled = [coords_list[0]] + coords_list[1:-1:step] + [coords_list[-1]]

        checkpoints = [
            {"lat": latlon[1], "lon": latlon[0], "index": idx}
            for idx, latlon in enumerate(sampled)
        ]

        return jsonify({
            "geometry": geometry,
            "distance": distance,
            "distanceText": format_distance(distance),
            "duration": duration,
            "durationText": format_duration(duration),
            "checkpoints": checkpoints,
        })
    except requests.RequestException as e:
        return jsonify({"error": f"Routing service error: {str(e)}"}), 502


@app.route("/api/weather", methods=["POST"])
def api_weather():
    """Fetch current weather for a list of checkpoint coordinates.
    Expects JSON: { checkpoints: [{lat, lon, index}, ...] }
    """
    if not OPENWEATHER_API_KEY:
        return jsonify({
            "error": "Missing OpenWeather API key.",
            "code": "NO_API_KEY",
        }), 400
    payload = request.get_json(silent=True) or {}
    checkpoints = payload.get("checkpoints", [])
    if not isinstance(checkpoints, list) or not checkpoints:
        return jsonify({"error": "No checkpoints provided."}), 400

    results = []
    alerts = []
    try:
        for cp in checkpoints:
            lat = cp.get("lat")
            lon = cp.get("lon")
            idx = cp.get("index", 0)
            if lat is None or lon is None:
                continue
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric",
            }
            r = requests.get(url, params=params, timeout=15)
            r.raise_for_status()
            w = r.json()
            condition = (w.get("weather") or [{}])[0].get("main", "Unknown")
            description = (w.get("weather") or [{}])[0].get("description", "")
            icon = (w.get("weather") or [{}])[0].get("icon", "")
            temp = (w.get("main") or {}).get("temp")
            humidity = (w.get("main") or {}).get("humidity")
            wind = (w.get("wind") or {}).get("speed")
            visibility = (w.get("visibility") or 10000) / 1000  # Convert to km
            uv_index = w.get("uvi", 0)  # UV Index
            sunrise = (w.get("sys") or {}).get("sunrise")
            sunset = (w.get("sys") or {}).get("sunset")
            city = w.get("name")

            # Fetch Air Quality (if available)
            aqi = None
            aqi_level = None
            try:
                aq_url = "http://api.openweathermap.org/data/2.5/air_pollution"
                aq_params = {
                    "lat": lat,
                    "lon": lon,
                    "appid": OPENWEATHER_API_KEY,
                }
                aq_r = requests.get(aq_url, params=aq_params, timeout=10)
                if aq_r.status_code == 200:
                    aq_data = aq_r.json()
                    aqi = aq_data.get("list", [{}])[0].get("main", {}).get("aqi", None)
                    if aqi:
                        aqi_levels = {1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor"}
                        aqi_level = aqi_levels.get(aqi, "Unknown")
            except:
                pass  # AQI not available, continue without it

            results.append({
                "index": idx,
                "lat": lat,
                "lon": lon,
                "temp": temp,
                "humidity": humidity,
                "wind": wind,
                "visibility": visibility,
                "uv_index": uv_index,
                "aqi": aqi,
                "aqi_level": aqi_level,
                "condition": condition,
                "description": description,
                "icon": icon,
                "sunrise": sunrise,
                "sunset": sunset,
                "city": city,
            })

            # Enhanced safety alert rules
            if condition and condition.lower() in {"thunderstorm", "tornado"}:
                alerts.append({"type": "danger", "message": "Severe storm detected on route."})
            elif condition and condition.lower() in {"rain", "drizzle"}:
                alerts.append({"type": "warning", "message": "Rain expected along the route."})
            if uv_index and uv_index >= 8:
                alerts.append({"type": "warning", "message": f"Very high UV index ({uv_index:.1f}) - protect yourself!"})
            if aqi and aqi >= 4:
                alerts.append({"type": "warning", "message": f"Poor air quality ({aqi_level}) detected."})
            if visibility and visibility < 1:
                alerts.append({"type": "warning", "message": "Low visibility conditions."})

        # deduplicate alerts by type/message
        unique = []
        seen = set()
        for a in alerts:
            key = (a["type"], a["message"])
            if key not in seen:
                seen.add(key)
                unique.append(a)

        return jsonify({"weather": results, "alerts": unique})
    except requests.RequestException as e:
        return jsonify({"error": f"Weather service error: {str(e)}"}), 502


@app.route("/api/environmental", methods=["POST"])
def api_environmental():
    """Calculate environmental metrics for a route.
    Expects JSON: { distance: meters, duration: seconds }
    Returns: carbon footprint, environmental score, etc.
    """
    payload = request.get_json(silent=True) or {}
    distance_km = payload.get("distance", 0) / 1000.0  # Convert to km
    duration_hours = payload.get("duration", 0) / 3600.0  # Convert to hours
    
    # Average car emissions: ~120g CO2 per km (varies by vehicle)
    # Using average for passenger car
    co2_per_km = 0.12  # kg CO2 per km
    co2_emissions = distance_km * co2_per_km
    
    # Fuel consumption estimate (average 7L/100km)
    fuel_liters = (distance_km / 100) * 7
    
    # Environmental score (0-100, higher is better)
    # Factors: distance (shorter = better), efficiency
    base_score = 100
    distance_penalty = min(distance_km * 0.5, 50)  # Max 50 point penalty
    env_score = max(0, base_score - distance_penalty)
    
    # Trees needed to offset (1 tree absorbs ~21kg CO2 per year)
    # For this trip, we calculate trees needed for annual offset
    trees_to_offset = max(1, int(co2_emissions / 21))
    
    return jsonify({
        "co2_emissions_kg": round(co2_emissions, 2),
        "fuel_consumption_liters": round(fuel_liters, 2),
        "environmental_score": round(env_score, 1),
        "trees_to_offset": trees_to_offset,
        "distance_km": round(distance_km, 2),
    })


@app.route("/api/route-alternatives", methods=["POST"])
def api_route_alternatives():
    """Get alternative routes for comparison.
    Expects JSON: { start: {lat, lon}, end: {lat, lon} }
    Returns: multiple route options with environmental data
    """
    payload = request.get_json(silent=True) or {}
    start = payload.get("start", {})
    end = payload.get("end", {})
    
    if not start.get("lat") or not start.get("lon") or not end.get("lat") or not end.get("lon"):
        return jsonify({"error": "Invalid coordinates."}), 400

    try:
        start_lat, start_lon = float(start["lat"]), float(start["lon"])
        end_lat, end_lon = float(end["lat"]), float(end["lon"])
    except:
        return jsonify({"error": "Invalid coordinate format."}), 400

    coords = f"{start_lon},{start_lat};{end_lon},{end_lat}"
    url = f"{OSRM_BASE_URL}/route/v1/driving/{coords}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "alternatives": "true",  # Get alternative routes
        "steps": "true",
        "annotations": "true",
    }
    
    try:
        r = requests.get(url, params=params, timeout=20)
        r.raise_for_status()
        data = r.json()
        
        if not data.get("routes"):
            return jsonify({"error": "No routes found."}), 404

        alternatives = []
        for idx, route in enumerate(data["routes"][:3]):  # Max 3 alternatives
            distance = route["distance"]
            duration = route["duration"]
            
            # Calculate environmental metrics
            distance_km = distance / 1000.0
            co2_per_km = 0.12
            co2_emissions = distance_km * co2_per_km
            fuel_liters = (distance_km / 100) * 7
            
            # Sample checkpoints
            geometry = route["geometry"]
            coords_list = geometry.get("coordinates", [])
            step = max(1, len(coords_list) // 20)
            sampled = [coords_list[0]] + coords_list[1:-1:step] + [coords_list[-1]]
            
            checkpoints = [
                {"lat": latlon[1], "lon": latlon[0], "index": i}
                for i, latlon in enumerate(sampled)
            ]
            
            alternatives.append({
                "index": idx,
                "distance": distance,
                "distanceText": format_distance(distance),
                "duration": duration,
                "durationText": format_duration(duration),
                "geometry": geometry,
                "checkpoints": checkpoints,
                "co2_emissions_kg": round(co2_emissions, 2),
                "fuel_liters": round(fuel_liters, 2),
            })
        
        return jsonify({"alternatives": alternatives})
    except requests.RequestException as e:
        return jsonify({"error": f"Routing service error: {str(e)}"}), 502


@app.route("/api/best-time", methods=["POST"])
def api_best_time():
    """Calculate best time to travel based on weather and air quality.
    Expects JSON: { checkpoints: [{lat, lon}], hours_ahead: 24 }
    """
    if not OPENWEATHER_API_KEY:
        return jsonify({"error": "Missing OpenWeather API key."}), 400
    
    payload = request.get_json(silent=True) or {}
    checkpoints = payload.get("checkpoints", [])
    hours_ahead = payload.get("hours_ahead", 24)
    
    if not checkpoints:
        return jsonify({"error": "No checkpoints provided."}), 400

    # Use first checkpoint for forecast
    cp = checkpoints[0]
    lat, lon = cp.get("lat"), cp.get("lon")
    
    try:
        # Get forecast
        url = "https://api.openweathermap.org/data/2.5/forecast"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric",
            "cnt": min(8, hours_ahead // 3),  # 3-hour intervals
        }
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        forecast_data = r.json()
        
        # Analyze forecast for best conditions
        best_times = []
        for item in forecast_data.get("list", []):
            dt = item.get("dt")
            temp = item.get("main", {}).get("temp", 0)
            condition = (item.get("weather") or [{}])[0].get("main", "").lower()
            wind = item.get("wind", {}).get("speed", 0)
            rain = item.get("rain", {}).get("3h", 0)
            
            # Score: higher is better
            score = 100
            if condition in {"rain", "drizzle", "thunderstorm"}:
                score -= 30
            if wind > 10:
                score -= 20
            if temp < 0 or temp > 35:
                score -= 15
            if rain > 0:
                score -= 25
            
            best_times.append({
                "dt": dt,
                "score": max(0, score),
                "temp": temp,
                "condition": condition,
                "wind": wind,
                "rain": rain,
            })
        
        # Sort by score
        best_times.sort(key=lambda x: x["score"], reverse=True)
        
        return jsonify({
            "best_times": best_times[:3],  # Top 3 best times
            "forecast": forecast_data.get("list", [])[:8]
        })
    except requests.RequestException as e:
        return jsonify({"error": f"Forecast service error: {str(e)}"}), 502


@app.route("/api/forecast", methods=["POST"])
def api_forecast():
    """Get 3-hour weather forecast for route checkpoints.
    Expects JSON: { checkpoints: [{lat, lon, index}, ...] }
    """
    if not OPENWEATHER_API_KEY:
        return jsonify({"error": "Missing OpenWeather API key."}), 400
    
    payload = request.get_json(silent=True) or {}
    checkpoints = payload.get("checkpoints", [])
    if not isinstance(checkpoints, list) or not checkpoints:
        return jsonify({"error": "No checkpoints provided."}), 400

    # Use first checkpoint for forecast (or average)
    if checkpoints:
        cp = checkpoints[0]
        lat = cp.get("lat")
        lon = cp.get("lon")
        
        try:
            url = "https://api.openweathermap.org/data/2.5/forecast"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric",
                "cnt": 8,  # 24 hours (8 * 3-hour intervals)
            }
            r = requests.get(url, params=params, timeout=15)
            r.raise_for_status()
            forecast_data = r.json()
            
            forecast_list = []
            for item in forecast_data.get("list", [])[:8]:
                forecast_list.append({
                    "dt": item.get("dt"),
                    "temp": item.get("main", {}).get("temp"),
                    "condition": (item.get("weather") or [{}])[0].get("main", ""),
                    "description": (item.get("weather") or [{}])[0].get("description", ""),
                    "icon": (item.get("weather") or [{}])[0].get("icon", ""),
                    "wind": item.get("wind", {}).get("speed", 0),
                    "humidity": item.get("main", {}).get("humidity", 0),
                    "precipitation": item.get("rain", {}).get("3h", 0) or item.get("snow", {}).get("3h", 0),
                })
            
            return jsonify({"forecast": forecast_list})
        except requests.RequestException as e:
            return jsonify({"error": f"Forecast service error: {str(e)}"}), 502
    
    return jsonify({"error": "Invalid checkpoints."}), 400


@app.route("/api/report", methods=["POST"])
def api_report():
    """Generate a simple PDF route report."""
    data = request.get_json(silent=True) or {}
    route_meta = data.get("route", {})
    checkpoints = data.get("checkpoints", [])
    weather = data.get("weather", [])

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    y = height - 50
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, y, "AI-Based Environmental Route Report")
    y -= 20
    c.setFont("Helvetica", 10)
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    c.drawString(40, y, f"Generated: {now_str}")
    y -= 20

    # Route summary
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Route Summary")
    y -= 16
    c.setFont("Helvetica", 10)
    c.drawString(40, y, f"Distance: {route_meta.get('distanceText', '-')}")
    y -= 14
    c.drawString(40, y, f"Travel Time: {route_meta.get('durationText', '-')}")
    y -= 20

    # Weather summary (first 10 points to keep it readable)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Weather Along Route (sample)")
    y -= 16
    c.setFont("Helvetica", 10)
    for w in sorted(weather, key=lambda x: x.get("index", 0))[:10]:
        line = (
            f"#{w.get('index', 0)}  Temp: {w.get('temp', '-') }°C, "
            f"Wind: {w.get('wind', '-') } m/s, Humidity: {w.get('humidity', '-') }%, "
            f"Cond: {w.get('condition', '-') }"
        )
        c.drawString(40, y, line)
        y -= 14
        if y < 60:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 10)

    c.showPage()
    c.save()
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name="route_report.pdf",
        mimetype="application/pdf",
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)


