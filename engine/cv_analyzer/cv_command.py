import os
import eel
import base64
import tempfile
from engine.cv_analyzer.analyzer import extract_pdf_text, calculate_similarity_bert, get_report, extract_scores


@eel.expose
def analyze_resume(base64_pdf, job_description):
    try:
        pdf_data = base64.b64decode(base64_pdf.split(',')[1])
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(pdf_data)
            tmp_path = tmp.name

        resume_text = extract_pdf_text(tmp_path)
        ats_score = calculate_similarity_bert(resume_text, job_description)
        report = get_report(resume_text, job_description)
        report_scores = extract_scores(report)
        avg_score = sum(report_scores) / (5*len(report_scores))
        
        os.unlink(tmp_path)
        print("[DEBUG] Returned Data:", {'ats_score': float(ats_score), 'avg_score': avg_score}) 
        return {
            'ats_score': float(ats_score),
            'avg_score': avg_score,
            'report': report
        }
    
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }
