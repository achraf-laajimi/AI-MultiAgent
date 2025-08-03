import requests
import eel
import base64

@eel.expose
def get_image_data(image_url):
    """
    Handle image data requests - CloudFront URLs will fail gracefully to trigger direct download UI
    """
    print(f"Image request for: {image_url}")
    
    # For CloudFront URLs, return failure immediately to trigger direct download UI
    if 'cloudfront.net' in image_url:
        print("CloudFront URL detected - returning failure to trigger direct download UI")
        return {
            'success': False,
            'error': 'CloudFront URL - using direct download approach'
        }
    
    # For other URLs, try a simple fetch
    try:
        response = requests.get(image_url, timeout=30)
        
        if response.status_code == 200:
            image_content = response.content
            content_type = response.headers.get('content-type', 'image/png')
            
            image_data = base64.b64encode(image_content).decode('utf-8')
            data_url = f"data:{content_type};base64,{image_data}"
            
            print(f"Success: {len(image_content)} bytes")
            return {
                'success': True,
                'data_url': data_url,
                'base64': image_data,
                'content_type': content_type,
                'size': len(image_content)
            }
        else:
            raise Exception(f"HTTP {response.status_code}")
            
    except Exception as e:
        print(f"Image fetch failed: {e}")
        return {
            'success': False,
            'error': f"Failed to fetch image: {str(e)}"
        }
