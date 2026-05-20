# Scraper

This script downloads course data from IS MUNI and generates `processed_data.json` based on the provided input.

## Installation

```bash
pip install -r requirements.txt
```

## Usage

```bash
python scraper.py
```

## Configuration

If needed, you can modify the input and output file paths directly in the main function of scraper.py:

- Input file: Change the filename variable that currently points to bc_bio_cz.json.
- Output file: Change the destination path for the generated JSON file (defaults to ../src/data/processed_data.json).

## Input

bc_bio_cz.json — A file containing the list of courses and specializations.

## Output

../src/data/processed_data.json — The structured output data used by the visualization.
