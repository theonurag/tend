import { habitStart, journeyProgress } from "../../domain/habits.js";
import { $ } from "../../shared/dom.js";

function hashText(value = "") {
  return [...String(value)].reduce((hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);
}

function roundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    while (visible.at(-1) && context.measureText(`${visible.at(-1)}…`).width > maxWidth) {
      visible[visible.length - 1] = visible.at(-1).slice(0, -1);
    }
    visible[visible.length - 1] = `${visible.at(-1)}…`;
  }
  visible.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
  return visible.length;
}

function drawGrowthPlant(context, centerX, baseY, scale, seed) {
  const sway = ((seed % 17) - 8) * scale;
  const stemTop = baseY - 300 * scale;
  context.save();
  context.strokeStyle = "#2d6a58";
  context.lineWidth = 12 * scale;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(centerX, baseY);
  context.bezierCurveTo(centerX - 12 * scale, baseY - 110 * scale, centerX + sway, baseY - 210 * scale, centerX + sway, stemTop);
  context.stroke();

  const leaves = [
    { y: baseY - 82 * scale, side: -1, size: 63 },
    { y: baseY - 145 * scale, side: 1, size: 72 },
    { y: baseY - 215 * scale, side: -1, size: 58 },
    { y: baseY - 267 * scale, side: 1, size: 50 }
  ];
  leaves.forEach((leaf, index) => {
    const size = leaf.size * scale;
    const x = centerX + sway * ((baseY - leaf.y) / (baseY - stemTop));
    context.fillStyle = index % 2 ? "#77a947" : "#397d69";
    context.beginPath();
    context.moveTo(x, leaf.y);
    context.bezierCurveTo(x + leaf.side * size * .35, leaf.y - size * .7, x + leaf.side * size, leaf.y - size * .55, x + leaf.side * size, leaf.y - size * .08);
    context.bezierCurveTo(x + leaf.side * size * .72, leaf.y + size * .2, x + leaf.side * size * .25, leaf.y + size * .15, x, leaf.y);
    context.fill();
  });

  const bloomX = centerX + sway;
  const petalCount = 6 + (seed % 3);
  for (let index = 0; index < petalCount; index += 1) {
    const angle = (Math.PI * 2 * index) / petalCount;
    context.save();
    context.translate(bloomX, stemTop);
    context.rotate(angle);
    context.fillStyle = index % 2 ? "#d9efab" : "#c4df8b";
    context.beginPath();
    context.ellipse(0, -38 * scale, 20 * scale, 42 * scale, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  context.fillStyle = "#f0bd65";
  context.beginPath();
  context.arc(bloomX, stemTop, 23 * scale, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export function renderGrowthCard(habit) {
  const canvas = /** @type {HTMLCanvasElement} */ ($("#growthCanvas"));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");
  const story = /** @type {HTMLInputElement | null} */ (document.querySelector('[name="growthFormat"]:checked'))?.value === "story";
  const width = 1080;
  const height = story ? 1920 : 1350;
  canvas.width = width;
  canvas.height = height;
  const { achieved, length, completedAt } = journeyProgress(habit);
  const start = habitStart(habit);
  const showName = /** @type {HTMLInputElement} */ ($("#showGrowthName")).checked;
  const editedName = /** @type {HTMLInputElement} */ ($("#growthCardName")).value.trim();
  const cardName = showName ? editedName || habit.name : "A practice I tended";
  const compactDate = (date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const seed = hashText(`${habit.id}:${habit.name}`);
  const side = story ? 88 : 82;

  context.fillStyle = "#f4f5ef";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#173f35";
  context.fillRect(0, 0, width, story ? 250 : 210);
  context.fillStyle = "rgba(217,239,171,.10)";
  context.beginPath();
  context.arc(width - 70, 70, story ? 330 : 250, 0, Math.PI * 2);
  context.fill();

  context.textBaseline = "alphabetic";
  context.fillStyle = "#ffffff";
  context.font = '700 48px "Inter Variable", Inter, sans-serif';
  context.fillText("♧  Tend", side, story ? 145 : 130);
  context.fillStyle = "#b9d2c9";
  context.font = '600 25px "Inter Variable", Inter, sans-serif';
  context.fillText("A record of showing up", side, story ? 192 : 170);

  const plantCenter = story ? width / 2 : 790;
  const plantBase = story ? 825 : 680;
  const plantScale = story ? 1.55 : 1.18;
  context.fillStyle = "#e2eee8";
  context.beginPath();
  context.arc(plantCenter, plantBase - 145 * plantScale, story ? 265 : 215, 0, Math.PI * 2);
  context.fill();
  drawGrowthPlant(context, plantCenter, plantBase, plantScale, seed);

  const copyTop = story ? 980 : 315;
  const copyWidth = story ? width - side * 2 : 470;
  context.fillStyle = "#397d69";
  context.font = '700 25px "Inter Variable", Inter, sans-serif';
  context.letterSpacing = "3px";
  context.fillText("PRACTICE COMPLETE", side, copyTop);
  context.letterSpacing = "0px";
  context.fillStyle = "#173f35";
  context.font = `700 ${story ? 76 : 66}px "Inter Variable", Inter, sans-serif`;
  const titleLines = drawWrappedText(context, "Something took root.", side, copyTop + 98, copyWidth, story ? 84 : 76, 2);

  context.fillStyle = "#24332e";
  context.font = `650 ${story ? 46 : 38}px "Inter Variable", Inter, sans-serif`;
  const titleY = copyTop + 98 + titleLines * (story ? 84 : 76) + 36;
  const nameLines = drawWrappedText(context, cardName, side, titleY, copyWidth, story ? 57 : 49, 2);

  const statsY = titleY + nameLines * (story ? 57 : 49) + (story ? 70 : 58);
  const statsWidth = story ? width - side * 2 : 470;
  roundedRect(context, side, statsY, statsWidth, story ? 188 : 164, 28);
  context.fillStyle = "#ffffff";
  context.fill();
  context.fillStyle = "#2d6a58";
  context.font = `750 ${story ? 72 : 62}px "Inter Variable", Inter, sans-serif`;
  context.fillText(String(achieved), side + 34, statsY + (story ? 85 : 76));
  context.fillStyle = "#697873";
  context.font = `600 ${story ? 27 : 23}px "Inter Variable", Inter, sans-serif`;
  context.fillText(`days tended · ${length}-day practice`, side + 34, statsY + (story ? 135 : 120));

  const footerY = story ? height - 180 : height - 118;
  context.fillStyle = "#697873";
  context.font = `550 ${story ? 25 : 22}px "Inter Variable", Inter, sans-serif`;
  context.fillText(`${compactDate(start)} — ${compactDate(completedAt)}`, side, footerY);
  context.textAlign = "right";
  context.fillStyle = "#2d6a58";
  context.font = `700 ${story ? 25 : 22}px "Inter Variable", Inter, sans-serif`;
  context.fillText("theonurag.github.io/tend", width - side, footerY);
  context.textAlign = "left";
}
