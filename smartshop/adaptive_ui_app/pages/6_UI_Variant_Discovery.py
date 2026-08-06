import streamlit as st
import pandas as pd
import sys
import os

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import (
    get_feature_groups,
    cluster_ui_preferences, 
    get_cluster_profile
)

st.set_page_config(layout="wide")

if 'df' not in st.session_state:
    st.error("Please load data from the Home page.")
else:
    df = st.session_state['df']
    st.title("UI Variant Discovery")
    st.markdown("""
    **Objective:** Discover latent UI variants by clustering user preferences. 
    Instead of assuming predefined groups, we let the data define the design systems.
    """)

    # Configuration
    col_conf, col_run = st.columns([1, 3])
    with col_conf:
        n_clusters = st.slider("Number of Variants (Clusters)", 2, 6, 3)
    
    # Run Clustering
    clustered_df, kmeans, encoders, valid_targets = cluster_ui_preferences(df, n_clusters=n_clusters)
    
    st.success(f"Identified {n_clusters} Distinct UI Variants based on {len(valid_targets)} UI preference dimensions.")
    
    toggle_dominant = st.toggle("Show dominant cluster profile", value=True)

    # Display Variants
    cols = st.columns(n_clusters)
    
    demographics, context, traits, targets = get_feature_groups()
    profile_features = ['primary_persona', 'current_mood'] + [t for t in traits if t in df.columns]
    
    for i in range(n_clusters):
        with cols[i]:
            st.markdown(f"### Variant {chr(65+i)}")
            
            # Get Profile
            profile, ui_bundle, count = get_cluster_profile(clustered_df, i, profile_features, valid_targets)
            
            # Naming Heuristic
            persona = profile.get('primary_persona', 'Generic')
            mood = profile.get('current_mood', 'Neutral')
            st.markdown(f"**_{persona} ({mood}) Style_**")
            st.caption(f"Representative of {count} users")
            
            st.divider()
            
            if toggle_dominant:
                st.markdown("**Typical User Profile:**")
                st.write(f"- **Persona:** {persona}")
                st.write(f"- **Mood:** {mood}")
                
                # Show top 2 traits
                # Need to calculate averages for this cluster vs global to find distinctive traits?
                # Or just list mode if they are categorical bins? Assuming mode for now as per util.
                # If they are numerical (1-7), utils currently might fail if just taking mode? 
                # Utils `get_cluster_profile` was simple. Let's assume standard usage.
                
            st.markdown("**UI Bundle (Dominant Choices):**")
            
            # Group by category roughly
            for key, val in ui_bundle.items():
                label = key.replace('_pref', '').replace('_', ' ').title()
                st.markdown(f"- **{label}**: {val}")
                
    st.divider()
    
    st.subheader("Data Projection")
    st.info("Displaying clusters in 2D space (PCA) - *Placeholder for visual scatter plot if needed*")
    
    # Optional: Simple PCA Plot
    try:
        from sklearn.decomposition import PCA
        import plotly.express as px
        
        # Prepare X for plotting
        from utils import preprocess_data
        X_encoded, _, _ = preprocess_data(df, valid_targets)
        
        pca = PCA(n_components=2)
        components = pca.fit_transform(X_encoded)
        
        plot_df = pd.DataFrame(data = components, columns = ['PC1', 'PC2'])
        plot_df['Cluster'] = clustered_df['Cluster'].astype(str)
        plot_df['Persona'] = df['primary_persona'] if 'primary_persona' in df.columns else 'Unknown'
        
        fig = px.scatter(
            plot_df, x='PC1', y='PC2', color='Cluster', 
            hover_data=['Persona'],
            title="User Segments in UI Preference Space"
        )
        st.plotly_chart(fig, use_container_width=True)
        
    except Exception as e:
        st.write(f"Could not generate plot: {e}")

