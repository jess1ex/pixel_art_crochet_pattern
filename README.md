# Pixel-to-Pattern

A web app that turns uploaded images into pixel crochet patterns.

[Live Demo](https://jess1ex.github.io/pixel_art_crochet_pattern/)

## Overview

Pixel-to-Pattern helps crocheters convert an image into a simplified pixel grid
and written pattern instructions. Users can control the grid size, adjust color
tolerance, name detected colors, and generate written instructions for single
crochet or C2C projects.

## Features

- Upload an image from your device
- Choose custom row and column counts
- Adjust color tolerance to simplify the palette
- Preview the generated pixel chart
- Name detected colors for readable pattern output
- Generate single crochet and C2C instructions

## Tech Stack

- HTML
- CSS
- JavaScript
- Canvas API

## Run Locally

Open `index.html` in a browser.

For a local server, run:

    python3 -m http.server

Then open:

    http://localhost:8000

## Project Highlights

- Built image-to-grid conversion logic with JavaScript
- Used the Canvas API to render pixel previews
- Created a responsive dark themed interface
- Converted visual color data into structured crochet instructions
