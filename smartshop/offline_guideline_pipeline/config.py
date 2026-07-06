"""Shared paths and settings for the offline guideline pipeline."""

from pathlib import Path

# Project root (offline_guideline_pipeline/)
ROOT_DIR = Path(__file__).resolve().parent

# Data paths
DATA_DIR = ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
REPORTS_DIR = ROOT_DIR / "reports"
SCRIPTS_DIR = ROOT_DIR / "scripts"

RAW_DATA_FILE = RAW_DIR / "E-Commerce - data.csv"
CLEAN_DATASET_FILE = PROCESSED_DIR / "clean_dataset.csv"
ENCODED_DATASET_FILE = PROCESSED_DIR / "encoded_dataset.csv"
CLEANING_REPORT_FILE = PROCESSED_DIR / "cleaning_report.xlsx"
CLEANING_SUMMARY_FILE = REPORTS_DIR / "cleaning_summary.txt"

# Processing defaults
RANDOM_SEED = 42
