import streamlit as st
import pandas as pd
import sys
import os
import shap

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import (
    get_guideline, 
    get_feature_groups, 
    get_guideline_categories, 
    get_shap_explanation,
    calculate_feature_importance
)

st.set_page_config(layout="wide")

if 'df' not in st.session_state:
    st.error("Please load data from the Home page.")
else:
    df = st.session_state['df']
    demographics, context, traits, targets = get_feature_groups()
    primary_cats, secondary_cats = get_guideline_categories()

    st.title("Guideline Explorer")
    st.markdown("Explore data-driven design guidelines with explainability and stability metrics.")

    # --- Top Panel: Context Filters ---
    st.sidebar.header("Context Context")
    
    # 1. Persona & Mood
    personas = ["Any"] + sorted(list(df['primary_persona'].unique())) if 'primary_persona' in df.columns else ["Any"]
    moods = ["Any"] + sorted(list(df['current_mood'].unique())) if 'current_mood' in df.columns else ["Any"]
    
    selected_persona = st.sidebar.selectbox("Primary Persona", personas)
    selected_mood = st.sidebar.selectbox("Current Mood", moods)
    
    # 2. Device
    devices = ["Any"] + sorted(list(df['primary_device'].unique())) if 'primary_device' in df.columns else ["Any"]
    selected_device = st.sidebar.selectbox("Device Context", devices)

    # 3. Trait Ranges (Sliders)
    st.sidebar.subheader("Personality Traits")
    trait_filters = {}
    
    # helper to check if trait is numerical (it should be 1-7 or similar)
    # We assume standard BFI traits are present.
    relevant_traits = [t for t in traits if t in df.columns]
    
    for trait in relevant_traits:
        min_val = float(df[trait].min())
        max_val = float(df[trait].max())
        # Default full range
        val = st.sidebar.slider(
            trait.replace("trait_", "").replace("_", " ").title(),
            min_val, max_val, (min_val, max_val)
        )
        trait_filters[trait] = val

    # --- UI Variant Label ---
    # Logic: Construct a name based on selections
    variant_name = "Generic / Mixed"
    if selected_persona != "Any":
        variant_name = f"{selected_persona}-Oriented"
    if selected_mood != "Any":
        variant_name += f" ({selected_mood})"
    
    st.info(f"**UI Variant:** {variant_name}")

    # --- Comparison Toggle ---
    compare_mode = st.toggle("Compare Mobile vs Desktop Realization")

    # --- Main Layout ---
    col_guidelines, col_explain = st.columns([2, 1])

    with col_guidelines:
        st.subheader("Design Guidelines")
        
        # Build Filters
        filters = {
            'primary_persona': selected_persona,
            'current_mood': selected_mood,
            'primary_device': selected_device
        }
        filters.update(trait_filters)

        # Helper to render a group of guidelines
        def render_guidelines(category_name, features, override_device=None):
            st.markdown(f"### {category_name}")
            
            current_filters = filters.copy()
            if override_device:
                current_filters['primary_device'] = override_device

            for ui in features:
                if ui not in df.columns:
                    continue
                
                # Device Check if not comparing
                if not compare_mode:
                    if "desktop" in ui and selected_device == "Smartphone": continue
                    if "mobile" in ui and selected_device == "Laptop/Desktop": continue
                else:
                    # In compare mode, we might want to force showing desktop/mobile specifics?
                    # The prompt says: "For the same UI Variant: Show how guidelines manifest differently on mobile vs desktop"
                    # If we override_device, we are simulating that context.
                    pass

                # Get Recommendation
                rec, conf, count, stab_label, stab_score = get_guideline(df, current_filters, ui)
                
                feature_label = ui.replace('_pref', '').replace('_', ' ').replace('desktop', '').replace('mobile', '').strip().title()
                
                # Card
                with st.expander(f"{feature_label}: **{rec}**"):
                    st.caption(f"Support: {count} users | Agreement: {conf:.1%} | Stability: {stab_label} ({stab_score:.2f})")
                    
                    if st.button(f"Explain '{feature_label}'", key=f"btn_{ui}_{override_device}"):
                        st.session_state['explain_target'] = ui
                        st.session_state['explain_rec'] = rec
                        st.session_state['explain_filters'] = current_filters
                        st.session_state['explain_feature_label'] = feature_label

        # PRIMARY GUIDELINES
        st.markdown("#### Primary Guidelines (Must Apply)")
        st.caption("Functional consistency, usability, flow.")
        
        if compare_mode:
            c1, c2 = st.columns(2)
            with c1:
                st.markdown("**Mobile Context**")
                render_guidelines("Core Structure", primary_cats, override_device="Smartphone")
            with c2:
                st.markdown("**Desktop Context**")
                render_guidelines("Core Structure", primary_cats, override_device="Laptop/Desktop")
        else:
            render_guidelines("Core Structure", primary_cats)

        st.divider()

        # SECONDARY GUIDELINES
        st.markdown("#### Secondary Guidelines (Adaptive / Aesthetic)")
        st.caption("Visual tone, aesthetic flexibility.")
        
        if compare_mode:
            c1, c2 = st.columns(2)
            with c1: 
                render_guidelines("Visuals", secondary_cats, override_device="Smartphone")
            with c2:
                render_guidelines("Visuals", secondary_cats, override_device="Laptop/Desktop")
        else:
            render_guidelines("Visuals", secondary_cats)

    # --- Explainability Panel ---
    with col_explain:
        st.header("Explainability Panel")
        
        if 'explain_target' in st.session_state:
            target = st.session_state['explain_target']
            rec = st.session_state['explain_rec']
            ex_filters = st.session_state['explain_filters']
            label = st.session_state.get('explain_feature_label', target)
            
            st.markdown(f"**Analyzing:** `{label}`")
            st.markdown(f"**Recommendation:** {rec}")
            
            st.write("---")
            st.subheader("Why this choice?")
            
            with st.spinner("Calculating Feature Importance (SHAP)..."):
                # Calculate SHAP or Importance
                # We need all features used in training to look for drivers
                # Using traits + context + demographics as predictors
                predictors = demographics + context + relevant_traits
                # Remove target if in predictors (unlikely)
                predictors = [p for p in predictors if p != target and p in df.columns]
                
                # Global Importance (for the whole filtered dataset? Or global model focused on this subclass?)
                # Prompt: "This guideline is primarily driven by the Researcher persona..."
                # Only way to know drivers for *this* result is to see what features correlate with this target
                # or use SHAP on a model trained for this target.
                
                # Check cache/compute
                shap_df, _ = get_shap_explanation(df, target, predictors)
                
                if shap_df is not None and not shap_df.empty:
                    top_3 = shap_df.head(3)
                    
                    for idx, row in top_3.iterrows():
                        fname = row['Feature'].replace('trait_', '').replace('_', ' ').title()
                        st.markdown(f"**{idx+1}. {fname}** (Imp: {row['SHAP_Importance']:.4f})")
                        
                    # Auto-generated text explanation
                    top_feat = top_3.iloc[0]['Feature']
                    top_feat_clean = top_feat.replace('trait_', '').replace('_', ' ').title()
                    
                    st.info(
                        f"This guideline is heavily influenced by **{top_feat_clean}**. "
                        f"Users with specific values in this attribute tend to prefer **{rec}**."
                    )
                else:
                    st.warning("Not enough variance to explain this choice (everyone agrees or too little data).")
                    
        else:
            st.info("Click 'Explain' on any guideline to see the drivers behind it.")
