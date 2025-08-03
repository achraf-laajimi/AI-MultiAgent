import ollama
import requests
import psutil
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from diskcache import Cache
import time

# Configuration
CACHE_DIR = './.web_cache'
MAX_RAM_USAGE = 0.7  # 70% of total RAM
MODEL_PRIORITY = ['llama3', 'neural-chat']  # Fallback order
WEB_SEARCH_TIMEOUT = 8  # seconds
SUMMARY_LENGTH = 2  # sentences

# Initialize systems
cache = Cache(CACHE_DIR)
ollama_client = ollama.Client()

class ModelManager:
    """Intelligent model load balancer"""
    def __init__(self):
        self.available_models = self._detect_models()
        self.model_weights = {
            'llama3': {'speed': 0.9, 'accuracy': 0.7},
            'neural-chat': {'speed': 0.7, 'accuracy': 0.9}
        }
    
    def _detect_models(self):
        """Check which models are installed"""
        available = []
        for model in MODEL_PRIORITY:
            try:
                ollama_client.show(model)
                available.append(model)
            except:
                continue
        return available or ['llama3']  # Fallback

    def get_best_model(self, query):
        """Select model based on query complexity and system resources"""
        mem = psutil.virtual_memory()
        if mem.used > MAX_RAM_USAGE * mem.total:
            return self.available_models[0]  # Use lightest model
        
        # Analyze query
        is_complex = (len(query.split()) > 10 or \
                    any(x in query.lower() for x in ['explain', 'describe', 'why']))
        
        for model in self.available_models:
            if is_complex and 'neural' in model:
                return model
        return self.available_models[0]

model_manager = ModelManager()

@cache.memoize(expire=86400)
def get_ollama_response(query, model=None, max_tokens=150):
    """Safe model query with automatic fallback"""
    selected_model = model or model_manager.get_best_model(query)
    try:
        response = ollama_client.generate(
            model=selected_model,
            prompt=f"You are a helpful assistant, answer concisely ({max_tokens} tokens max): {query}",
            options={
                'num_predict': max_tokens,
                'temperature': 0.7
            },
            stream=False
        )
        return response['response'].strip(), selected_model
    except Exception as e:
        print(f"Model error ({selected_model}): {e}")
        if model is None and len(model_manager.available_models) > 1:
            return get_ollama_response(query, model_manager.available_models[1], max_tokens)
        return "I'm having trouble processing that.", None

def smart_web_search(query):
    """Web research with domain whitelisting"""
    try:
        # Generate focused search query
        search_prompt = f"""Create a 3-5 word web search to answer: "{query}"\nQuery:"""
        search_terms, _ = get_ollama_response(search_prompt, max_tokens=30)
        search_terms = search_terms.replace('"', '').strip() or query.replace(" ", "+")
        
        # Get results from DuckDuckGo
        ddg_url = f"https://html.duckduckgo.com/html/?q={search_terms}"
        headers = {'User-Agent': 'Assisto-AI/1.0 (+https://github.com/your-repo)'}
        
        with requests.Session() as session:
            response = session.get(ddg_url, headers=headers, timeout=WEB_SEARCH_TIMEOUT)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract and validate links
            domains = ['wikipedia.org', 'britannica.com', 'history.com']
            results = []
            for result in soup.select('.result__url')[:5]:  # Top 5 results
                url = result['href']
                if any(domain in url for domain in domains):
                    results.append(url)
                if len(results) >= 3:  # We only need 3 good ones
                    break
            return results
            
    except Exception as e:
        print(f"Search failed: {e}")
        return []

def get_page_summary(url):
    """Fast content extraction with error handling"""
    try:
        start_time = time.time()
        with requests.get(url, timeout=WEB_SEARCH_TIMEOUT) as response:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Domain-specific extraction
            if 'wikipedia.org' in url:
                content = soup.find('div', {'id': 'mw-content-text'})
            elif 'britannica.com' in url:
                content = soup.find('div', {'class': 'topic-body'})
            else:
                content = soup.find('article') or soup.find('main') or soup

            paragraphs = [p.get_text().strip() 
                         for p in content.find_all('p') 
                         if 50 < len(p.get_text().strip()) < 500][:5]  # First 5 good paragraphs
            
            if not paragraphs:
                return None
                
            clean_text = '\n'.join(paragraphs)[:2000]  # Limit input size
            
            # Get summary using fastest available model
            summary, _ = get_ollama_response(
                f"Summarize in {SUMMARY_LENGTH} sentences: {clean_text[:1000]}",
                max_tokens=100
            )
            
            print(f"Processed {url} in {time.time()-start_time:.2f}s")
            return summary if summary else None
            
    except Exception as e:
        print(f"Failed to process {url}: {e}")
        return None

def hybrid_responder(query):
    """Full pipeline with resource monitoring"""
    # Stage 1: Local response attempt
    local_response, used_model = get_ollama_response(query)
    if not any(x in local_response.lower() for x in ["don't know", "not sure", "no information"]):
        return local_response
    
    # Stage 2: Web augmentation (only if sufficient resources)
    mem = psutil.virtual_memory()
    if mem.available < 2 * 1024**3:  # Less than 2GB available
        return "I need to conserve resources right now. Please ask again later."
    
    print(f"Attempting web research for: {query}")
    try:
        with ThreadPoolExecutor(max_workers=2) as executor:  # Conservative
            urls = smart_web_search(query)
            if not urls:
                return local_response  # Fallback to original response
            
            # Process top URLs with timeout
            future_to_url = {
                executor.submit(get_page_summary, url): url 
                for url in urls[:3]  # Only process top 3
            }
            
            valid_summaries = []
            for future in as_completed(future_to_url, timeout=WEB_SEARCH_TIMEOUT+2):
                if summary := future.result():
                    valid_summaries.append(summary)
                    if len(valid_summaries) >= 2:  # We only need 2 good summaries
                        break
            
            if valid_summaries:
                context = "\n".join(f"- {s}" for s in valid_summaries)
                refined, _ = get_ollama_response(
                    f"Using these facts:\n{context}\n\nAnswer concisely: {query}",
                    max_tokens=200
                )
                return refined if refined else local_response
    
    except Exception as e:
        print(f"Web research failed: {e}")
    
    return local_response  # Fallback to original response