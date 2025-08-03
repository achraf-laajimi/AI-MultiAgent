$(document).ready(function() {
    $('.text').textillate({
        loop: true,
        sync: true,
        in: {
            effect: "bounceIn",
        },
        out: {
            effect: "bounceOut",
        },
        
    });
    
    var siriWave = new SiriWave({
        container: document.getElementById("siri-container"),
        width: 800,
        height: 200,
        style: "ios9",
        amplitude: "1",
        speed: "0.30",
        autostart: true
    });
    
    

    
    // Direct browser download function for shadows, packshots, HD images, erase foreground
    window.downloadImageDirect = async function(url, filename) {
        try {
            // Always use fetch and blob URL for reliable downloads
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            // Create a temporary link element for direct download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'download.png';
            link.style.display = 'none';
            
            // Add to DOM, click, and remove
            document.body.appendChild(link);
            link.click();
            
            // Clean up after a short delay
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
                URL.revokeObjectURL(blobUrl);
            }, 100);
            
            console.log('Direct download completed for:', url);
            
        } catch (error) {
            console.error('Direct download failed:', error);
            alert('Download failed: ' + error.message);
        }
    };

    // New tab download function for lifestyle shots and generative fill
    window.downloadImageNewTab = function(url) {
        console.log('Opening image in new tab for download:', url);
        window.open(url, '_blank');
    };
    
    // Copy URL to clipboard function
    window.copyToClipboard = async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            // Show success feedback
            const toast = $(`
                <div class="position-fixed top-0 end-0 p-3" style="z-index: 1060;">
                    <div class="toast show" role="alert">
                        <div class="toast-header">
                            <i class="bi bi-check-circle text-success me-2"></i>
                            <strong class="me-auto">Copied!</strong>
                        </div>
                        <div class="toast-body">
                            Image URL copied to clipboard
                        </div>
                    </div>
                </div>
            `);
            $('body').append(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error) {
            console.error('Copy failed:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('URL copied to clipboard!');
        }
    };
    
    // Event delegation with better error handling
    $(document).on('click', '.download-btn', function() {
        const url = $(this).data('url');
        const filename = $(this).data('filename') || `image_${Date.now()}.png`;
        
        if (!url) {
            console.error('No URL found for download');
            alert('Download failed: No image URL available');
            return;
        }
        
        // Show download feedback
        const $btn = $(this);
        const originalText = $btn.html();
        const originalClass = $btn.attr('class');
        
        // Update button to show downloading state
        $btn.html('<i class="bi bi-hourglass"></i> Downloading...')
            .removeClass('btn-primary')
            .addClass('btn-secondary')
            .prop('disabled', true);
        
        // Use direct download method for browser downloads
        downloadImageDirect(url, filename).finally(() => {
            // Restore button after delay
            setTimeout(() => {
                $btn.html(originalText)
                    .attr('class', originalClass)
                    .prop('disabled', false);
            }, 3000);
        });
    });

        $("#MicBtn").click(function() {
            $("#Oval").attr("hidden", true);
            $("#SiriWave").attr("hidden", false);
            eel.playClickSound();
            eel.allCommands()();
        });

        $("#mainCircleBtn").click(function(e) {
            e.stopPropagation();
            $(".nav-container").toggleClass("active");
        });
        
        // Close menu when clicking anywhere else
        $(document).click(function() {
            $(".nav-container").removeClass("active");
        });
        
        // Prevent menu close when clicking on sub-buttons
        $(".sub-buttons").click(function(e) {
            e.stopPropagation();
        });

    /* resume analyzer */
    function showResumeAnalyzer() {
        $("#Oval").attr("hidden", true);
        $("#SiriWave").attr("hidden", true);
        $("#ResumeAnalyzer").attr("hidden", false);
    }
    function hideResumeAnalyzer() {
        $("#ResumeAnalyzer").attr("hidden", true);
        $("#Oval").attr("hidden", false);
    }

    $(".btn-resume").click(function() {
        hideResumeAnalyzer();
    });
    
    $("#option1Btn").click(function() {
        showResumeAnalyzer();
    });
    
    $("#new-analysis").click(function() {
        $("#resume-results-container").hide();
        $("#resume-form-container").show();
        $("#resume-analyzer-form")[0].reset();
    });
    
    $("#resume-analyzer-form").submit(async function(e) {
        e.preventDefault();
        
        const fileInput = $("#resume-upload")[0];
        const jobDesc = $("#job-description").val();
        
        if (!fileInput.files.length || !jobDesc.trim()) {
            alert("Please upload a resume and enter a job description");
            return;
        }
        
        $("#resume-form-container").hide();
        $("#resume-loading").show();
        
        try {
            const file = fileInput.files[0];
            const base64 = await readFileAsBase64(file);
            
            const result = await eel.analyze_resume(base64, jobDesc)();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            displayResults(result);
            
        } catch (error) {
            console.error("Analysis error:", error);
            alert("Analysis failed: " + error.message);
            resetForm();
        }
    });
    
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    function displayResults(result) {
        const atsScore = result.ats_score ? result.ats_score.toFixed(2) : "0.00";
        const aiScore = result.avg_score ? result.avg_score.toFixed(2) : "0.00";
        const reportContent = result.report ? result.report.replace(/\n/g, '<br>') : "No analysis available";
        
        $("#ats-score").text(atsScore);
        $("#ai-score").text(aiScore);
        $("#ai-report").html(reportContent);
        
        $("#resume-loading").hide();
        $("#resume-results-container").show();
    }
    
    function resetForm() {
        $("#resume-loading").hide();
        $("#resume-results-container").hide();
        $("#resume-form-container").show();
    }

    /*    Image generator functionality     */
    function showImageGenerator() {
        $("#Oval").attr("hidden", true);
        $("#SiriWave").attr("hidden", true);
        $("#ResumeAnalyzer").attr("hidden", true);
        $("#AdSnapStudio").attr("hidden", false);
        
        // Initialize canvas when shown
        initCanvas();
    }

    function showMainInterface() {
        $("#AdSnapStudio").attr("hidden", true);
        $("#Oval").attr("hidden", false);
    }

    $(".btn-image").click(function() {
        showMainInterface();
    });

    // Add this to your existing click handlers
    $("#option2Btn").click(function() {
        showImageGenerator();
    });

    function initCanvas() {
        // Initialize both canvases
        const fillCanvas = document.getElementById('fill-canvas');
        const eraseCanvas = document.getElementById('erase-canvas');
        
        // Set up drawing context for both canvases
        const fillCtx = fillCanvas.getContext('2d');
        const eraseCtx = eraseCanvas.getContext('2d');
        
        // Set up drawing state
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        
        // Get canvas position function
        function getCanvasPos(canvas, evt) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
                y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
            };
        }
        
        // Common drawing function
        function draw(e, ctx, canvas) {
            if (!isDrawing) return;
            
            // Get correct canvas position
            const pos = getCanvasPos(canvas, e);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = parseInt($('#brush-size').val());
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            
            [lastX, lastY] = [pos.x, pos.y];
        }
        
        // Fill canvas events
        fillCanvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const pos = getCanvasPos(fillCanvas, e);
            [lastX, lastY] = [pos.x, pos.y];
        });
        
        fillCanvas.addEventListener('mousemove', (e) => draw(e, fillCtx, fillCanvas));
        fillCanvas.addEventListener('mouseup', () => isDrawing = false);
        fillCanvas.addEventListener('mouseout', () => isDrawing = false);
        
        // Erase canvas events
        eraseCanvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const pos = getCanvasPos(eraseCanvas, e);
            [lastX, lastY] = [pos.x, pos.y];
        });
        
        eraseCanvas.addEventListener('mousemove', (e) => draw(e, eraseCtx, eraseCanvas));
        eraseCanvas.addEventListener('mouseup', () => isDrawing = false);
        eraseCanvas.addEventListener('mouseout', () => isDrawing = false);
    }

    // Image upload handler - add null checks
    $('#product-upload ,#fill-upload ,#erase-upload, #reference-upload').change(function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvasId = e.target.id.replace('upload', 'canvas');
                const canvas = document.getElementById(canvasId);
                
                // Add null check
                if (!canvas) {
                    console.error(`Canvas element ${canvasId} not found`);
                    return;
                }

                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const containerId = e.target.id.replace('upload', 'preview-container');
                $('#' + containerId).show();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Edit option switcher
    $('#edit-option').change(function() {
        $('.edit-options').hide();
        $('#' + $(this).val() + '-options').show();
    });

    // Shot type switcher
    $('input[name="shot-type"]').change(function() {
        if ($(this).val() === 'text') {
            $('#text-prompt-options').show();
            $('#reference-image-options').hide();
        } else {
            $('#text-prompt-options').hide();
            $('#reference-image-options').show();
        }
    });

    // Range input value displays
    $('input[type="range"]').on('input', function() {
        $('#' + this.id + '-value').text(this.value);
    });

    // Replace your current generate button click handler with this:
    $('#generate-images-btn').click(async function() {
        const prompt = $('#enhanced-prompt').text() || $('#prompt-input').val();
        const numImages = parseInt($('#num-images').val(), 10);
        const aspectRatio = $('#aspect-ratio').val();
        const style = $('#image-style').val();
        const enhanceQuality = $('#enhance-quality').is(':checked');
        
        if (!prompt) {
            alert('Please enter a prompt');
            return;
        }
        
        // Show loading state
        $('#generated-images-container').html(`
            <div style="text-align: center;">
                <p class="mt-2">Generating your images<span class="loading-dots">...</span></p>
            </div>
        `);
        
        // Animate the loading dots
        let dotCount = 3;
        const loadingInterval = setInterval(() => {
            dotCount = dotCount === 3 ? 1 : dotCount + 1;
            const dots = '.'.repeat(dotCount);
            $('.loading-dots').text(dots);
        }, 500);
        
        try {
            // Map style to medium parameter
            const medium = style === "Realistic" ? "photography" : "art";
            
            // Call the HD image function
            const result = await eel.generate_hd_image(
                prompt,               // prompt
                "2.2",               // model_version
                numImages,            // num_results
                aspectRatio,          // aspect_ratio
                true,                 // sync
                undefined,            // seed
                "",                   // negative_prompt
                undefined,            // steps_num
                undefined,            // text_guidance_scale
                medium,               // medium
                false,                // prompt_enhancement (we do this separately)
                enhanceQuality        // enhance_image
            )();
            
            // Clear loading animation
            clearInterval(loadingInterval);
            
            // Display results
            displayGeneratedImages(result);
        } catch (error) {
            // Clear loading animation on error too
            clearInterval(loadingInterval);
            console.error('Generation error:', error);
            $('#generated-images-container').html(`
                <div class="alert alert-danger">
                    Error generating images: ${error.message}
                </div>
            `);
        }
    });

    // Update your display function to handle the HD image response format
    function displayGeneratedImages(result) {
        if (!result || !result.urls || result.urls.length === 0) {
            $('#generated-images-container').html(`
                <div class="alert alert-warning">
                    No images were generated. Please try again.
                </div>
            `);
            return;
        }
        
        let html = '<div class="image-grid">';
        
        result.urls.forEach((url, index) => {
            // HD images always use direct browser download
            html += `
                <div class="image-card">
                    <img src="${url}" alt="Generated image ${index + 1}">
                    <button class="btn btn-primary download-btn" 
                        data-url="${url}" data-filename="generated_${index + 1}.png">
                        <i class="bi bi-download"></i> Download
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        $('#generated-images-container').html(html);
    }

    // Enhance prompt function - no API key needed
    $('#enhance-prompt-btn').click(async function() {
        const prompt = $('#prompt-input').val();
        const style = $('#image-style').val();
        const styledPrompt = style && style !== 'Realistic' ? `${style} style: ${prompt}` : prompt;

        if (!prompt) {
            alert('Please enter a prompt to enhance');
            return;
        }

        try {
            // Show loading state
            $('#enhanced-prompt').html('<i class="bi bi-hourglass"></i> Enhancing...');
            $('#enhanced-prompt-container').show();

            // Call Python function (API key handled internally)
            const enhanced = await eel.enhance_prompt(styledPrompt)();

            // Display result
            $('#enhanced-prompt').text(enhanced);

        } catch (error) {
            console.error('Prompt enhancement error:', error);
            $('#enhanced-prompt').text(prompt); // Fallback to original
            alert('Enhancement failed - using original prompt');
        }
    });

    // Use enhanced prompt
    $('#use-enhanced-prompt').click(function() {
        $('#prompt-input').val($('#enhanced-prompt').text());
        $('#enhanced-prompt-container').hide();
    });

    // Add Shadow function
    $('#add-shadow-btn').click(async function() {
        const shadowType = $('#shadow-type').val();
        const bgColor = $('#bg-color').val() || null;
        const shadowColor = $('#shadow-color').val();
        const offsetX = parseInt($('#offset-x').val());
        const offsetY = parseInt($('#offset-y').val());
        const shadowIntensity = parseInt($('#shadow-intensity').val());
        const shadowBlur = parseInt($('#shadow-blur').val()) || null;
        const sku = $('#sku').val() || null;
        const forceRmbg = $('#force-rmbg').is(':checked');
        const contentModeration = $('#content-moderation').is(':checked');
        
        // Get image data
        const fileInput = document.getElementById('product-upload');
        if (!fileInput.files || !fileInput.files[0]) {
            alert('Please upload a product image first');
            return;
        }
        
        // Show loading state
        $('#lifestyle-result-container').html(`
            <div style="text-align: center;">
                <p class="mt-2">Adding shadow effect<span class="loading-dots">...</span></p>
            </div>
        `);
        
        // Animate the loading dots
        let dotCount = 3;
        const shadowLoadingInterval = setInterval(() => {
            dotCount = dotCount === 3 ? 1 : dotCount + 1;
            const dots = '.'.repeat(dotCount);
            $('.loading-dots').text(dots);
        }, 500);
        
        try {
            // Read file as ArrayBuffer
            const file = fileInput.files[0];
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            
            // Call Python function via Eel
            const result = await eel.add_shadow(
                Array.from(bytes), // Convert Uint8Array to regular array
                null, // image_url (not used)
                shadowType,
                bgColor,
                shadowColor,
                [offsetX, offsetY],
                shadowIntensity,
                shadowBlur,
                null, // shadow_width (not used)
                null, // shadow_height (not used)
                sku,
                forceRmbg,
                contentModeration
            )();
            
            // Display result
            if (result && result.result_url) {
                // Clear loading animation
                clearInterval(shadowLoadingInterval);
                
                // Shadow effects always use direct browser download
                $('#lifestyle-result-container').html(`
                    <div class="text-center">
                        <h5 class="mb-3">Shadow Effect Complete!</h5>
                        <img src="${result.result_url}" class="img-fluid rounded mb-3" alt="Shadow result">
                        <div class="mb-2">
                            <button class="btn btn-primary download-btn" 
                                    data-url="${result.result_url}" 
                                    data-filename="shadow_effect.png">
                                <i class="bi bi-download"></i> Download Image
                            </button>
                        </div>
                        <div class="mb-2">
                            <button class="btn btn-secondary" onclick="copyToClipboard('${result.result_url}')">
                                <i class="bi bi-clipboard"></i> Copy URL
                            </button>
                        </div>
                        <small class="text-muted">Copy URL if download fails</small>
                    </div>
                `);
            } else {
                throw new Error('No result URL returned from API');
            }
        } catch (error) {
            // Clear loading animation on error too
            clearInterval(shadowLoadingInterval);
            console.error('Shadow error:', error);
            $('#lifestyle-result-container').html(`
                <div class="alert alert-danger">
                    Error adding shadow: ${error.message}
                </div>
            `);
        }
    });

    // Create Packshot function
    $('#create-packshot-btn').click(async function() {
        // Get form values
        const bgColor = $('#bg-color').val();
        const sku = $('#sku').val() || null; // Convert empty string to null
        const forceRmbg = $('#force-rmbg').is(':checked');
        const contentModeration = $('#content-moderation').is(':checked');
        
        // Get uploaded image
        const fileInput = document.getElementById('product-upload');
        if (!fileInput.files || !fileInput.files[0]) {
            alert('Please upload a product image first');
            return;
        }
        
        // Show loading state
        $('#lifestyle-result-container').html(`
            <div style="text-align: center;">
                <p class="mt-2">Creating professional packshot<span class="loading-dots">...</span></p>
            </div>
        `);
        
        // Animate the loading dots
        let dotCount = 3;
        const packshotLoadingInterval = setInterval(() => {
            dotCount = dotCount === 3 ? 1 : dotCount + 1;
            const dots = '.'.repeat(dotCount);
            $('.loading-dots').text(dots);
        }, 500);

        try {
            // Read file as ArrayBuffer
            const file = fileInput.files[0];
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            
            // Call Python function via Eel
            const result = await eel.create_packshot(
                Array.from(bytes), // Convert Uint8Array to regular array
                bgColor,
                sku,
                forceRmbg,
                contentModeration
            )();
            
            // Display result
            if (result && result.result_url) {
                // Clear loading animation
                clearInterval(packshotLoadingInterval);
                
                // Packshots always use direct browser download
                $('#lifestyle-result-container').html(`
                    <div class="text-center">
                        <h5 class="mb-3">Packshot Created Successfully!</h5>
                        <img src="${result.result_url}" class="img-fluid rounded mb-3" 
                            alt="Packshot result" style="max-height: 500px;">
                        <div class="mb-2">
                            <button class="btn btn-primary download-btn" 
                                    data-url="${result.result_url}" 
                                    data-filename="packshot_${sku || 'product'}.png">
                                <i class="bi bi-download"></i> Download Packshot
                            </button>
                        </div>
                        <div class="mb-2">
                            <button class="btn btn-secondary" onclick="copyToClipboard('${result.result_url}')">
                                <i class="bi bi-clipboard"></i> Copy URL
                            </button>
                        </div>
                        <small class="text-muted">Copy URL if download fails</small>
                    </div>
                `);
            } else {
                throw new Error('No result URL returned from API');
            }
        } catch (error) {
            // Clear loading animation on error too
            clearInterval(packshotLoadingInterval);
            console.error('Packshot error:', error);
            $('#lifestyle-result-container').html(`
                <div class="alert alert-danger">
                    Error creating packshot: ${error.message}
                    <button class="btn btn-sm btn-outline-light mt-2 reset-packshot-btn">
                        Try Again
                    </button>
                </div>
            `);
        }
    });

    // Unified Lifestyle Shot button handler
    $('#generate-lifestyle-btn').click(async function() {
        const shotType = $('input[name="shot-type"]:checked').val();
        
        // Show loading state
        $('#lifestyle-result-container').html(`
            <div style="text-align: center;">
                <p class="mt-2">Generating lifestyle shot<span class="loading-dots">...</span></p>
            </div>
        `);
        
        // Animate the loading dots
        let dotCount = 3;
        const lifestyleLoadingInterval = setInterval(() => {
            dotCount = dotCount === 3 ? 1 : dotCount + 1;
            const dots = '.'.repeat(dotCount);
            $('.loading-dots').text(dots);
        }, 500);

        try {
            let result;
            if (shotType === 'text') {
                const sceneDesc = $('#scene-description').val() || '';
                const placementType = $('#placement-type').val() || 'original';
                const numResults = parseInt($('#num-results').val()) || 1;
                const syncMode = $('#sync-mode').is(':checked') || false;
                const fastMode = $('#fast-mode').is(':checked') || true;
                const optimizeDesc = $('#optimize-desc').is(':checked') || true;
                const originalQuality = $('#original-quality').is(':checked') || false;
                const excludeElements = fastMode ? null : $('#exclude-elements').val() || '';
                const shotWidth = parseInt($('#shot-width').val()) || 1000;
                const shotHeight = parseInt($('#shot-height').val()) || 1000;
                const forceRmbg = $('#force-rmbg').is(':checked') || false;
                const contentModeration = $('#content-moderation').is(':checked') || false;
                const sku = $('#sku').val() || null;

                const fileInput = document.getElementById('product-upload');
                if (!fileInput.files || !fileInput.files[0]) {
                    throw new Error('Please upload a product image first');
                }

                const file = fileInput.files[0];
                const arrayBuffer = await file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);

                result = await eel.lifestyle_shot_by_text(
                    Array.from(bytes),
                    sceneDesc,
                    placementType,
                    numResults,
                    syncMode,
                    fastMode,
                    optimizeDesc,
                    originalQuality,
                    excludeElements,
                    [shotWidth, shotHeight],
                    ["upper_left"],
                    [0, 0, 0, 0],
                    null,
                    null,
                    forceRmbg,
                    contentModeration,
                    sku
                )();
            } else if (shotType === 'image') {
                const placementType = $('#placement-type').val() || 'original';
                const numResults = parseInt($('#num-results').val()) || 1;
                const syncMode = $('#sync-mode').is(':checked') || false;
                const originalQuality = $('#original-quality').is(':checked') || false;
                const shotWidth = parseInt($('#shot-width').val()) || 1000;
                const shotHeight = parseInt($('#shot-height').val()) || 1000;
                const forceRmbg = $('#force-rmbg').is(':checked') || false;
                const contentModeration = $('#content-moderation').is(':checked') || false;
                const sku = $('#sku').val() || null;
                const enhanceRef = $('#enhance-ref').is(':checked') || true;
                const refInfluence = parseFloat($('#ref-influence').val()) || 1.0;

                const productFileInput = document.getElementById('product-upload');
                const refFileInput = document.getElementById('reference-upload');
                if (!productFileInput.files?.length || !refFileInput.files?.length) {
                    throw new Error('Please upload both product and reference images');
                }

                const productFile = productFileInput.files[0];
                const refFile = refFileInput.files[0];
                const productArrayBuffer = await productFile.arrayBuffer();
                const refArrayBuffer = await refFile.arrayBuffer();
                const productBytes = new Uint8Array(productArrayBuffer);
                const refBytes = new Uint8Array(refArrayBuffer);

                result = await eel.lifestyle_shot_by_image(
                    Array.from(productBytes),
                    Array.from(refBytes),
                    placementType,
                    numResults,
                    syncMode,
                    originalQuality,
                    [shotWidth, shotHeight],
                    ["upper_left"],
                    [0, 0, 0, 0],
                    null,
                    null,
                    forceRmbg,
                    contentModeration,
                    sku,
                    enhanceRef,
                    refInfluence
                )();
            }

            // Properly handle the response structure
            console.log('Lifestyle shot result:', result);
            if (result && result.result && Array.isArray(result.result) && result.result.length > 0) {
                // Clear loading animation
                clearInterval(lifestyleLoadingInterval);
                
                const firstResult = result.result[0];
                const imageUrl = firstResult[0];
                const filename = firstResult[2] || 'lifestyle-shot.png'; 

                $('#lifestyle-result-container').html(`
                    <div class="text-center">
                        <h5 class="mb-3">Lifestyle Shot Generated!</h5>
                        <div class="mb-2">
                            <button class="btn btn-success btn-lg" onclick="window.open('${imageUrl}', '_blank')">
                                <i class="bi bi-download"></i> Download Image
                            </button>
                        </div>
                        <div class="mb-2">
                            <button class="btn btn-secondary" onclick="copyToClipboard('${imageUrl}')">
                                <i class="bi bi-clipboard"></i> Copy URL
                            </button>
                        </div>
                        <small class="text-muted">Copy URL if download fails</small>
                    </div>
                `);
            } else {
                throw new Error('No valid result returned from API');
            }
        } catch (error) {
            // Clear loading animation on error too
            clearInterval(lifestyleLoadingInterval);
            console.error('Lifestyle shot error:', error);
            $('#lifestyle-result-container').html(`
                <div class="alert alert-danger">
                    Error generating lifestyle shot: ${error.message}
                </div>
            `);
        }
    });



    $(document).on('click', '#generate-fill-btn', async function(e) {
        e.preventDefault();
            
        // Get elements with null checks
        const $btn = $(this);
        const $resultContainer = $('#fill-result-container');
        const imageFileInput = document.getElementById('fill-upload');
        const canvas = document.getElementById('fill-canvas');
        
        // Add validation for null elements
        if (!imageFileInput) {
            alert('File input element not found');
            return;
        }
        
        if (!imageFileInput.files || !imageFileInput.files.length) {
            alert('Please upload a base image first');
            return;
        }
        
        if (!canvas) {
            alert('Please create a mask by drawing on the canvas');
            return;
        }
        
        const prompt = $('#fill-prompt').val().trim();
        if (!prompt) {
            alert('Please describe what to generate');
            return;
        }

        // Show loading state
        $btn.prop('disabled', true);
        $resultContainer.html(`
            <div style="text-align: center;">
                <p class="mt-2">Generating content<span class="loading-dots">...</span></p>
            </div>
        `);
        
        // Animate the loading dots
        let dotCount = 3;
        const fillLoadingInterval = setInterval(() => {
            dotCount = dotCount === 3 ? 1 : dotCount + 1;
            const dots = '.'.repeat(dotCount);
            $('.loading-dots').text(dots);
        }, 500);

        try {
            // Process files - use same image for both, but mask will be from canvas
            const [imageBytes, maskBytes] = await Promise.all([
                getFileBytes(imageFileInput.files[0]),
                getCanvasBytes('fill-canvas')
            ]);

            // API call
            const result = await eel.generative_fill(
                Array.from(imageBytes),
                Array.from(maskBytes),
                prompt,
                $('#negative-prompt').val().trim() || null,
                parseInt($('#num-variations').val()) || 1,
                $('#sync-mode').is(':checked'),
                $('#seed-value').val() ? parseInt($('#seed-value').val()) : null,
                $('#content-moderation').is(':checked'),
                "manual"
            )();

            // Handle response - fix parsing to match API response format
            console.log('Generative fill result:', result);
            
            // Try different response structures
            let imageUrl, filename;
            
            if (result?.result?.length) {
                // Format: {"result": [["url", seed, "filename"]]}
                const firstResult = result.result[0];
                imageUrl = firstResult[0];
                filename = firstResult[2] || 'generated_fill.png';
            } else if (result?.urls?.length) {
                // Format: {"urls": ["url1", "url2", ...]}
                imageUrl = result.urls[0];
                filename = 'generated_fill.png';
            } else if (result?.result_url) {
                // Format: {"result_url": "url"}
                imageUrl = result.result_url;
                filename = 'generated_fill.png';
            } else {
                throw new Error('No valid results returned from API');
            }
            
            // Clear loading animation
            clearInterval(fillLoadingInterval);
            
            displayResult(imageUrl, filename);
            
        } catch (error) {
            // Clear loading animation on error too
            clearInterval(fillLoadingInterval);
            console.error('Generation failed:', error);
            $resultContainer.html(`
                <div class="alert alert-danger">
                    ${error.message}
                </div>
            `);
        } finally {
            $btn.prop('disabled', false);
        }

        // Helper functions
        async function getFileBytes(file) {
            const arrayBuffer = await file.arrayBuffer();
            return new Uint8Array(arrayBuffer);
        }

        async function getCanvasBytes(canvasId) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) throw new Error('Please create a mask first');
            
            return new Promise(resolve => {
                canvas.toBlob(blob => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const binary = atob(reader.result.split(',')[1]);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) {
                            bytes[i] = binary.charCodeAt(i);
                        }
                        resolve(bytes);
                    };
                    reader.readAsDataURL(blob);
                }, 'image/png');
            });
        }

        function displayResult(url, filename) {
            // Generative fill always uses new tab method
            console.log('Generative fill - always using new tab method');
            
            $resultContainer.html(`
                <div class="text-center">
                    <h5 class="mb-3">Content Generated Successfully!</h5>
                    <p class="mb-3">Your generative fill is ready for download.</p>
                    <div class="mb-2">
                        <button class="btn btn-success btn-lg" onclick="window.open('${url}', '_blank')">
                            <i class="bi bi-download"></i> Download Generated Image
                        </button>
                    </div>
                    <div class="mb-2">
                        <button class="btn btn-secondary" onclick="copyToClipboard('${url}')">
                            <i class="bi bi-clipboard"></i> Copy URL
                        </button>
                    </div>
                    <small class="text-muted">Copy URL if download fails</small>
                </div>
            `);
        }
    });

    // Initialize canvas when tab is shown
    $('a[data-bs-toggle="tab"][href="#fill"]').on('shown.bs.tab', function() {
        const canvas = document.getElementById('fill-canvas');
        if (!canvas) return;
        
        // Set up drawing context
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        
        function startDrawing(e) {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        }
        
        function draw(e) {
            if (!isDrawing) return;
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = parseInt($('#brush-size').val());
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            
            [lastX, lastY] = [e.offsetX, e.offsetY];
        }
        
        // Event listeners
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseout', () => isDrawing = false);
    });



    // Erase Foreground function
    $('#erase-btn').click(async function() {
        // Get form values
        const contentModeration = $('#content-moderation').is(':checked');
        
        // Get uploaded image
        const fileInput = document.getElementById('erase-upload');
        if (!fileInput.files || !fileInput.files[0]) {
            alert('Please upload an image first');
            return;
        }

        // Show loading state
        $('#erase-result-container').html(`
            <div style="text-align: center;">
                <p class="mt-2">Erasing foreground elements<span class="loading-dots">...</span></p>
            </div>
        `);
        
        // Animate the loading dots
        let dotCount = 3;
        const loadingInterval = setInterval(() => {
            dotCount = dotCount === 3 ? 1 : dotCount + 1;
            const dots = '.'.repeat(dotCount);
            $('.loading-dots').text(dots);
        }, 500);

        try {
            // Read file as ArrayBuffer
            const file = fileInput.files[0];
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);

            // Call Python function
            const result = await eel.erase_foreground(
                Array.from(bytes), // image_data
                null, // image_url
                contentModeration
            )();

            // Clear loading animation
            clearInterval(loadingInterval);

            // Display result
            if (result && result.result_url) {
                // Erase foreground always uses direct browser download
                $('#erase-result-container').html(`
                    <div class="text-center">
                        <h5 class="mb-3">Foreground Erased Successfully!</h5>
                        <img src="${result.result_url}" class="img-fluid rounded mb-3" 
                            alt="Erased foreground result" style="max-height: 500px;">
                        <div class="mb-2">
                            <button class="btn btn-primary download-btn" 
                                    data-url="${result.result_url}" 
                                    data-filename="erased_foreground.png">
                                <i class="bi bi-download"></i> Download Result
                            </button>
                        </div>
                        <div class="mb-2">
                            <button class="btn btn-secondary" onclick="copyToClipboard('${result.result_url}')">
                                <i class="bi bi-clipboard"></i> Copy URL
                            </button>
                        </div>
                        <small class="text-muted">Copy URL if download fails</small>
                    </div>
                `);
            } else {
                throw new Error('No result URL returned from API');
            }
        } catch (error) {
            // Clear loading animation on error too
            clearInterval(loadingInterval);
            console.error('Erase foreground error:', error);
            $('#erase-result-container').html(`
                <div class="alert alert-danger">
                    Error erasing foreground: ${error.message}
                </div>
            `);
        }
    });

});