
import math

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


def simulate(speed, angle_degrees, gravity, steps=200):
    """Simule un projectile sans résistance de l'air."""

    angle = math.radians(angle_degrees)

    vx = speed * math.cos(angle)
    vy0 = speed * math.sin(angle)

    flight_time = 2 * vy0 / gravity
    max_height = (vy0 ** 2) / (2 * gravity)
    distance = vx * flight_time

    points = []

    for i in range(steps + 1):
        t = flight_time * i / steps

        x = vx * t
        y = vy0 * t - 0.5 * gravity * t ** 2
        vy = vy0 - gravity * t

        points.append({
            "time": round(t, 5),
            "x": round(x, 5),
            "y": round(max(0.0, y), 5),
            "vx": round(vx, 5),
            "vy": round(vy, 5)
        })

    return {
        "flight_time": round(flight_time, 4),
        "max_height": round(max_height, 4),
        "distance": round(distance, 4),
        "initial_velocity_x": round(vx, 4),
        "initial_velocity_y": round(vy0, 4),
        "points": points
    }


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "database": False
    })


@app.post("/api/simulate")
def run_simulation():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Les paramètres JSON sont requis."
        }), 400

    try:
        speed = float(data.get("speed", 25))
        angle = float(data.get("angle", 45))
        gravity = float(data.get("gravity", 9.81))

        values = [speed, angle, gravity]

        if not all(math.isfinite(value) for value in values):
            raise ValueError("Toutes les valeurs doivent être finies.")

        if not 0 < speed <= 1000:
            raise ValueError(
                "La vitesse doit être comprise entre 0 et 1000 m/s."
            )

        if not 1 <= angle <= 89:
            raise ValueError(
                "L'angle doit être compris entre 1 et 89 degrés."
            )

        if not 0.01 <= gravity <= 100:
            raise ValueError(
                "La gravité doit être comprise entre 0.01 et 100 m/s²."
            )

    except (TypeError, ValueError) as error:
        return jsonify({"error": str(error)}), 400

    result = simulate(speed, angle, gravity)

    return jsonify(result)


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=3000,
        debug=True
    )
