-// --- SYSTEM PROMPT CONFIGURATION ---
const SYSTEM_PROMPT = `
You are an elite AI visual analyst and professional image prompt engineer.

Your role: Analyze any uploaded image and generate a highly accurate, reusable, production-quality image generation prompt.

IDENTITY & SAFETY RULES (STRICT):
- Never identify or guess real people.
- Always use neutral PLACEHOLDERS like [LEAD_CHARACTER_NAME], [SECONDARY_CHARACTER_NAME].

AUTOMATIC IMAGE ANALYSIS:
From the uploaded image, infer: Number of people, Facial structure, Clothing, Environment, Mood, Lighting, Camera angle, Color palette, Art style.

PROMPT ADAPTATION LOGIC:
- If movie poster → use cinematic poster language
- If action scene → emphasize motion
- If portrait → emphasize facial detail

OUTPUT FORMAT (STRICT — DO NOT CHANGE):
---
IMAGE TYPE:
[Auto-detected image type]

PROMPT:
High-impact cinematic depiction of [LEAD_CHARACTER_NAME]... (describe the scene fully based on image analysis).

STYLE TAGS:
[List style tags]

NEGATIVE PROMPT:
low quality, blurry, flat lighting, distorted face, bad anatomy, extra limbs, oversharpening, text, watermark, logo

USER REPLACEMENT GUIDE:
- Replace character placeholders with celebrity names or your own name
- Do not change the rest of the prompt
---

FINAL BEHAVIOR RULES:
- Never explain your reasoning
- Only output the formatted result
`;

// --- DOM ELEMENTS ---
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewContainer = document.getElementById('previewContainer');
const generateBtn = document.getElementById('generateBtn');
const outputText = document.getElementById('outputText');
const resultContainer = document.getElementById('resultContainer');
const loading = document.getElementById('loading');
const apiKeyInput = document.getElementById('apiKey');
const copyBtn = document.getElementById('copyBtn');

let base64Image = "";

// --- EVENT LISTENERS ---

// 1. Handle Image Upload & Preview
imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            base64Image = e.target.result.split(',')[1]; // Remove 'data:image/jpeg;base64,' part
            previewContainer.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
});

// 2. Handle Generate Button
generateBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        alert("Please enter your Google Gemini API Key first!");
        return;
    }
    if (!base64Image) {
        alert("Please upload an image first!");
        return;
    }

    // UI Updates
    loading.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    generateBtn.disabled = true;

    try {
        const result = await callGeminiAPI(apiKey, base64Image);
        outputText.textContent = result;
        resultContainer.classList.remove('hidden');
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        loading.classList.add('hidden');
        generateBtn.disabled = false;
    }
});

// 3. Copy Functionality
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(outputText.textContent);
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy', 2000);
});

// --- API FUNCTION ---
async function callGeminiAPI(key, imageBase64) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

    const payload = {
        contents: [{
            parts: [
                { text: SYSTEM_PROMPT },
                {
                    inline_data: {
                        mime_type: "image/jpeg", // Assuming JPEG/PNG works generically here
                        data: imageBase64
                    }
                }
            ]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.candidates[0].content.parts[0].text;
}
