# Adaptive Profile Builder Summary

## Inputs
- Notebook 03: statistical validation (Cramér's V)
- Notebook 04: Random Forest importance + SHAP
- Notebook 05: candidate context→UI profiles and association rules

## Adaptation Evidence Weights
- Statistical Evidence: 20%
- Feature Importance: 25%
- SHAP: 20%
- Confidence: 20%
- Lift: 15%

## Results
- Candidate profiles scored: 426
- Profiles kept (Very Strong + Strong + Moderate): 80
- Profiles removed (Weak): 346
- Average profile score (all): 0.493
- Average profile score (kept): 0.594

## Strength Distribution
- Very Strong: 0
- Strong: 0
- Moderate: 80
- Weak: 346

## Evidence Contribution (Weighted Averages)
- Statistical Evidence: 0.112 (weight=20%, avg norm=0.559)
- Feature Importance: 0.202 (weight=25%, avg norm=0.807)
- SHAP: 0.057 (weight=20%, avg norm=0.283)
- Confidence: 0.072 (weight=20%, avg norm=0.360)
- Lift: 0.026 (weight=15%, avg norm=0.171)

## Top 10 Profiles
- **Neuroticism=Low, Persona=Deal Hunter** — score=0.685, Moderate, 2 adaptations, 3 rules
- **Agreeableness=High, Mood=Neutral, Persona=Researcher** — score=0.685, Moderate, 1 adaptations, 1 rules
- **Agreeableness=High, Conscientiousness=High, Device=Smartphone, Mood=Neutral, Neuroticism=Low** — score=0.669, Moderate, 1 adaptations, 1 rules
- **Agreeableness=High, Conscientiousness=High, Mood=Neutral, Neuroticism=Low** — score=0.669, Moderate, 1 adaptations, 1 rules
- **Conscientiousness=High, Device=Smartphone, Mood=Relaxed** — score=0.669, Moderate, 1 adaptations, 1 rules
- **Conscientiousness=High, Device=Smartphone, Mood=Neutral, Neuroticism=Low** — score=0.667, Moderate, 2 adaptations, 2 rules
- **Conscientiousness=Medium, Neuroticism=Medium, Persona=Researcher** — score=0.663, Moderate, 1 adaptations, 1 rules
- **Extraversion=Medium, Persona=Deal Hunter** — score=0.648, Moderate, 1 adaptations, 1 rules
- **Conscientiousness=Medium, Openness=Low** — score=0.641, Moderate, 4 adaptations, 7 rules
- **Agreeableness=Low, Neuroticism=Low** — score=0.641, Moderate, 1 adaptations, 1 rules