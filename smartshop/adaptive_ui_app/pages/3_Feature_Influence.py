import streamlit as st
import pandas as pd
import plotly.express as px
import sys
import os

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import calculate_feature_importance, get_feature_groups

if 'df' not in st.session_state:
    st.error("Please load data from the Home page.")
else:
    df = st.session_state['df']
    demographics, context, traits, targets = get_feature_groups()
    
    st.header("Feature Influence Analysis")
    st.markdown("Discover which user traits and context factors **most strongly influence** specific UI preferences using AI (Random Forest).")

    # Select Target
    selected_target = st.selectbox("Select UI Element to Analyze", targets)
    
    if st.button("Analyze Influence"):
        if selected_target not in df.columns:
            st.error(f"Target '{selected_target}' not found in dataset.")
        else:
            with st.spinner("Training AI model to determine importance..."):
                # Define features to use for prediction
                # We use all available numeric traits + demographics + context
                feature_cols = demographics + context + traits
                # Filter out cols that might not exist
                valid_features = [c for c in feature_cols if c in df.columns]
                
                try:
                    # Get importance
                    imp_df = calculate_feature_importance(df, selected_target, valid_features)
                    
                    st.success("Analysis Complete!")
                    
                    # Plot Bar Chart
                    st.subheader(f"Top Drivers for '{selected_target}'")
                    fig = px.bar(imp_df.head(10), x='Importance', y='Feature', orientation='h',
                                 color='Importance', title="Relative Feature Importance",
                                 color_continuous_scale='Viridis')
                    fig.update_layout(yaxis={'categoryorder':'total ascending'})
                    st.plotly_chart(fig, use_container_width=True)
                    
                    # Top Factor Deep Dive
                    top_feature = imp_df.iloc[0]['Feature']
                    st.subheader(f"Deep Dive: {top_feature} vs {selected_target}")
                    st.markdown(f"Understanding how the #1 factor, **{top_feature}**, affects the preference.")
                    
                    # Visualization for the relationship
                    # If feature is numeric (many unique values), use box plot, else bar/heatmap
                    if df[top_feature].nunique() > 10 and pd.api.types.is_numeric_dtype(df[top_feature]):
                         fig2 = px.box(df, x=selected_target, y=top_feature, color=selected_target,
                                      title=f"Distribution of {top_feature} by Preference")
                    else:
                        # Stacked bar
                        count_df = df.groupby([top_feature, selected_target]).size().reset_index(name='count')
                        fig2 = px.bar(count_df, x=top_feature, y='count', color=selected_target,
                                     title=f"Preference Breakdown by {top_feature}", barmode='group')
                                     
                    st.plotly_chart(fig2, use_container_width=True)
                    
                except Exception as e:
                    st.error(f"Analysis failed: {e}")
