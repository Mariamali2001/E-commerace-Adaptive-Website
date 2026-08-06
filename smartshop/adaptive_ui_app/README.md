# Adaptive E-Commerce UI Generator

This is a Streamlit application that helps researchers and designers derive data-driven UI guidelines for e-commerce websites.

**Website link:** export `master_adaptive_ui_rules.json` (Export Guidelines page) and place it at:

`smartshop/public/assets/master_adaptive_ui_rules.json`

The Next.js shop Adaptive Engine does an instant lookup:

`rules[persona][device][mood]` → Final UI Configuration (no ML at browse time).

## Prerequisites

- Python 3.8 or higher

## Installation

1.  **Clone the repository** (if you haven't already).

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**
    - On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```
    - On Windows:
        ```bash
        venv\Scripts\activate
        ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Running the Application

To start the local web server and view the application:

```bash
streamlit run Home.py
```

The application should automatically open in your default browser at `http://localhost:8501`.

## Project Structure

- `Home.py`: The main entry point of the application.
- `pages/`: Contains the individual pages of the multi-page app.
- `utils.py`: Utility functions for data loading, processing, and model training.
- `data/`: Directory for storing dataset files (e.g., `E-Commerce.csv`).
