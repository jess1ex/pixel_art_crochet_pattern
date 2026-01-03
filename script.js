const imageInput = document.getElementById("imageInput");
const processBtn = document.getElementById("processBtn");
const status = document.getElementById("status");
const rowsInput = document.getElementById("rowsInput");
const colsInput = document.getElementById("colsInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Tolerance for color equality (0–255 per channel)
let COLOR_TOLERANCE = 20; // default

const toleranceSlider = document.getElementById("toleranceSlider");
const toleranceValue = document.getElementById("toleranceValue");

toleranceSlider.addEventListener("input", () => {
  COLOR_TOLERANCE = parseInt(toleranceSlider.value);
  toleranceValue.textContent = COLOR_TOLERANCE;
});

const fileNameEl = document.getElementById("fileName");

imageInput.addEventListener("change", () => {
  if (imageInput.files.length > 0) {
    fileNameEl.textContent = `Uploaded: ${imageInput.files[0].name}`;
  } else {
    fileNameEl.textContent = "";
  }
});


processBtn.addEventListener("click", () => {
  // commented out when testing
  if (!imageInput.files.length) {
    status.textContent = "Please upload an image first!";
    return;
  }

  const rows = parseInt(rowsInput.value);
  const cols = parseInt(colsInput.value);

  const file = imageInput.files[0];

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    canvas.style.display = "block";

    const pixelColors = [];
    const detectedColors = [];

    const cellWidth = img.width / cols;
    const cellHeight = img.height / rows;

    for (let r = 0; r < rows; r++) {
      pixelColors[r] = [];
      for (let c = 0; c < cols; c++) {
        // // Get cell boundaries
        const xStart = Math.floor(c * cellWidth);
        const yStart = Math.floor(r * cellHeight);
        const xEnd = Math.floor((c + 1) * cellWidth);
        const yEnd = Math.floor((r + 1) * cellHeight);

        // Accumulate RGB values
        let rSum = 0,
          gSum = 0,
          bSum = 0;
        let count = 0;
        for (let y = yStart; y < yEnd; y++) {
          for (let x = xStart; x < xEnd; x++) {
            const idx = (y * img.width + x) * 4;
            const data = ctx.getImageData(x, y, 1, 1).data;
            rSum += data[0];
            gSum += data[1];
            bSum += data[2];
            count++;
          }
        }

        // Cell bounds
        // const xStart = Math.floor(c * cellWidth);
        // const yStart = Math.floor(r * cellHeight);
        // const xEnd = Math.floor((c + 1) * cellWidth);
        // const yEnd = Math.floor((r + 1) * cellHeight);

        // // // --- NEW: sample central region only ---
        // // const marginX = Math.floor(cellWidth * 0.25);
        // // const marginY = Math.floor(cellHeight * 0.25);

        // // const sampleXStart = xStart + marginX;
        // // const sampleYStart = yStart + marginY;
        // // const sampleXEnd = xEnd - marginX;
        // // const sampleYEnd = yEnd - marginY;

        // // // Accumulate RGB values (center only)
        // // let rSum = 0,
        // //   gSum = 0,
        // //   bSum = 0;
        // // let count = 0;

        // // for (let y = sampleYStart; y < sampleYEnd; y++) {
        // //   for (let x = sampleXStart; x < sampleXEnd; x++) {
        // //     const data = ctx.getImageData(x, y, 1, 1).data;
        // //     rSum += data[0];
        // //     gSum += data[1];
        // //     bSum += data[2];
        // //     count++;
        // //   }
        // // }

        // average
        const rAvg = Math.round(rSum / count);
        const gAvg = Math.round(gSum / count);
        const bAvg = Math.round(bSum / count);
        const currentColor = [rAvg, gAvg, bAvg];

        // Check if this color is "close" to any already detected color
        let matchedColor = null;
        for (const c2 of detectedColors) {
          if (colorsClose(c2, currentColor, COLOR_TOLERANCE)) {
            matchedColor = c2;
            break;
          }
        }

        // If no close color exists, add this as a new unique color
        if (!matchedColor) {
          detectedColors.push(currentColor);
          matchedColor = currentColor;
        }

        // Assign the pixelColors cell to the matched color (as hex)
        pixelColors[r][c] = rgbToHex(...matchedColor);
      }
    }

    // Convert detected colors to hex for display
    const detectedHex = detectedColors.map((c) => rgbToHex(...c));

    // Show unique colors - text
    //     status.innerHTML = `
    //   <strong>Unique colors detected in image (with tolerance):</strong><br>
    //   ${detectedHex.join(", ")}
    // `;

    // drawing preview of pixel art
    drawUniformPreview(pixelColors, rows, cols, 10);

    // allowing the user to name the colours

    const colorNamesContainer = document.getElementById("colorNamesContainer");
    colorNamesContainer.innerHTML = ""; // clear previous

    detectedHex.forEach((hex) => {
      const label = document.createElement("label");

      const swatch = document.createElement("span");
      swatch.className = "color-swatch";
      swatch.dataset.hex = hex;
      swatch.style.setProperty("--swatch-color", hex);

      const hexText = document.createElement("span");
      hexText.className = "hex-label";
      hexText.textContent = hex;

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Name this color";
      input.dataset.hex = hex;

      // allow up arrow key movement of input
      input.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

        e.preventDefault(); // stop cursor movement

        const inputs = Array.from(
          colorNamesContainer.querySelectorAll("input")
        );
        const index = inputs.indexOf(e.target);

        if (e.key === "ArrowDown" && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }

        if (e.key === "ArrowUp" && index > 0) {
          inputs[index - 1].focus();
        }
      });

      label.appendChild(swatch);
      label.appendChild(hexText);
      label.appendChild(document.createTextNode(": "));
      label.appendChild(input);

      colorNamesContainer.appendChild(label);
      colorNamesContainer.appendChild(document.createElement("br"));
    });

    // end of new code

    // Show second button
    document.getElementById("generateFRSBtn").style.display = "inline-block";
    document.getElementById("generatec2cBtn").style.display = "inline-block";

    const patternOutput = document.getElementById("patternOutput");

    generateFRSBtn.addEventListener("click", () => {
      // Map hex → user-provided name
      const inputs = colorNamesContainer.querySelectorAll("input");
      const colorNamesMap = {};
      inputs.forEach((input) => {
        if (input.value.trim())
          colorNamesMap[input.dataset.hex] = input.value.trim();
      });

      // Generate pattern directly with names
      const patternText = generateFRSpattern(
        pixelColors,
        detectedHex,
        colorNamesMap
      );
      patternOutput.innerHTML = patternText;
    });

    generatec2cBtn.addEventListener("click", () => {
      // Map hex → user-provided name
      const inputs = colorNamesContainer.querySelectorAll("input");
      const colorNamesMap = {};
      inputs.forEach((input) => {
        if (input.value.trim())
          colorNamesMap[input.dataset.hex] = input.value.trim();
      });

      // Generate pattern directly with names
      const patternText = generatec2c(pixelColors, detectedHex, colorNamesMap);
      patternOutput.innerHTML = patternText;
    });
  };

  // testing

  img.src = URL.createObjectURL(file);
  //img.src = "test.jpeg";
});

// helper: RGB → hex
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// helper: check if two colors are "close"
function colorsClose(c1, c2, tol) {
  return (
    Math.abs(c1[0] - c2[0]) <= tol &&
    Math.abs(c1[1] - c2[1]) <= tol &&
    Math.abs(c1[2] - c2[2]) <= tol
  );
}

// Convert hex to RGB array
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

// Euclidean distance in RGB space
function colorDistanceHex(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  return Math.sqrt(
    (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2
  );
}

// Find the closest color (hex string) from detected colors
function closestColorHex(pixelHex, detectedHexColors) {
  let bestMatch = detectedHexColors[0];
  let minDist = colorDistanceHex(pixelHex, bestMatch);

  for (const hex of detectedHexColors) {
    const dist = colorDistanceHex(pixelHex, hex);
    if (dist < minDist) {
      minDist = dist;
      bestMatch = hex;
    }
  }

  return bestMatch;
}

// Generate run-length pattern from pixelColorsHex with optional names
// this is the flat right side pattern
function generateFRSpattern(
  pixelColorsHex,
  detectedHexColors,
  colorNamesMap = {}
) {
  const patternLines = [];
  const numRows = pixelColorsHex.length;

  for (let r = 0; r < numRows; r++) {
    const rowIndex = numRows - 1 - r; // bottom-left first
    let row = [...pixelColorsHex[rowIndex]];

    if (r % 2 === 1) row.reverse(); // alternate direction
    const side = r % 2 === 0 ? "RS" : "WS";

    // Map each pixel to the closest detected color
    const correctedRow = row.map((hex) =>
      closestColorHex(hex, detectedHexColors)
    );

    // Run-length encode
    const segments = [];
    let count = 1;
    for (let i = 1; i <= correctedRow.length; i++) {
      if (i < correctedRow.length && correctedRow[i] === correctedRow[i - 1]) {
        count++;
      } else {
        const hex = correctedRow[i - 1];
        const name = colorNamesMap[hex] || hex; // use name if provided, otherwise hex
        segments.push(`<span class="num">${count}</span>x ${name}`);
        count = 1;
      }
    }

    patternLines.push(`<span class="row-label">Row</span>` + 
      `<span class="num">${r + 1}</span> [${side}]: ${segments.join(", ")}`);
  }

  return patternLines.join("\n");
}

// function to generate c2c pattern
function generatec2c(pixelColorsHex, detectedHexColors, colorNamesMap = {}) {
  const numRows = pixelColorsHex.length;
  const numCols = pixelColorsHex[0].length;
  const patternLines = [];

  let rowNum = 1;

  // s = r + c (1-indexed logic mapped to 0-indexed)
  for (let s = numRows + numCols; s >= 2; s--) {
    const stitches = [];
    const downwards = rowNum % 2 === 1;
    const side = s % 2 === 0 ? "up" : "down";

    // upwards diagonal traversal
    if (downwards) {
      // bottom-most → top-left
      for (let r = numRows - 1; r >= 0; r--) {
        const c = s - 2 - r;
        if (c >= 0 && c < numCols) {
          stitches.push(pixelColorsHex[r][c]);
        }
      }
    } else {
      // downwards
      // top-most → bottom-right
      for (let r = 0; r < numRows; r++) {
        const c = s - 2 - r;
        if (c >= 0 && c < numCols) {
          stitches.push(pixelColorsHex[r][c]);
        }
      }
    }

    const corrected = stitches.map((hex) =>
      closestColorHex(hex, detectedHexColors)
    );

    // putting the same colours together (3x red)
    const segments = [];
    let count = 1;
    for (let i = 1; i <= corrected.length; i++) {
      if (i < corrected.length && corrected[i] === corrected[i - 1]) {
        count++;
      } else {
        const hex = corrected[i - 1];
        const name = colorNamesMap[hex] || hex;
        segments.push(`<span class="num">${count}</span>x ${name}`);
        count = 1;
      }
    }

    const blockCount = corrected.length;

    // constructing the actual patterns
    patternLines.push(
      `<span class="row-label">Row</span> <span class="num">${rowNum}</span> ` +
        `[${side}]: ${segments.join(", ")} ` +
        `(<span class="num">${blockCount}</span> blocks)`
    );

    const maxBlocks = Math.max(numRows, numCols);
    if (rowNum === maxBlocks) {
      patternLines.push(
        '<span class="red">start decreasing on both ends</span>'
      );
    }

    // patternLines.push(`Row ${rowNum} [${side}]: ${segments.join(", ")}`);
    rowNum++;
  }

  return patternLines.join("\n");
}

// helper to draw preview of the pixel art
function drawUniformPreview(pixelColorsHex, rows, cols, scale = 10) {
  const previewCanvas = document.getElementById("previewCanvas");
  const canvas = document.getElementById("canvas");
  const pctx = previewCanvas.getContext("2d");

  // Match preview size to the user image canvas
  const targetWidth = canvas.width;
  const targetHeight = canvas.height;

  previewCanvas.width = targetWidth;
  previewCanvas.height = targetHeight;

  const cellWidth = targetWidth / cols;
  const cellHeight = targetHeight / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pctx.fillStyle = pixelColorsHex[r][c];
      pctx.fillRect(c * cellWidth, r * cellHeight, cellWidth, cellHeight);
    }
  }
}

// helper for mapping hex to colour names
function getColorNamesMap() {
  const map = {};
  const inputs = document.querySelectorAll("#colorNamesContainer input");

  inputs.forEach((input) => {
    const hex = input.dataset.hex;
    const name = input.value.trim();
    if (name) {
      map[hex] = name;
    }
  });

  return map;
}
