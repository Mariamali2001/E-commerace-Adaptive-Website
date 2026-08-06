import streamlit as st
import pandas as pd
import os
from utils import load_data

# Set page config
st.set_page_config(
    page_title="Adaptive E-Commerce UI Generator",
    page_icon="",
    layout="wide"
)

st.title("Adaptive E-Commerce UI Guideline Generator")

st.markdown("""
### Welcome!
This tool helps researchers and designers derive **data-driven UI guidelines** for e-commerce websites. 
It analyzes user personality traits, mood, and context to recommend optimal design patterns.
""")

# Sidebar for global controls
st.sidebar.header("Data Setup")

# Default data path
default_data_path = "data/E-Commerce.csv"
if not os.path.exists(default_data_path):
    # Fallback if running from root
    default_data_path = "adaptive_ui_app/data/E-Commerce.csv"

# File Uploader
uploaded_file = st.sidebar.file_uploader("Upload CSV Dataset", type=["csv"])

if uploaded_file is not None:
    df = load_data(uploaded_file)
    st.sidebar.success("Custom dataset uploaded!")
elif os.path.exists(default_data_path):
    df = load_data(default_data_path)
    st.sidebar.info("Using default dataset.")
else:
    df = None
    st.sidebar.warning("No dataset found. Please upload a CSV.")

# Persist data in session state
if df is not None:
    st.session_state['df'] = df
    
    # Basic Dataset Info in Sidebar
    st.sidebar.markdown("---")
    st.sidebar.subheader("Dataset Info")
    st.sidebar.write(f"**Rows:** {df.shape[0]}")
    st.sidebar.write(f"**Columns:** {df.shape[1]}")
    
    st.success("Data Loaded Successfully! Navigate to the pages in the sidebar to start exploring.")
else:
    st.info("Please upload a dataset to proceed.")

st.markdown("---")
st.markdown("""
#### How to use this tool:
#### How to use this tool:
1. **Guideline Explorer**: Derive and explain specific UI design lines.
2. **UI Variant Discovery**: Find latent design systems via clustering.
3. **Methodology**: Understand the ML pipeline.
4. **Analysis Tools**: Explore raw data and feature influence (pages 4-6).
""")
