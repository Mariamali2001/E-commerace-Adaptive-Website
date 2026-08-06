import streamlit as st
import pandas as pd
import sys
import os

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import (
    get_top_personas,
    get_persona_preferences,
    get_feature_groups,
    get_persona_traits
)

st.set_page_config(layout="wide")

if 'df' not in st.session_state:
    st.error("Please load data from the Home page.")
else:
    df = st.session_state['df']
    st.title("Mobile & General Guidelines")
    st.markdown("Explore optimal mobile design patterns and visual styles for your key user personas.")

    # Get Top Personas (n=None for all)
    top_personas = get_top_personas(df, n=None)
    
    if not top_personas:
        st.warning("No persona data found in the dataset provided.")
    else:
        # Create Tabs
        tabs = st.tabs(top_personas)
        
        _, _, traits, targets = get_feature_groups()
        
        # Define relevant columns
        # General Visuals (Fonts, Colors, Buttons)
        general_cols = [
            'font_style_pref', 'font_size_pref', 'color_theme_pref', 
            'accent_color_pref', 'background_pref', 'whitespace_pref', 
            'button_style_pref', 'urgency_pref'
        ]
        
        # Mobile Specifics
        mobile_cols = [c for c in targets if c.startswith('mobile_')]
        
        for i, persona in enumerate(top_personas):
            with tabs[i]:
                # 1. Profile Summary
                prefs, count = get_persona_preferences(df, persona, general_cols + mobile_cols)
                trait_summary = get_persona_traits(df, persona)
                
                c1, c2 = st.columns([1, 2])
                with c1:
                    st.info(f"**Representative of {count} Users**")
                    st.markdown("#### Characteristic Traits")
                    # Show top 3 most distinct traits (highest/lowest average)
                    sorted_traits = sorted(trait_summary.items(), key=lambda x: x[1], reverse=True)
                    for t, score in sorted_traits[:3]:
                        t_name = t.replace('trait_', '').replace('_', ' ').title()
                        if isinstance(score, (int, float)):
                            st.write(f"- **{t_name}:** {score:.1f}/7")
                        else:
                            st.write(f"- **{t_name}:** {score}")
                            
                with c2:
                    st.success(f"**Design Strategy for {persona}**")
                    st.write(f"This group typically prioritizes **{prefs.get('mobile_navigation', 'intuitive navigation')}** and **{prefs.get('color_theme_pref', 'specific colors')}**.")

                st.divider()
                
                # 2. Visual Style (General)
                st.subheader("Visual Style & Atmosphere")
                g_cols = st.columns(3)
                for idx, item in enumerate(general_cols):
                    if item in prefs:
                        label = item.replace('_pref', '').replace('_', ' ').title()
                        val = prefs[item]
                        # Use Markdown instead of Metric to avoid huge text
                        with g_cols[idx % 3]:
                            st.markdown(f"**{label}**")
                            st.caption(f"{val}")
                            st.write("") # Spacer
                
                st.divider()
                
                # 3. Mobile Layout
                st.subheader("Mobile Layout & Interactions")
                m_cols = st.columns(3)
                for idx, item in enumerate(mobile_cols):
                    if item in prefs:
                        label = item.replace('mobile_', '').replace('_pref', '').replace('_', ' ').title()
                        val = prefs[item]
                        with m_cols[idx % 3]:
                             st.markdown(f"**{label}**")
                             st.info(f"{val}")

    st.markdown("---")
    st.markdown("""
    **Methodology Note:**
    These guidelines are derived by aggregating the most frequent UI choices for each persona group. 
    Traits highlight the personality drivers that often correlate with these specific design preferences.
    """)
