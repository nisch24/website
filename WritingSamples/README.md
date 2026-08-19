# Undergraduate Writing Samples

This directory stores the PDF documents for the **Undergraduate Writing Samples** section on your portfolio website.

## How It Works
Each of the 6 samples on the website can link to **1 or 2 PDFs**:
- **PDF 1 (Primary Document):** e.g., Full Paper, Thesis, Technical Report, or Manuscript
- **PDF 2 (Secondary Document - Optional):** e.g., Supplementary Appendix, Slide Deck, Code Analysis, or Executive Summary

---

## Suggested File Naming Conventions

### Sample 1: Statistical Inference & Markov Chains
- `Sample1_Markov_Chains_Research_Paper.pdf` (Primary Paper)
- `Sample1_Supplementary_Analysis.pdf` (Supplemental / Appendix)

### Sample 2: Applied Regression & Deep Learning in Healthcare
- `Sample2_Diabetic_Retinopathy_Study.pdf` (Primary Paper)
- `Sample2_Model_Evaluation_Report.pdf` (Supplemental / Appendix)

### Sample 3: Financial Econometrics & Volatility Forecasting
- `Sample3_Financial_Volatility_Forecasting.pdf` (Primary Paper)
- `Sample3_Technical_Appendix.pdf` (Supplemental / Appendix)

### Sample 4: Autonomous Systems & Simulation Technical Report
- `Sample4_AV_Simulation_Technical_Report.pdf` (Primary Report)
- `Sample4_System_Architecture_Spec.pdf` (Supplemental / Appendix)

### Sample 5: Computer Architecture & Pipelined CPU Design
- `Sample5_Pipelined_CPU_Design_Report.pdf` (Primary Report)
- `Sample5_Verification_Testbench_Report.pdf` (Supplemental / Appendix)

### Sample 6: Computational Biology & Statistical Analysis
- `Sample6_Computational_Biology_Report.pdf` (Primary Paper)
- `Sample6_Supplementary_Data.pdf` (Supplemental / Appendix)

---

## How to Update Your PDFs
1. Place your PDF files directly into this `WritingSamples` folder.
2. In `index.html`, check the `<section id="writing-samples">` section.
3. Update the `href="WritingSamples/YOUR_FILE_NAME.pdf"` attribute to match your file name.
4. If a sample only has **1 PDF**, simply remove or comment out the second button (`btn-link-secondary`).
