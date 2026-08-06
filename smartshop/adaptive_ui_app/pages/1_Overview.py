import streamlit as st
import pandas as pd
import sys
import os

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Verify if data is loaded
if 'df' not in st.session_state:
    st.error("Please upload or load a dataset from the Home page first.")
else:
    df = st.session_state['df']

    st.header("Dataset Overview")

    st.subheader("1. Data Preview")
    st.dataframe(df.head())

    st.subheader("2. Dataset Statistics")
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Responses", df.shape[0])
    col1.metric("Total Features", df.shape[1])
    
    missing_values = df.isnull().sum().sum()
    col2.metric("Missing Values", missing_values)
    
    # Identify column types
    num_cols = df.select_dtypes(include=['int64', 'float64']).columns
    cat_cols = df.select_dtypes(include=['object']).columns
    
    col3.metric("Numeric Columns", len(num_cols))
    col3.metric("Categorical Columns", len(cat_cols))

    st.subheader("3. Column Analysis")
    st.write("List of available columns and their types:")
    
    col_info = pd.DataFrame({
        'Column Name': df.columns,
        'Type': df.dtypes,
        'Missing Values': df.isnull().sum(),
        'Unique Values': df.nunique()
    })
    st.dataframe(col_info, use_container_width=True)

    st.subheader("4. Quick Profiling")
    if st.checkbox("Show Detailed Column Statistics"):
        st.write(df.describe(include='all'))

st.markdown("---")
st.markdown("""
**Methodology Note:**
This overview page presents a high-level summary of the dataset demographics and key characteristics. 
It establishes the foundation for understanding the user base before diving into specific UI preferences.
""")
