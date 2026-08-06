import streamlit as st

st.set_page_config(layout="wide")

st.title("Methodology & What’s New")

st.markdown("""
## **Research-Focused Guideline Extraction**

This tool is part of a Master’s thesis on **data-driven adaptive e-commerce UI design**. 
Unlike traditional rule-based adaptation, this system derives design choices empirically from user data.

---

### **1. Core Concept: Data-Driven vs. Manual Customization**

- **Manual Customization:** Users explicitly choose "Dark Mode" or "Large Font". High cognitive load.
- **Intelligent Adaptation:** The system infers optimal designs based on user persona, mood, and traits. Zero configuration.

### **2. The Pipeline**

The system follows a 5-step process to generate guidelines:

```mermaid
graph LR
    A[Survey Data] --> B(Preference Clustering)
    A --> C(Feature Importance)
    B --> D[UI Variant Definition]
    C --> E[Local Explainability]
    D --> F[Adaptive UI Guidelines]
    E --> F
```

### **3. Machine Learning Approach**

#### **Why Random Forest?**
We use **Random Forest Classifiers** for each UI element because:
1.  **Non-Linearity:** User preferences (e.g., Font Size) depend on complex interactions between Age, Mood, and Traits.
2.  **Feature Importance:** RF provides interpretability, allowing us to see *which* user attributes drive specific design choices.
3.  **Robustness:** Handles categorical data (Mood, Persona) well without excessive preprocessing.

#### **Feature Importance & SHAP**
- **Global Importance:** Which traits matter most overall? (e.g., "Introversion drives Layout Density").
- **Local Explanation (SHAP):** Why did we recommend *this specific* button style for *this specific* user?

### **4. UI Variants Discovery**
Instead of manually creating "The Minimalist Theme", we use **Clustering (K-Means)** on the UI preference data to find natural groupings.
- **Cluster centers** become our "UI Variants".
- This ensures variants represent **actual user bundles**, not just designer assumptions.

---

### **New Features in This Version**
- **Context Filters:** Filter by specific trait ranges and moods.
- **Guideline Confidence:** Metrics (Support, Stability) to validate recommendations.
- **UI Variant Labeling:** Dynamic naming of the resultant design system.
- **Explainability Panel:** Interaction-level justification for every design rule.
- **Device Awareness:** Distinct mobile vs. desktop guidelines.

""", unsafe_allow_html=True)
