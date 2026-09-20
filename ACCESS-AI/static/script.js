// =========================================================
// ACCESS-AI - FRONTEND JAVASCRIPT
// =========================================================


// =========================================================
// GLOBAL VARIABLES
// =========================================================

let selectedFile = null;
let currentResult = "";

let stream = null;
let cameraOpen = false;

let voiceRecognition = null;
let voiceListening = false;


// =========================================================
// GET HTML ELEMENTS
// =========================================================

const imageInput =
    document.getElementById("imageInput");

const imagePreview =
    document.getElementById("imagePreview");

const previewContainer =
    document.getElementById("previewContainer");

const cameraVideo =
    document.getElementById("cameraVideo");

const cameraCanvas =
    document.getElementById("cameraCanvas");

const cameraContainer =
    document.getElementById("cameraContainer");

const resultBox =
    document.getElementById("resultBox");

const resultText =
    document.getElementById("resultText");

const loadingBox =
    document.getElementById("loadingBox");

const userType =
    document.getElementById("userType");

const language =
    document.getElementById("language");

const questionInput =
    document.getElementById("questionInput");

const profileSummary =
    document.getElementById("profileSummary");

const historyList =
    document.getElementById("historyList");

const voiceQuestionBtn =
    document.getElementById("voiceQuestionBtn");

const voiceStatus =
    document.getElementById("voiceStatus");


// =========================================================
// PAGE LOAD
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadHistory();

        updateAccessibilityProfile();

        setupVoiceRecognition();

    }
);


// =========================================================
// IMAGE UPLOAD
// =========================================================

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files &&
                event.target.files[0];

            if (!file) {
                return;
            }

            handleSelectedFile(file);

        }
    );

}


// =========================================================
// HANDLE SELECTED IMAGE
// =========================================================

function handleSelectedFile(file) {

    // Check image type
    if (
        !file.type ||
        !file.type.startsWith("image/")
    ) {

        showError(
            "Please select a valid image file."
        );

        clearImage();

        return;
    }


    // Maximum 8 MB
    const maxSize =
        8 * 1024 * 1024;


    if (file.size > maxSize) {

        showError(
            "Image size must be less than 8 MB."
        );

        clearImage();

        return;
    }


    // Store selected image
    selectedFile = file;


    // Create preview
    if (
        imagePreview &&
        previewContainer
    ) {

        const imageURL =
            URL.createObjectURL(file);


        imagePreview.onload =
            function () {

                URL.revokeObjectURL(
                    imageURL
                );

            };


        imagePreview.onerror =
            function () {

                URL.revokeObjectURL(
                    imageURL
                );

                showError(
                    "Could not display image preview."
                );

            };


        imagePreview.src =
            imageURL;


        previewContainer.classList.remove(
            "hidden"
        );

    }


    // Hide previous result
    hideResult();

    hideError();


    // Success message
    showTemporaryMessage(
        "Image selected successfully."
    );

}


// =========================================================
// OPEN CAMERA
// =========================================================

async function openCamera() {

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        showError(
            "Camera is not supported by this browser."
        );

        return;
    }


    try {

        stream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                },

                audio: false

            });


        if (cameraVideo) {

            cameraVideo.srcObject =
                stream;

            await cameraVideo.play()
                .catch(function () {});

        }


        if (cameraContainer) {

            cameraContainer.classList.remove(
                "hidden"
            );

        }


        cameraOpen = true;

        hideError();


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        showError(
            "Camera permission was denied or camera is unavailable."
        );

    }

}


// =========================================================
// CLOSE CAMERA
// =========================================================

function closeCamera() {

    if (stream) {

        stream
            .getTracks()
            .forEach(
                function (track) {

                    track.stop();

                }
            );

        stream = null;

    }


    if (cameraVideo) {

        cameraVideo.srcObject =
            null;

    }


    if (cameraContainer) {

        cameraContainer.classList.add(
            "hidden"
        );

    }


    cameraOpen = false;

}


// =========================================================
// CAPTURE PHOTO
// =========================================================

function capturePhoto() {

    if (!cameraOpen) {

        showError(
            "Please open the camera first."
        );

        return;
    }


    if (
        !cameraVideo ||
        !cameraCanvas
    ) {

        showError(
            "Camera elements are missing."
        );

        return;
    }


    const videoWidth =
        cameraVideo.videoWidth;

    const videoHeight =
        cameraVideo.videoHeight;


    if (
        !videoWidth ||
        !videoHeight
    ) {

        showError(
            "Camera is not ready yet."
        );

        return;
    }


    cameraCanvas.width =
        videoWidth;

    cameraCanvas.height =
        videoHeight;


    const context =
        cameraCanvas.getContext("2d");


    if (!context) {

        showError(
            "Could not access camera canvas."
        );

        return;
    }


    context.drawImage(
        cameraVideo,
        0,
        0,
        videoWidth,
        videoHeight
    );


    cameraCanvas.toBlob(

        function (blob) {

            if (!blob) {

                showError(
                    "Could not capture image."
                );

                return;
            }


            const file =
                new File(

                    [blob],

                    "camera-image.jpg",

                    {
                        type: "image/jpeg"
                    }

                );


            handleSelectedFile(file);

            closeCamera();

        },

        "image/jpeg",

        0.90

    );

}


// =========================================================
// REMOVE IMAGE
// =========================================================

function clearImage() {

    selectedFile = null;


    if (imageInput) {

        imageInput.value =
            "";

    }


    if (imagePreview) {

        imagePreview.src =
            "";

    }


    if (previewContainer) {

        previewContainer.classList.add(
            "hidden"
        );

    }


    hideResult();

}


// =========================================================
// ACCESSIBILITY PROFILE
// =========================================================

function updateAccessibilityProfile() {

    if (
        !userType ||
        !profileSummary
    ) {

        return;
    }


    const type =
        userType.value;


    if (type === "blind") {

        profileSummary.value =
            "Voice-first mode. Keep answers concise and easy to understand when spoken aloud.";

    }

    else {

        profileSummary.value =
            "Low-vision mode. Focus on readable text, important objects and useful visual details.";

    }

}


// =========================================================
// USER TYPE CHANGE
// =========================================================

if (userType) {

    userType.addEventListener(
        "change",
        updateAccessibilityProfile
    );

}


// =========================================================
// ANALYZE IMAGE
// =========================================================

async function analyzeImage(mode) {

    // Check image
    if (!selectedFile) {

        showError(
            "Please select or capture an image first."
        );

        return;
    }


    // Check question
    let question = "";


    if (mode === "ask") {

        question =
            questionInput
                ? questionInput.value.trim()
                : "";


        if (!question) {

            showError(
                "Please enter or speak a question about the image."
            );


            if (questionInput) {

                questionInput.focus();

            }

            return;
        }

    }


    hideError();

    showLoading();


    // =====================================================
    // CREATE FORM DATA
    // =====================================================

    const formData =
        new FormData();


    formData.append(
        "image",
        selectedFile
    );


    formData.append(
        "mode",
        mode
    );


    formData.append(
        "language",
        language
            ? language.value
            : "en"
    );


    formData.append(
        "user_type",
        userType
            ? userType.value
            : "low_vision"
    );


    formData.append(
        "profile_summary",
        profileSummary
            ? profileSummary.value
            : ""
    );


    if (mode === "ask") {

        formData.append(
            "question",
            question
        );

    }


    // =====================================================
    // SEND TO FLASK
    // =====================================================

    try {

        const response =
            await fetch(
                "/analyze",
                {
                    method: "POST",
                    body: formData
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data;


        // JSON response
        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        }

        // HTML/text error response
        else {

            const serverText =
                await response.text();


            console.error(
                "Server returned non-JSON:",
                serverText
            );


            throw new Error(
                "Server returned an unexpected response. Please check the Flask terminal."
            );

        }


        // Check HTTP status
        if (!response.ok) {

            throw new Error(

                data.error ||
                "Something went wrong while analyzing the image."

            );

        }


        // =================================================
        // GET RESULT
        // =================================================

        currentResult =
            data.result || "";


        if (!currentResult) {

            throw new Error(
                "AI returned an empty result."
            );

        }


        // Show result
        showResult(
            currentResult
        );


        // =================================================
        // BLIND / VOICE-FIRST MODE
        // =================================================

        if (
            userType &&
            userType.value === "blind"
        ) {

            speakText(
                currentResult
            );

        }


        // Refresh history
        loadHistory();


    }

    catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        showError(
            error.message ||
            "Unable to analyze the image."
        );

    }

    finally {

        hideLoading();

    }

}


// =========================================================
// SHOW RESULT
// =========================================================

function showResult(text) {

    if (
        !resultBox ||
        !resultText
    ) {

        return;
    }


    resultText.textContent =
        text;


    resultBox.classList.remove(
        "hidden"
    );


    resultBox.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });

}


// =========================================================
// HIDE RESULT
// =========================================================

function hideResult() {

    if (resultBox) {

        resultBox.classList.add(
            "hidden"
        );

    }


    if (resultText) {

        resultText.textContent =
            "";

    }


    currentResult =
        "";

}


// =========================================================
// TEXT TO SPEECH
// =========================================================

function speakText(text) {

    if (!text) {
        return;
    }


    if (
        !("speechSynthesis" in window)
    ) {

        showError(
            "Text-to-speech is not supported in this browser."
        );

        return;
    }


    // Stop previous speech
    window.speechSynthesis.cancel();


    const selectedLanguage =
        language
            ? language.value
            : "en";


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    if (selectedLanguage === "hi") {

        speech.lang =
            "hi-IN";

    }

    else {

        speech.lang =
            "en-IN";

    }


    speech.rate =
        0.95;

    speech.pitch =
        1;

    speech.volume =
        1;


    window.speechSynthesis.speak(
        speech
    );

}


// =========================================================
// STOP SPEAKING
// =========================================================

function stopSpeaking() {

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

    }

}


// =========================================================
// VOICE QUESTION SETUP
// =========================================================

function setupVoiceRecognition() {

    if (!voiceQuestionBtn) {
        return;
    }


    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        voiceQuestionBtn.disabled =
            true;


        if (voiceStatus) {

            voiceStatus.textContent =
                "Voice input is not supported. Please use Google Chrome.";

        }


        return;
    }


    voiceRecognition =
        new SpeechRecognition();


    voiceRecognition.continuous =
        false;


    voiceRecognition.interimResults =
        false;


    voiceRecognition.maxAlternatives =
        1;


    // =====================================================
    // SPEAK BUTTON
    // =====================================================

    voiceQuestionBtn.addEventListener(
        "click",
        function () {

            if (voiceListening) {

                voiceRecognition.stop();

                return;
            }


            const selectedLanguage =
                language
                    ? language.value
                    : "en";


            if (
                selectedLanguage === "hi"
            ) {

                voiceRecognition.lang =
                    "hi-IN";

            }

            else {

                voiceRecognition.lang =
                    "en-IN";

            }


            try {

                voiceRecognition.start();

            }

            catch (error) {

                console.error(
                    "Voice start error:",
                    error
                );

            }

        }
    );


    // =====================================================
    // LISTENING START
    // =====================================================

    voiceRecognition.onstart =
        function () {

            voiceListening =
                true;


            voiceQuestionBtn.textContent =
                "🔴 Listening...";


            if (voiceStatus) {

                voiceStatus.textContent =
                    "🎤 Listening... Please speak your question.";

            }

        };


    // =====================================================
    // SPEECH RESULT
    // =====================================================

    voiceRecognition.onresult =
        function (event) {

            const transcript =
                event
                    .results[0][0]
                    .transcript
                    .trim();


            if (questionInput) {

                questionInput.value =
                    transcript;

            }


            if (voiceStatus) {

                voiceStatus.textContent =
                    "✅ Question received: " +
                    transcript;

            }

        };


    // =====================================================
    // LISTENING END
    // =====================================================

    voiceRecognition.onend =
        function () {

            voiceListening =
                false;


            voiceQuestionBtn.textContent =
                "🎤 Speak";


            if (
                questionInput &&
                questionInput.value.trim() &&
                voiceStatus
            ) {

                voiceStatus.textContent =
                    "✅ Question ready. Click Ask AI.";

            }

        };


    // =====================================================
    // VOICE ERROR
    // =====================================================

    voiceRecognition.onerror =
        function (event) {

            voiceListening =
                false;


            voiceQuestionBtn.textContent =
                "🎤 Speak";


            if (!voiceStatus) {
                return;
            }


            if (
                event.error ===
                "not-allowed"
            ) {

                voiceStatus.textContent =
                    "⚠️ Microphone permission denied. Allow microphone access.";

            }

            else if (
                event.error ===
                "no-speech"
            ) {

                voiceStatus.textContent =
                    "⚠️ No speech detected. Try again.";

            }

            else if (
                event.error ===
                "audio-capture"
            ) {

                voiceStatus.textContent =
                    "⚠️ Microphone not found.";

            }

            else {

                voiceStatus.textContent =
                    "⚠️ Voice error: " +
                    event.error;

            }

        };

}


// =========================================================
// COPY RESULT
// =========================================================

async function copyResult() {

    if (!currentResult) {

        showError(
            "There is no result to copy."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            currentResult
        );


        showTemporaryMessage(
            "Result copied!"
        );


    }

    catch (error) {

        console.error(
            "Copy error:",
            error
        );


        showError(
            "Could not copy the result."
        );

    }

}


// =========================================================
// DOWNLOAD RESULT
// =========================================================

function downloadResult() {

    if (!currentResult) {

        showError(
            "There is no result to download."
        );

        return;
    }


    const blob =
        new Blob(

            [currentResult],

            {
                type: "text/plain"
            }

        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "access-ai-result.txt";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


// =========================================================
// LOAD HISTORY
// =========================================================

async function loadHistory() {

    if (!historyList) {
        return;
    }


    try {

        const response =
            await fetch(
                "/history"
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            throw new Error(
                "History endpoint did not return JSON."
            );

        }


        const history =
            await response.json();


        if (!response.ok) {

            throw new Error(
                "Could not load history."
            );

        }


        renderHistory(
            history
        );

    }

    catch (error) {

        console.error(
            "History error:",
            error
        );


        historyList.innerHTML = `

            <div class="empty-history">

                <p>
                    No history available.
                </p>

                <small>
                    History will appear after your first scan.
                </small>

            </div>

        `;

    }

}


// =========================================================
// RENDER HISTORY
// =========================================================

function renderHistory(history) {

    if (!historyList) {
        return;
    }


    if (
        !history ||
        history.length === 0
    ) {

        historyList.innerHTML = `

            <div class="empty-history">

                <p>
                    No scans yet.
                </p>

                <small>
                    Your recent AI scans will appear here.
                </small>

            </div>

        `;

        return;
    }


    historyList.innerHTML =
        "";


    history.forEach(
        function (item) {

            const card =
                document.createElement(
                    "div"
                );


            // Supports both old and new CSS
            card.className =
                "history-card history-item";


            const modeName =
                getModeName(
                    item.mode
                );


            const languageName =
                getLanguageName(
                    item.language
                );


            card.innerHTML = `

                <div class="history-info">

                    <div class="history-header">

                        <strong>
                            ${escapeHTML(modeName)}
                        </strong>

                        <span>
                            ${escapeHTML(languageName)}
                        </span>

                    </div>


                    <div class="history-file">

                        📷
                        ${escapeHTML(
                            item.filename ||
                            "Image"
                        )}

                    </div>


                    <span class="history-result">

                        ${escapeHTML(
                            item.result ||
                            ""
                        )}

                    </span>


                    <small class="history-date">

                        ${escapeHTML(
                            formatDate(
                                item.created_at
                            )
                        )}

                    </small>

                </div>


                <button
                    type="button"
                    class="delete-scan-button"
                    title="Delete this scan"
                    onclick="deleteScan(${Number(item.id)})"
                >
                    🗑️
                </button>

            `;


            historyList.appendChild(
                card
            );

        }
    );

}


// =========================================================
// GET MODE NAME
// =========================================================

function getModeName(mode) {

    const modes = {

        describe:
            "👁️ Describe Scene",

        ocr:
            "📄 Read Text",

        important:
            "⭐ What Matters?",

        ask:
            "❓ Ask About Image"

    };


    return modes[mode] ||
        "AI Scan";

}


// =========================================================
// GET LANGUAGE NAME
// =========================================================

function getLanguageName(languageCode) {

    const languages = {

        en:
            "English",

        hi:
            "Hindi",

        bn:
            "Bengali",

        ta:
            "Tamil",

        te:
            "Telugu",

        mr:
            "Marathi",

        gu:
            "Gujarati",

        pa:
            "Punjabi"

    };


    return languages[languageCode] ||
        "English";

}


// =========================================================
// FORMAT MODE
// =========================================================

function formatMode(mode) {

    return getModeName(
        mode
    );

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleString();

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================================
// SHOW LOADING
// =========================================================

function showLoading() {

    if (loadingBox) {

        loadingBox.classList.remove(
            "hidden"
        );

    }

}


// =========================================================
// HIDE LOADING
// =========================================================

function hideLoading() {

    if (loadingBox) {

        loadingBox.classList.add(
            "hidden"
        );

    }

}


// =========================================================
// SHOW ERROR
// =========================================================

function showError(message) {

    hideLoading();


    let errorElement =
        document.getElementById(
            "errorMessage"
        );


    if (!errorElement) {

        errorElement =
            document.createElement(
                "div"
            );


        errorElement.id =
            "errorMessage";


        errorElement.className =
            "error-message";


        document.body.prepend(
            errorElement
        );

    }


    errorElement.textContent =
        message;


    errorElement.classList.remove(
        "hidden"
    );


    setTimeout(
        function () {

            errorElement.classList.add(
                "hidden"
            );

        },
        6000
    );

}


// =========================================================
// HIDE ERROR
// =========================================================

function hideError() {

    const errorElement =
        document.getElementById(
            "errorMessage"
        );


    if (errorElement) {

        errorElement.classList.add(
            "hidden"
        );

    }

}


// =========================================================
// TEMPORARY MESSAGE
// =========================================================

function showTemporaryMessage(
    message
) {

    const notification =
        document.createElement(
            "div"
        );


    notification.className =
        "temporary-message";


    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    setTimeout(
        function () {

            notification.remove();

        },
        2500
    );

}


// =========================================================
// DELETE ONE SCAN
// =========================================================

async function deleteScan(scanId) {

    if (!scanId) {

        showError(
            "Invalid scan ID."
        );

        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this scan?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/history/${scanId}`,
                {
                    method: "DELETE"
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        }

        else {

            throw new Error(
                "Server returned an unexpected response."
            );

        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Failed to delete scan."
            );

        }


        showTemporaryMessage(
            "Scan deleted successfully."
        );


        await loadHistory();

    }

    catch (error) {

        console.error(
            "Delete scan error:",
            error
        );


        showError(
            "Could not delete this scan: " +
            error.message
        );

    }

}


// =========================================================
// CLEAR ALL HISTORY
// =========================================================

async function clearHistory() {

    const confirmed =
        confirm(
            "Are you sure you want to delete ALL recent scans?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                "/history",
                {
                    method: "DELETE"
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        }

        else {

            throw new Error(
                "Server returned an unexpected response."
            );

        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Failed to clear history."
            );

        }


        await loadHistory();


        showTemporaryMessage(
            "All scan history has been deleted."
        );

    }

    catch (error) {

        console.error(
            "Clear history error:",
            error
        );


        showError(
            "Could not clear history: " +
            error.message
        );

    }

}


// =========================================================
// KEYBOARD ACCESSIBILITY
// =========================================================

document.addEventListener(
    "keydown",
    function (event) {

        // ESC = stop speech
        if (
            event.key === "Escape"
        ) {

            stopSpeaking();

        }


        // CTRL + ENTER = describe image
        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {

            event.preventDefault();


            analyzeImage(
                "describe"
            );

        }

    }
);


// =========================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// =========================================================

window.openCamera =
    openCamera;

window.closeCamera =
    closeCamera;

window.capturePhoto =
    capturePhoto;

window.clearImage =
    clearImage;

window.analyzeImage =
    analyzeImage;

window.speakText =
    speakText;

window.stopSpeaking =
    stopSpeaking;

window.copyResult =
    copyResult;

window.downloadResult =
    downloadResult;

window.updateAccessibilityProfile =
    updateAccessibilityProfile;

window.deleteScan =
    deleteScan;

window.clearHistory =
    clearHistory;

window.loadHistory =
    loadHistory;