import streamlit as st
import pandas as pd
import json
import sys
import os

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import (
    get_guideline,
    get_feature_groups,
    get_guideline_categories
)

st.set_page_config(layout="wide", page_title="Export Adaptive Guidelines")

if 'df' not in st.session_state:
    st.error("Please load data from the Home page first.")
else:
    df = st.session_state['df']
    demographics, context, traits, targets = get_feature_groups()
    primary_cats, secondary_cats = get_guideline_categories()

    st.title("Export Final Adaptive Guidelines")
    st.markdown("""
    Generate, preview, and download structured adaptive UI guidelines in **JSON** or **CSV** format. 
    These exported configs can be directly fed into runtime adaptive frontend engines or **LLM APIs** (e.g. OpenAI, Gemini) to auto-generate personalized web code.
    """)

    st.sidebar.header("Target Profile Configuration")

    # Persona & Mood
    personas = ["Any"] + sorted(list(df['primary_persona'].unique())) if 'primary_persona' in df.columns else ["Any"]
    moods = ["Any"] + sorted(list(df['current_mood'].unique())) if 'current_mood' in df.columns else ["Any"]
    devices = ["Any", "Smartphone", "Laptop/Desktop"]

    selected_persona = st.sidebar.selectbox("Primary Persona", personas)
    selected_device = st.sidebar.selectbox("Device Context", devices)
    selected_mood = st.sidebar.selectbox("Current Mood", moods)

    # Filter dict
    filters = {
        'primary_persona': selected_persona,
        'current_mood': selected_mood,
        'primary_device': selected_device
    }

    # Generate Guidelines Bundle
    all_targets = primary_cats + secondary_cats
    # Filter targets present in dataframe
    valid_targets = [t for t in all_targets if t in df.columns]
    
    # Also include mobile/desktop specific targets if device matches
    if selected_device == "Smartphone":
        valid_targets = [t for t in targets if t in df.columns and ("mobile" in t or t in secondary_cats or t in primary_cats)]
    elif selected_device == "Laptop/Desktop":
        valid_targets = [t for t in targets if t in df.columns and ("desktop" in t or t in secondary_cats or t in primary_cats)]

    guidelines_list = []
    guidelines_dict = {}

    for target_col in valid_targets:
        rec, conf, count, stab_label, stab_score = get_guideline(df, filters, target_col)
        category = "Primary" if target_col in primary_cats else "Secondary"
        
        item = {
            "target_element": target_col,
            "category": category,
            "recommendation": rec,
            "confidence_score": round(conf, 4),
            "user_support_count": count,
            "stability_label": stab_label,
            "stability_score": round(stab_score, 4)
        }
        guidelines_list.append(item)
        guidelines_dict[target_col] = {
            "value": rec,
            "confidence": round(conf, 4),
            "stability": stab_label
        }

    # Export Schema
    export_schema = {
        "metadata": {
            "project": "Towards Intelligent User-Adaptive Interfaces",
            "version": "1.0",
            "total_dataset_records": len(df),
            "applied_filters": filters
        },
        "target_profile": {
            "persona": selected_persona,
            "device": selected_device,
            "mood": selected_mood
        },
        "adaptive_ui_rules": guidelines_dict
    }

    # Tabs
    tab_master, tab_global, tab_json, tab_csv, tab_llm = st.tabs([
        "Master All-in-One Lookup (All Combinations)",
        "Global Defaults (Any / Any / Any)",
        "Single Profile JSON",
        "CSV Format",
        "LLM Code Prompt Generator",
    ])

    with tab_global:
        st.subheader("Global UI Defaults (Dataset-Wide Majority)")
        st.markdown("""
        Export a **`global_defaults.json`** file where persona, device, and mood are all **Any**.
        Each UI token is the survey-wide majority preference.

        Place the file at:
        `smartshop/public/assets/global_defaults.json`

        The Adaptive Engine uses it to **fill missing tokens** after the master matrix lookup
        (specialized cell first; global only for gaps — never a full replace).
        """)

        if st.button("Generate Global Defaults (Any / Any / Any)"):
            with st.spinner("Computing dataset-wide majority for every UI target..."):
                g_filters = {
                    "primary_persona": "Any",
                    "current_mood": "Any",
                    "primary_device": "Any",
                }
                g_tokens = {}
                g_details = {}
                for t in targets:
                    if t not in df.columns:
                        continue
                    rec, conf, count, stab_label, stab_score = get_guideline(
                        df, g_filters, t
                    )
                    if count > 0 and rec and rec != "Not enough data":
                        g_tokens[t] = rec
                        g_details[t] = {
                            "value": rec,
                            "confidence": round(conf, 4),
                            "user_support_count": int(count),
                            "stability_label": stab_label,
                            "stability_score": round(stab_score, 4),
                        }

                global_export = {
                    "project": "Towards Intelligent User-Adaptive Interfaces",
                    "description": (
                        "Global UI defaults — dataset-wide majority "
                        "(persona/device/mood = Any). Used by Adaptive Engine "
                        "to fill missing tokens after master matrix lookup."
                    ),
                    "version": "1.0",
                    "source": "adaptive_ui_app get_guideline filters=Any/Any/Any",
                    "total_dataset_records": int(len(df)),
                    "applied_filters": g_filters,
                    "tokens": g_tokens,
                    "token_details": g_details,
                }
                st.session_state["global_json_str"] = json.dumps(
                    global_export, indent=2
                )
                st.success(
                    f"Global defaults generated ({len(g_tokens)} tokens)."
                )

        if "global_json_str" in st.session_state:
            st.caption("JSON Preview (first 1,500 characters):")
            st.code(
                st.session_state["global_json_str"][:1500]
                + "\n\n... [full file]",
                language="json",
            )
            st.download_button(
                label="Download global_defaults.json",
                data=st.session_state["global_json_str"],
                file_name="global_defaults.json",
                mime="application/json",
            )
            st.info(
                "Copy the downloaded file to "
                "`smartshop/public/assets/global_defaults.json` "
                "so the website can fill missing UI tokens."
            )

    with tab_master:
        st.subheader("Master Rules Lookup Table (All Combinations)")
        st.markdown("""
        **The Ultimate Frontend Integration Option:** 
        Instead of downloading profiles one by one, click below to generate a single unified **`master_adaptive_ui_rules.json`** file. 
        Your e-commerce website can load this single JSON file once, and instantly look up the exact UI design rules for any user:
        `rules[persona][device][mood]`
        """)

        if st.button("Generate Master Rules Matrix for All Combinations"):
            with st.spinner("Compiling master guideline lookup matrix across all personas, devices, and moods..."):
                master_rules = {}
                personas_list = list(df['primary_persona'].dropna().unique()) if 'primary_persona' in df.columns else ["Any"]
                devices_list = ["Smartphone", "Laptop/Desktop"]
                moods_list = list(df['current_mood'].dropna().unique()) if 'current_mood' in df.columns else ["Any"]

                for p in personas_list:
                    master_rules[p] = {}
                    for d in devices_list:
                        master_rules[p][d] = {}
                        for m in moods_list:
                            c_filters = {'primary_persona': p, 'primary_device': d, 'current_mood': m}
                            r_dict = {}
                            for t in targets:
                                if t in df.columns:
                                    rec, conf, count, stab_label, stab_score = get_guideline(df, c_filters, t)
                                    if count > 0:
                                        r_dict[t] = rec
                            if r_dict:
                                master_rules[p][d][m] = r_dict

                master_export = {
                    "project": "Towards Intelligent User-Adaptive Interfaces",
                    "description": "Master Adaptive UI Lookup Matrix for All User Profiles",
                    "total_personas": len(master_rules),
                    "rules": master_rules
                }
                
                master_json_str = json.dumps(master_export, indent=2)
                st.session_state['master_json_str'] = master_json_str
                st.success("Master Rules Matrix Generated Successfully!")

        if 'master_json_str' in st.session_state:
            st.caption("JSON Preview (First 1,500 characters):")
            st.code(st.session_state['master_json_str'][:1500] + "\n\n... [Full file contains complete mappings for all combinations]", language="json")
            
            st.download_button(
                label="Download Master Adaptive Rules JSON (master_adaptive_ui_rules.json)",
                data=st.session_state['master_json_str'],
                file_name="master_adaptive_ui_rules.json",
                mime="application/json"
            )

    with tab_json:
        st.subheader("Single Profile JSON Configuration")
        st.caption("Use this JSON file if you only want guidelines for the currently selected sidebar profile.")
        json_str = json.dumps(export_schema, indent=2)
        
        st.code(json_str, language="json")
        
        st.download_button(
            label="Download Single Profile JSON Config",
            data=json_str,
            file_name=f"adaptive_ui_config_{selected_persona.lower().replace(' ', '_')}_{selected_device.lower().replace('/', '_')}.json",
            mime="application/json"
        )

    with tab_csv:
        st.subheader("CSV Export")
        st.caption("Structured table format suitable for data reporting or paper appendices.")
        export_df = pd.DataFrame(guidelines_list)
        st.dataframe(export_df, use_container_width=True)
        
        csv_str = export_df.to_csv(index=False)
        st.download_button(
            label="Download Guidelines CSV",
            data=csv_str,
            file_name=f"adaptive_ui_guidelines_{selected_persona.lower().replace(' ', '_')}.csv",
            mime="text/csv"
        )

    with tab_llm:
        st.subheader("LLM Prompt Generator for Web Code Generation")
        st.markdown("Copy this system prompt to send to LLM APIs (e.g. OpenAI GPT-4, Gemini) to auto-generate adaptive web components.")
        
        llm_prompt = f"""
You are an expert Frontend Developer specializing in Intelligent Adaptive E-Commerce Interfaces.

Target User Profile:
- Persona: {selected_persona}
- Device: {selected_device}
- Current Mood: {selected_mood}

Generate a fully functional HTML/CSS/JavaScript web snippet tailored to this user profile based on these empirically validated design rules:

Design Rules (JSON):
{json.dumps(guidelines_dict, indent=2)}

Instructions:
1. Apply the recommended layout, typography, navigation, and visual hierarchy strictly as specified.
2. Ensure high contrast and smooth micro-animations tailored to the user's mood and persona.
3. Output clean, responsive code.
"""
        st.code(llm_prompt, language="markdown")

st.markdown("---")
st.info("**Master's Research Tip:** Exporting guidelines as standardized JSON enables seamless integration with both rule-based client adaptors and LLM-powered dynamic page generators.")

