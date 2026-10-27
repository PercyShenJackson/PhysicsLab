
"use strict";

const form = document.querySelector("#simulation-form");
const speedInput = document.querySelector("#speed");
const angleInput = document.querySelector("#angle");
const gravityInput = document.querySelector("#gravity");

const speedValue = document.querySelector("#speed-value");
const angleValue = document.querySelector("#angle-value");
const gravityValue = document.querySelector("#gravity-value");

const distanceOutput = document.querySelector("#distance");
const heightOutput = document.querySelector("#height");
const timeOutput = document.querySelector("#time");

const canvas = document.querySelector("#trajectory");
const ctx = canvas.getContext("2d");

const tableBody = document.querySelector("#data-table");
const errorMessage = document.querySelector("#error-message");
const caption = document.querySelector("#chart-caption");

const resetButton = document.querySelector("#reset-button");
const exportButton = document.querySelector("#export-button");

let lastResult = null;
let requestNumber = 0;

const updateLabels = () =>{
    speedValue.textContent = `${speedInput.value} m/s`;
    angleValue.textContent = `${angleInput.value}°`;
    gravityValue.textContent = `${Number(gravityInput.value).toFixed(2)} m/s²`;
}

const formatNumber = (value, decimals = 2) =>{
    return Number(value).toLocaleString("fr-CA", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

const clearCanvas = (message = "Lance une simulation pour afficher la trajectoire.") =>{
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#91a0ba";
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

const  drawTrajectory =(points) =>{
    const width = canvas.width;
    const height = canvas.height;

    const padding = {
        left: 75,
        right: 30,
        top: 35,
        bottom: 65
    };

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const maxX = Math.max(...points.map(point => point.x), 1);
    const maxY = Math.max(...points.map(point => point.y), 1);

    // Arrondir les limites pour obtenir une grille lisible.
    const xLimit = maxX * 1.08;
    const yLimit = maxY * 1.18;

    const toX = x => padding.left + (x / xLimit) * plotWidth;
    const toY = y => height - padding.bottom - (y / yLimit) * plotHeight;

    ctx.clearRect(0, 0, width, height);

    // Grille.
    ctx.strokeStyle = "#223149";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#91a0ba";
    ctx.font = "12px system-ui";

    const divisions = 5;

    for (let i = 0; i <= divisions; i++) {
        const x = padding.left + plotWidth * i / divisions;
        const y = height - padding.bottom - plotHeight * i / divisions;

        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillText(
            formatNumber(xLimit * i / divisions, 1),
            x,
            height - padding.bottom + 22
        );

        ctx.textAlign = "right";
        ctx.fillText(
            formatNumber(yLimit * i / divisions, 1),
            padding.left - 12,
            y + 4
        );
    }

    // Axes.
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Labels des axes.
    ctx.fillStyle = "#c5d2e7";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Position horizontale (m)", width / 2, height - 15);

    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Hauteur (m)", 0, 0);
    ctx.restore();

    // Dégradé de la trajectoire.
    const gradient = ctx.createLinearGradient(
        padding.left,
        padding.top,
        width - padding.right,
        height - padding.bottom
    );

    gradient.addColorStop(0, "#65e6c4");
    gradient.addColorStop(1, "#79a9ff");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();

    points.forEach((point, index) => {
        const x = toX(point.x);
        const y = toY(point.y);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Point de départ.
    ctx.fillStyle = "#65e6c4";
    ctx.beginPath();
    ctx.arc(toX(0), toY(0), 6, 0, Math.PI * 2);
    ctx.fill();

    // Point d'impact.
    const lastPoint = points[points.length - 1];

    ctx.fillStyle = "#79a9ff";
    ctx.beginPath();
    ctx.arc(toX(lastPoint.x), toY(lastPoint.y), 6, 0, Math.PI * 2);
    ctx.fill();
}

const updateTable =(points) =>{
    tableBody.replaceChildren();

    // Montrer au maximum 15 lignes pour éviter un tableau trop long.
    const maxRows = 15;
    const stride = Math.max(1, Math.ceil(points.length / maxRows));

    const selectedPoints = points.filter((point, index) =>
        index % stride === 0 || index === points.length - 1
    );

    for (const point of selectedPoints) {
        const row = document.createElement("tr");

        const values = [
            formatNumber(point.time, 3),
            formatNumber(point.x, 3),
            formatNumber(point.y, 3),
            formatNumber(point.vy, 3)
        ];

        for (const value of values) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        }

        tableBody.appendChild(row);
    }
}

const runSimulation = async(event) => {
    event?.preventDefault();

    const currentRequest = ++requestNumber;
    errorMessage.textContent = "";

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Calcul en cours...";

    const parameters = {
        speed: Number(speedInput.value),
        angle: Number(angleInput.value),
        gravity: Number(gravityInput.value)
    };

    try {
        const response = await fetch("/api/simulate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(parameters)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "La simulation a échoué.");
        }

        // Ignorer une réponse devenue obsolète.
        if (currentRequest !== requestNumber) {
            return;
        }

        lastResult = data;

        distanceOutput.textContent = formatNumber(data.distance);
        heightOutput.textContent = formatNumber(data.max_height);
        timeOutput.textContent = formatNumber(data.flight_time);

        drawTrajectory(data.points);
        updateTable(data.points);

        caption.textContent =
            `${data.points.length} points calculés · ` +
            `Vitesse initiale : ${formatNumber(parameters.speed)} m/s · ` +
            `Angle : ${parameters.angle}° · ` +
            `Gravité : ${formatNumber(parameters.gravity)} m/s²`;

    } catch (error) {
        if (currentRequest === requestNumber) {
            errorMessage.textContent =
                error instanceof Error
                    ? error.message
                    : "Une erreur inattendue est survenue.";
        }
    } finally {
        if (currentRequest === requestNumber) {
            button.disabled = false;
            button.innerHTML = "<span>▶</span> Lancer la simulation";
        }
    }
}

const resetSimulation =() => {
    speedInput.value = "25";
    angleInput.value = "45";
    gravityInput.value = "9.81";

    updateLabels();
    runSimulation();
}

const exportCSV = () => {
    if (!lastResult) {
        errorMessage.textContent = "Lance une simulation avant l'exportation.";
        return;
    }

    const rows = [
        ["Temps (s)", "Position X (m)", "Position Y (m)",
            "Vitesse X (m/s)", "Vitesse Y (m/s)"],
        ...lastResult.points.map(point => [
            point.time,
            point.x,
            point.y,
            point.vx,
            point.vy
        ])
    ];

    // Le point-virgule convient aux tableurs configurés en français.
    const csv = "\uFEFF" + rows
        .map(row => row.join(";"))
        .join("\r\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "physicslab-trajectory.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

form.addEventListener("submit", runSimulation);
resetButton.addEventListener("click", resetSimulation);
exportButton.addEventListener("click", exportCSV);

for (const input of [speedInput, angleInput, gravityInput]) {
    input.addEventListener("input", updateLabels);
}

updateLabels();
clearCanvas();
runSimulation();
