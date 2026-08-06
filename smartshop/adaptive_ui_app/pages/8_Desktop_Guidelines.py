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
    st.title("Desktop Guidelines")
    st.markdown("Optimize desktop interfaces with data-driven layout and feature decisions for your top personas.")

    # Get Top Personas
    top_personas = get_top_personas(df, n=None)
    
    if not top_personas:
        st.warning("No persona data found.")
    else:
        # Create Tabs
        tabs = st.tabs(top_personas)
        
        _, _, traits, targets = get_feature_groups()
        
        # Desktop Specifics
        desktop_cols = [c for c in targets if c.startswith('desktop_')]
        
        # We can also include some general ones that affect desktop heavily if not redundant
        # e.g. 'hero_banner_size', 'recommendation_type', 'social_proof_display'
        extra_desktop_cols = ['hero_banner_size', 'recommendation_type', 'social_proof_display', 'checkout_style']
        
        all_desktop_related = desktop_cols + extra_desktop_cols
        
        for i, persona in enumerate(top_personas):
            with tabs[i]:
                # 1. Profile Summary
                prefs, count = get_persona_preferences(df, persona, all_desktop_related)
                trait_summary = get_persona_traits(df, persona)
                
                c1, c2 = st.columns([1, 2])
                with c1:
                    st.info(f"**Representative of {count} Users**")
                    st.write(f"This persona typically requires **{prefs.get('desktop_info_density', 'balanced')} data density** on large screens.")
                            
                with c2:
                    st.success(f"**Desktop Strategy for {persona}**")
                    st.markdown(f"Focus on **{prefs.get('desktop_navigation', 'clear navigation')}** and **{prefs.get('desktop_product_card', 'card style')}**.")

                st.divider()

                # 2. Visual Style (General)
                st.subheader("Visual Style & Atmosphere")
                g_cols = st.columns(3)
                # Define general cols same as mobile
                general_cols = [
                    'font_style_pref', 'font_size_pref', 'color_theme_pref', 
                    'accent_color_pref', 'background_pref', 'whitespace_pref', 
                    'button_style_pref', 'urgency_pref'
                ]
                # Re-fetch prefs to ensure we have general cols
                all_prefs, _ = get_persona_preferences(df, persona, all_desktop_related + general_cols)
                
                for idx, item in enumerate(general_cols):
                    if item in all_prefs:
                        label = item.replace('_pref', '').replace('_', ' ').title()
                        val = all_prefs[item]
                        with g_cols[idx % 3]:
                            st.markdown(f"**{label}**")
                            st.caption(f"{val}")
                            st.write("") 

                st.divider()
                
                # 3. Desktop Layout Grid
                st.subheader("Desktop Layout & Features")
                
                # Display as a grid of cards
                d_cols = st.columns(3)
                for idx, item in enumerate(all_desktop_related):
                    if item in prefs:
                        label = item.replace('desktop_', '').replace('_pref', '').replace('_', ' ').title()
                        val = prefs[item]
                        
                        # Style differently based on type
                        # Use Markdown instead of #### Headers to control size
                        with d_cols[idx % 3]:
                            st.markdown(f"**{label}**")
                            st.info(f"{val}")

    st.markdown("---")
    st.markdown("""
    **Methodology Note:**
    These layout recommendations are based on the aggregate preferences of users matching this persona profile.
    Specific desktop features like Mega Menus or Filters are chosen based on the majority vote within the group.
    """)
