import streamlit as st
import plotly.express as px
import pandas as pd
import sys
import os

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import get_feature_groups

if 'df' not in st.session_state:
    st.error("Please load data from the Home page.")
else:
    df = st.session_state['df']
    demographics, context, traits, targets = get_feature_groups()

    st.header("Data Exploration & Visualization")

    tab1, tab2, tab3, tab4 = st.tabs([
        "Trait Distributions", 
        "Preferences by Context", 
        "Cross-Analysis", 
        "Choice Frequency Counts"
    ])
    
    # --- Tab 1: Traits ---
    with tab1:
        st.subheader("Personality Trait Distributions")
        selected_trait = st.selectbox("Select Trait", traits)
        
        if selected_trait in df.columns:
            fig = px.histogram(df, x=selected_trait, color=selected_trait, 
                               title=f"Distribution of {selected_trait}",
                               color_discrete_sequence=px.colors.qualitative.Pastel)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.warning(f"Trait '{selected_trait}' not found in dataset.")

    # --- Tab 2: Preferences ---
    with tab2:
        st.subheader("UI Preferences by Context")
        
        col1, col2 = st.columns(2)
        with col1:
            selected_context = st.selectbox("Group By (Context)", ['primary_device', 'current_mood', 'primary_persona', 'gender'])
        with col2:
            selected_ui = st.selectbox("UI Preference (Target)", targets)
            
        if selected_context in df.columns and selected_ui in df.columns:
            # Group data for plotting
            count_df = df.groupby([selected_context, selected_ui]).size().reset_index(name='count')
            
            fig = px.bar(count_df, x=selected_context, y='count', color=selected_ui,
                         title=f"{selected_ui} by {selected_context}",
                         barmode='group',
                         color_discrete_sequence=px.colors.qualitative.Vivid)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.warning("Selected columns not found in dataset.")

    # --- Tab 3: Cross Analysis ---
    with tab3:
        st.subheader("Filter & Compare")
        
        # Filters
        c1, c2, c3 = st.columns(3)
        device_filter = c1.selectbox("Filter Device", ["All"] + list(df['primary_device'].unique()) if 'primary_device' in df.columns else [])
        mood_filter = c2.selectbox("Filter Mood", ["All"] + list(df['current_mood'].unique()) if 'current_mood' in df.columns else [])
        
        filtered_df = df.copy()
        if device_filter != "All":
            filtered_df = filtered_df[filtered_df['primary_device'] == device_filter]
        if mood_filter != "All":
            filtered_df = filtered_df[filtered_df['current_mood'] == mood_filter]
            
        st.metric("Filtered Samples", filtered_df.shape[0])
        
        target_compare = st.selectbox("Compare Preference Distribution", targets, index=0)
        
        if target_compare in filtered_df.columns:
            fig = px.pie(filtered_df, names=target_compare, title=f"{target_compare} (Filtered)",
                         color_discrete_sequence=px.colors.qualitative.Set3)
            st.plotly_chart(fig, use_container_width=True)

    # --- Tab 4: Choice Frequency Counts ---
    with tab4:
        st.subheader("Total Records per Choice / Response")
        st.markdown("Inspect the total number of records and percentage breakdown for each choice across any dataset column.")

        # Category Filter
        col_category = st.radio(
            "Select Category to Inspect", 
            ["UI Preferences (Targets)", "Context & Behavior", "Demographics", "All Columns"], 
            horizontal=True
        )

        if col_category == "UI Preferences (Targets)":
            selectable_cols = [c for c in targets if c in df.columns]
        elif col_category == "Context & Behavior":
            selectable_cols = [c for c in context if c in df.columns]
        elif col_category == "Demographics":
            selectable_cols = [c for c in demographics if c in df.columns]
        else:
            selectable_cols = list(df.columns)

        selected_col = st.selectbox("Select Column to View Choice Counts", selectable_cols)

        if selected_col in df.columns:
            # Value counts
            counts = df[selected_col].value_counts(dropna=False).reset_index()
            counts.columns = ['Choice / Option', 'Total Records']
            total_valid = len(df[selected_col].dropna())
            counts['Percentage'] = (counts['Total Records'] / len(df) * 100).round(2).astype(str) + '%'

            # Display metrics
            m1, m2, m3 = st.columns(3)
            m1.metric("Selected Column", selected_col)
            m2.metric("Total Valid Records", total_valid)
            m3.metric("Unique Choices", len(counts))

            c_table, c_chart = st.columns([1, 1])

            with c_table:
                st.markdown("#### Choice Summary Table")
                st.dataframe(counts, use_container_width=True, hide_index=True)

            with c_chart:
                st.markdown("#### Total Records Distribution")
                fig_choice = px.bar(
                    counts, 
                    x='Choice / Option', 
                    y='Total Records',
                    text='Total Records',
                    color='Choice / Option',
                    title=f"Total Records by Choice for '{selected_col}'",
                    color_discrete_sequence=px.colors.qualitative.Plotly
                )
                fig_choice.update_traces(textposition='outside')
                st.plotly_chart(fig_choice, use_container_width=True)

        st.markdown("---")
        st.markdown("### Full Choice Frequency Table (All Selected Category Columns)")
        with st.expander("Click to view complete choice counts for all columns in this category"):
            summary_list = []
            for col in selectable_cols:
                vc = df[col].value_counts(dropna=False)
                for val, count in vc.items():
                    summary_list.append({
                        "Column Name": col,
                        "Choice / Option": str(val),
                        "Total Records": count,
                        "Percentage (%)": f"{(count / len(df) * 100):.2f}%"
                    })
            summary_df = pd.DataFrame(summary_list)
            st.dataframe(summary_df, use_container_width=True)

st.markdown("---")
st.markdown("""
**Methodology Note:**
This visualization tool allows direct inspection of raw data distributions and cross-feature relationships.
It helps verify that the synthesized guidelines are grounded in actual user patterns.
""")

