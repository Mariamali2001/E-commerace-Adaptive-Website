import pandas as pd
import streamlit as st
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.utils import resample
import shap

def filter_attention_checks(df):
    """
    Filters out records that fail 2 or more attention checks.
    Dataset contains 5 attention checkers: check1, check2, check3, check4, check5.
    - check1, check2, check4, check5: correct value is 3
    - check3: correct value is 'Rounded Corners'
    Records with score >= 4 (at least 4 out of 5 correct) are retained; records with < 4 are dropped.
    """
    check_cols = ['check1', 'check2', 'check3', 'check4', 'check5']
    present = [c for c in check_cols if c in df.columns]
    if not present:
        return df

    def score_row(row):
        score = 0
        for col in ['check1', 'check2', 'check4', 'check5']:
            if col in row and pd.notna(row[col]):
                val = str(row[col]).strip()
                if val in ('3', '3.0'):
                    score += 1
        if 'check3' in row and pd.notna(row['check3']):
            val = str(row['check3']).strip().lower()
            if 'rounded corners' in val:
                score += 1
        return score

    scores = df.apply(score_row, axis=1)
    return df[scores >= 4].copy()

@st.cache_data
def load_data(file):
    """
    Loads data from a CSV file or path and filters out invalid responses based on attention checkers.
    """
    if file is None:
        return None
    try:
        df = pd.read_csv(file)
        # Basic cleaning: drop empty rows if any
        df = df.dropna(how='all')
        # Filter records based on attention checkers (keep score >= 4/5)
        df = filter_attention_checks(df)
        return df
    except Exception as e:
        st.error(f"Error loading data: {e}")
        return None


def get_feature_groups():
    """
    Returns dictionaries of feature groups.
    """
    demographics = ['age_group', 'gender', 'education_level']
    # Context features including Primary Persona and Shopping Behavior
    context = [
        'primary_persona', 'primary_device', 'shopping_motivation', 
        'decision_speed', 'current_mood', 'price_sensitivity', 
        'review_importance', 'brand_loyalty', 'social_proof_influence'
    ]
    traits = [
        'trait_introversion', 'trait_trust', 'trait_low_conscientiousness', 
        'trait_emotional_stability', 'trait_low_openness', 'trait_extraversion', 
        'trait_agreeableness_reverse', 'trait_conscientiousness', 
        'trait_neuroticism', 'trait_openness'
    ]
    
    # UI preference targets
    targets = [
        'font_style_pref', 'font_size_pref', 'color_theme_pref', 'accent_color_pref', 
        'background_pref', 'whitespace_pref', 'button_style_pref', 'hero_banner_size', 
        'recommendation_type', 'social_proof_display', 'urgency_pref', 'checkout_style',
        'form_field_style', 'product_desc_length',
        # Desktop Specifics
        'desktop_navigation', 'desktop_product_card', 'desktop_review_display', 
        'desktop_info_density', 'desktop_filter_location', 'desktop_quick_view', 
        'desktop_whitespace', 'desktop_grid_pref', 'desktop_image_text_ratio', 
        'desktop_search_visibility', 'desktop_category_display', 'desktop_price_display', 
        'desktop_persistent_filters',
        # Mobile Specifics
        'mobile_navigation', 'mobile_product_card', 'mobile_review_display', 
        'mobile_info_density', 'mobile_filter_location', 'mobile_quick_view', 
        'mobile_whitespace', 'mobile_grid_pref', 'mobile_image_text_ratio', 
        'mobile_search_visibility', 'mobile_category_display', 'mobile_price_display', 
        'mobile_sticky_header', 'mobile_touch_size'
    ]
    
    return demographics, context, traits, targets


def get_guideline_categories():
    """
    Returns the classification of guidelines into Primary and Secondary.
    """
    primary = [
        # Core Navigation & Structure
        'hero_banner_size', 'desktop_navigation', 'mobile_navigation', 
        'desktop_category_display', 'mobile_category_display',
        'desktop_search_visibility', 'mobile_search_visibility',
        'desktop_filter_location', 'mobile_filter_location',
        'desktop_persistent_filters', 'mobile_sticky_header',
        
        # Information Architecture
        'desktop_info_density', 'mobile_info_density',
        'recommendation_type', 'social_proof_display', 
        'urgency_pref', 'checkout_style',
        'desktop_product_card', 'mobile_product_card',
        'desktop_review_display', 'mobile_review_display',
        'desktop_price_display', 'mobile_price_display'
    ]
    
    secondary = [
        # Visual Style
        'font_style_pref', 'font_size_pref', 'color_theme_pref', 'accent_color_pref', 
        'background_pref', 'whitespace_pref', 'button_style_pref',
        'desktop_whitespace', 'mobile_whitespace',
        
        # Interaction / Minor Layout
        'desktop_quick_view', 'mobile_quick_view',
        'desktop_grid_pref', 'mobile_grid_pref',
        'desktop_image_text_ratio', 'mobile_image_text_ratio',
        'mobile_touch_size'
    ]
    return primary, secondary

def preprocess_data(df, feature_cols, target_col=None):
    """
    Prepares data for training by encoding categorical variables.
    Returns X (features), y (target, if provided), and the encoders.
    """
    # Create a copy to avoid SettingWithCopy warnings
    if target_col:
        data = df[feature_cols + [target_col]].copy()
        # Drop rows with missing target values
        data = data.dropna(subset=[target_col])
    else:
        data = df[feature_cols].copy()
    
    encoders = {}
    
    # Encode Categorical Features
    for col in data.columns:
        if data[col].dtype == 'object':
            le = LabelEncoder()
            # Handle potential nan values by converting to string
            data[col] = le.fit_transform(data[col].astype(str))
            encoders[col] = le
            
    X = data[feature_cols]
    y = data[target_col] if target_col else None
    
    return X, y, encoders

@st.cache_resource
def train_model(X, y):
    """
    Trains a Random Forest Classifier. Cached to avoid retraining on every rerun.
    """
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    model.fit(X, y)
    return model

def calculate_feature_importance(df, target_col, feature_cols):
    """
    Calculates feature importance for a specific target.
    """
    X, y, encoders = preprocess_data(df, feature_cols, target_col)
    
    if len(y.unique()) < 2:
        return pd.DataFrame()
        
    model = train_model(X, y)
    
    importances = model.feature_importances_
    feature_imp_df = pd.DataFrame({'Feature': feature_cols, 'Importance': importances})
    feature_imp_df = feature_imp_df.sort_values(by='Importance', ascending=False)
    
    return feature_imp_df

def get_shap_explanation(df, target_col, feature_cols):
    """
    Calculates SHAP values for the most important features.
    """
    X, y, encoders = preprocess_data(df, feature_cols, target_col)
    
    if len(y.unique()) < 2:
        return None, None
        
    model = train_model(X, y)
    
    # Calculate SHAP values
    explainer = shap.TreeExplainer(model)
    # Check_additivity=False to avoid errors with some RF configurations
    shap_values = explainer.shap_values(X, check_additivity=False)
    
    # Simple summary: mean absolute SHAP value per feature
    # Handle list (multiclass) vs array (binary/regression)
    if isinstance(shap_values, list):
         # shap_values[i] is (n_samples, n_features)
         # We sum absolute values across classes, then average across samples
         shap_sum = np.abs(shap_values[0]).mean(0) 
         for i in range(1, len(shap_values)):
            shap_sum += np.abs(shap_values[i]).mean(0)
         shap_sum /= len(shap_values)
    else:
        # Array case: could be (n_samples, n_features) or (n_samples, n_features, n_outputs)
        if len(shap_values.shape) == 3:
             shap_sum = np.abs(shap_values).mean(2).mean(0)
        else:
             shap_sum = np.abs(shap_values).mean(0)
             
    # Strict flatten to ensure 1D
    shap_sum = np.array(shap_sum).flatten()
    
    # Safety check
    if len(shap_sum) != len(feature_cols):
        # Fallback to feature importance if shapes mismatch strangely
        return calculate_feature_importance(df, target_col, feature_cols).head(3), encoders
        
    shap_df = pd.DataFrame({'Feature': feature_cols, 'SHAP_Importance': shap_sum})
    shap_df = shap_df.sort_values(by='SHAP_Importance', ascending=False)
    
    return shap_df.head(3), encoders

def get_guideline(df, filters, target_col):
    """
    Generates a guideline based on the most frequent preference for the filtered group.
    
    filters: dict of {column_name: value} to filter the dataframe.
             Supports range filters for traits: {column_name: (min, max)}
    target_col: the UI preference column to analyze
    Returns: (recommendation_string, confidence_score, matching_count, stability_label, stability_score)
    """
    filtered_df = df.copy()
    
    # Apply filters
    for key, value in filters.items():
        if key in filtered_df.columns:
            if isinstance(value, tuple) and len(value) == 2:
                # Range filter (e.g., traits)
                filtered_df = filtered_df[
                    (filtered_df[key] >= value[0]) & (filtered_df[key] <= value[1])
                ]
            elif value is not None and value != "Any":
                # Categorical exact match
                filtered_df = filtered_df[filtered_df[key] == value]
            
    if filtered_df.empty:
        return "Not enough data", 0.0, 0, "Unknown", 0.0
    
    # Find most frequent value
    value_counts = filtered_df[target_col].value_counts()
    if value_counts.empty:
        return "Not enough data", 0.0, 0, "Unknown", 0.0
        
    top_choice = value_counts.idxmax()
    count = value_counts.max()
    total = len(filtered_df)
    confidence = count / total
    
    # Calculate Stability via Bootstrapping
    stability_score = calculate_stability(filtered_df, target_col, top_choice)
    
    if stability_score > 0.8:
        stability_label = "High Confidence"
    elif stability_score > 0.5:
        stability_label = "Moderate Confidence"
    else:
        stability_label = "Exploratory"
        
    return top_choice, confidence, total, stability_label, stability_score

def calculate_stability(df, target_col, current_best, n_iterations=20):
    """
    Resamples the data and checks how often the current_best choice remains the winner.
    """
    if len(df) < 5:
        return 0.0 # Too few samples to be stable
        
    matches = 0
    for i in range(n_iterations):
        # Bootstrap sample
        sample = resample(df, replace=True, n_samples=len(df), random_state=i)
        if sample[target_col].dropna().empty:
            continue
        # Check winner
        winner = sample[target_col].value_counts().idxmax()
        if winner == current_best:
            matches += 1
            
    return matches / n_iterations

def cluster_ui_preferences(df, n_clusters=3):
    """
    Clusters users based on UI preferences to find 'UI Variants'.
    """
    _, _, _, targets = get_feature_groups()
    
    # Filter only targets present in df
    valid_targets = [t for t in targets if t in df.columns]
    
    # Prepare data for clustering
    X, _, encoders = preprocess_data(df, valid_targets)
    
    # KMeans
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    labels = kmeans.fit_predict(X)
    
    # Add cluster label to df
    clustered_df = df.copy()
    clustered_df['Cluster'] = labels
    
    return clustered_df, kmeans, encoders, valid_targets

def get_cluster_profile(df, cluster_id, feature_cols, target_cols):
    """
    Returns the dominant profile for a specific cluster.
    """
    cluster_data = df[df['Cluster'] == cluster_id]
    
    profile = {}
    
    # Most common categorical features
    for col in feature_cols:
        if col in df.columns:
             profile[col] = cluster_data[col].mode()[0] if not cluster_data[col].mode().empty else "N/A"
             
    # Average numerical features (traits)
    # Assuming traits are numerical or already encoded? Use mode for simplicity if categorical in source
    # The prompt implies traits are existing columns.
    
    # Most common UI choices (The "Bundle")
    ui_bundle = {}
    for col in target_cols:
        if col in df.columns:
             ui_bundle[col] = cluster_data[col].mode()[0] if not cluster_data[col].mode().empty else "N/A"
             
    return profile, ui_bundle, len(cluster_data)

def get_top_personas(df, n=4):
    """
    Returns the top n personas from the dataset based on frequency.
    If n is None or 0, returns all personas.
    """
    if 'primary_persona' not in df.columns:
        return []
    
    counts = df['primary_persona'].value_counts()
    if n and n > 0:
        return counts.head(n).index.tolist()
    else:
        return counts.index.tolist()

def get_persona_preferences(df, persona, target_cols):
    """
    Returns the dominant UI preferences for a specific persona.
    Also returns the count of users in this persona group.
    """
    if 'primary_persona' not in df.columns:
        return {}, 0
        
    persona_df = df[df['primary_persona'] == persona]
    count = len(persona_df)
    
    if count == 0:
        return {}, 0
        
    preferences = {}
    for col in target_cols:
        if col in df.columns:
            # Get the most frequent value
            mode_val = persona_df[col].mode()
            preferences[col] = mode_val[0] if not mode_val.empty else "N/A"
            
    return preferences, count

def get_persona_traits(df, persona):
    """
    Returns a summary of distinctive traits for a persona.
    This calculates the average of numerical traits for the persona group.
    """
    if 'primary_persona' not in df.columns:
        return {}
        
    persona_df = df[df['primary_persona'] == persona]
    if persona_df.empty:
        return {}
        
    _, _, traits, _ = get_feature_groups()
    valid_traits = [t for t in traits if t in df.columns]
    
    trait_summary = {}
    for trait in valid_traits:
        # Assuming traits are numerical (1-7), get the mean
        # If categorical, getting mode might be better
        if pd.api.types.is_numeric_dtype(df[trait]):
            trait_summary[trait] = persona_df[trait].mean()
        else:
            mode_val = persona_df[trait].mode()
            trait_summary[trait] = mode_val[0] if not mode_val.empty else "N/A"
            
    return trait_summary

def calculate_bfi10_scores(df):
    """
    Calculates standard Big Five Inventory (BFI-10) composite factor scores (1-5 Likert scale)
    based on the 10 item survey responses.
    
    Formula (Rammstedt & John, 2007):
    - Extraversion = (Extraversion + (6 - Introversion)) / 2
    - Agreeableness = (Trust + (6 - Agreeableness_Reverse)) / 2
    - Conscientiousness = (Conscientiousness + (6 - Low_Conscientiousness)) / 2
    - Emotional Stability = (Emotional_Stability + (6 - Neuroticism)) / 2
    - Openness = (Openness + (6 - Low_Openness)) / 2
    """
    data = df.copy()
    
    # Verify items exist
    if 'trait_extraversion' in data.columns and 'trait_introversion' in data.columns:
        data['BFI_Extraversion'] = (data['trait_extraversion'] + (6 - data['trait_introversion'])) / 2.0
    if 'trait_trust' in data.columns and 'trait_agreeableness_reverse' in data.columns:
        data['BFI_Agreeableness'] = (data['trait_trust'] + (6 - data['trait_agreeableness_reverse'])) / 2.0
    if 'trait_conscientiousness' in data.columns and 'trait_low_conscientiousness' in data.columns:
        data['BFI_Conscientiousness'] = (data['trait_conscientiousness'] + (6 - data['trait_low_conscientiousness'])) / 2.0
    if 'trait_emotional_stability' in data.columns and 'trait_neuroticism' in data.columns:
        data['BFI_Emotional_Stability'] = (data['trait_emotional_stability'] + (6 - data['trait_neuroticism'])) / 2.0
    if 'trait_openness' in data.columns and 'trait_low_openness' in data.columns:
        data['BFI_Openness'] = (data['trait_openness'] + (6 - data['trait_low_openness'])) / 2.0
        
    return data

