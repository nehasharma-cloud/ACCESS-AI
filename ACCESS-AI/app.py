import os
import base64
import sqlite3
from datetime import datetime
from pathlib import Path
from uuid import uuid4

import requests
from flask import Flask, jsonify, render_template, request
from dotenv import load_dotenv


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

app = Flask(__name__)

# Maximum image size = 8 MB
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024


# =========================================================
# FOLDERS AND SETTINGS
# =========================================================

UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

DB_FILE = "access_ai.db"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

OPENAI_MODEL = os.getenv(
    "OPENAI_MODEL",
    "gpt-5.6-luna"
).strip()


ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp"
}


# =========================================================
# SUPPORTED LANGUAGES
# =========================================================

LANGUAGES = {
    "en": {
        "name": "English",
        "voice": "en-US"
    },

    "hi": {
        "name": "Hindi",
        "voice": "hi-IN"
    },

    "bn": {
        "name": "Bengali",
        "voice": "bn-IN"
    },

    "ta": {
        "name": "Tamil",
        "voice": "ta-IN"
    },

    "te": {
        "name": "Telugu",
        "voice": "te-IN"
    },

    "mr": {
        "name": "Marathi",
        "voice": "mr-IN"
    },

    "gu": {
        "name": "Gujarati",
        "voice": "gu-IN"
    },

    "pa": {
        "name": "Punjabi",
        "voice": "pa-IN"
    }
}


# =========================================================
# DATABASE
# =========================================================

def init_db():

    conn = sqlite3.connect(DB_FILE)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS scans (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            filename TEXT,

            mode TEXT,

            language TEXT,

            user_type TEXT,

            result TEXT,

            created_at TEXT

        )
    """)

    conn.commit()

    conn.close()


# =========================================================
# SAVE SCAN
# =========================================================

def save_scan(
    filename,
    mode,
    language,
    user_type,
    result
):

    conn = sqlite3.connect(DB_FILE)

    conn.execute(
        """
        INSERT INTO scans
        (
            filename,
            mode,
            language,
            user_type,
            result,
            created_at
        )

        VALUES (?, ?, ?, ?, ?, ?)
        """,

        (
            filename,
            mode,
            language,
            user_type,
            result,
            datetime.now().isoformat(
                timespec="seconds"
            )
        )
    )

    conn.commit()

    conn.close()


# =========================================================
# GET HISTORY
# =========================================================

def get_history():

    conn = sqlite3.connect(DB_FILE)

    rows = conn.execute(
        """
        SELECT
            id,
            filename,
            mode,
            language,
            user_type,
            result,
            created_at

        FROM scans

        ORDER BY id DESC

        LIMIT 15
        """
    ).fetchall()

    conn.close()

    return [

        {
            "id": row[0],

            "filename": row[1],

            "mode": row[2],

            "language": row[3],

            "user_type": row[4],

            "result": row[5],

            "created_at": row[6]
        }

        for row in rows
    ]


# =========================================================
# CREATE AI PROMPT
# =========================================================

def build_prompt(
    mode,
    language,
    user_type,
    question="",
    profile_summary=""
):

    # Get selected language
    lang = LANGUAGES.get(
        language,
        LANGUAGES["en"]
    )["name"]


    common_prompt = f"""

You are ACCESS-AI, an accessibility assistant
for blind and low-vision users.


The user type is:

{user_type}


Accessibility preferences:

{profile_summary or "Not provided"}


IMPORTANT LANGUAGE INSTRUCTION:

Respond ONLY in {lang}.


Use simple and natural {lang}.

Avoid unnecessary technical words.

Make the response easy to understand
when spoken aloud.


For voice-first users,
make the response especially clear
and concise when spoken aloud.


Only use information that is clearly visible
in the image.


Never invent:

- hidden text
- identity
- exact distance
- medical facts
- safety guarantees


If something is unclear,
say that you are not sure.


Do not present the answer as a replacement for:

- mobility aids
- human assistance
- professional medical advice
- safety-critical navigation

"""


# =========================================================
# OCR MODE
# =========================================================

    if mode == "ocr":

        task = f"""

Read only the text that is visibly readable
in the image.


Preserve useful line breaks.


Do not guess unclear characters.


If no readable text exists,
say that no readable text was found
in {lang}.

"""


# =========================================================
# ASK MODE
# =========================================================

    elif mode == "ask":

        task = f"""

Answer this question about the image:


Question:

{question}


Use only visible information
from the image.


Do not guess.


If the answer cannot be determined
from the image, clearly say so
in {lang}.

"""


# =========================================================
# WHAT MATTERS MODE
# =========================================================

    elif mode == "important":

        task = f"""

Identify the most useful visible information
for the user.


Prioritize things such as:

- readable signs
- doors
- stairs
- vehicles
- people
- important labels
- the requested object


Avoid unnecessary background details.


Do not give safety guarantees.


Respond in {lang}.

"""


# =========================================================
# DESCRIPTION MODE
# =========================================================

    else:

        task = f"""

Give a concise visual description
of the image.


Mention:

- main objects
- people
- surroundings
- visible text
- useful relative positions


For example:

left
right
center
foreground
background


Only mention these when they are clearly visible.


Respond in {lang}.

"""


    return common_prompt + "\n" + task


# =========================================================
# EXTRACT AI RESPONSE
# =========================================================

def extract_output_text(data):

    output_text = data.get(
        "output_text"
    )


    if (
        isinstance(output_text, str)
        and output_text.strip()
    ):

        return output_text.strip()


    parts = []


    for item in data.get(
        "output",
        []
    ):

        for content in item.get(
            "content",
            []
        ):

            text = content.get(
                "text"
            )


            if (
                isinstance(text, str)
                and text.strip()
            ):

                parts.append(
                    text.strip()
                )


    return "\n".join(parts).strip()


# =========================================================
# AI IMAGE ANALYSIS
# =========================================================

def analyze_image(
    image_bytes,
    mime_type,
    prompt
):

    if not OPENAI_API_KEY:

        raise RuntimeError(

            "OPENAI_API_KEY is missing. "

            "Create a .env file beside app.py "
            "and add your API key."

        )


    encoded_image = base64.b64encode(
        image_bytes
    ).decode("utf-8")


    image_url = (
        f"data:{mime_type};base64,"
        f"{encoded_image}"
    )


    payload = {

        "model": OPENAI_MODEL,

        "input": [

            {

                "role": "user",

                "content": [

                    {

                        "type": "input_text",

                        "text": prompt

                    },

                    {

                        "type": "input_image",

                        "image_url": image_url

                    }

                ]

            }

        ]

    }


    response = requests.post(

        "https://api.openai.com/v1/responses",

        headers={

            "Authorization":
                f"Bearer {OPENAI_API_KEY}",

            "Content-Type":
                "application/json"

        },

        json=payload,

        timeout=90

    )


    if not response.ok:

        try:

            detail = response.json()

        except Exception:

            detail = response.text


        raise RuntimeError(

            f"AI API error "
            f"({response.status_code}): "
            f"{detail}"

        )


    data = response.json()


    result = extract_output_text(
        data
    )


    if not result:

        raise RuntimeError(
            "The AI returned an empty response."
        )


    return result


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def index():

    return render_template(
        "index.html"
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():

    return jsonify({

        "status": "ok",

        "api_key_configured":
            bool(OPENAI_API_KEY),

        "model":
            OPENAI_MODEL,

        "supported_languages":
            list(LANGUAGES.keys())

    })


# =========================================================
# ANALYZE IMAGE
# =========================================================

@app.post("/analyze")
def analyze():

    image = request.files.get(
        "image"
    )


    mode = request.form.get(
        "mode",
        "describe"
    ).strip()


    language = request.form.get(
        "language",
        "en"
    ).strip()


    user_type = request.form.get(
        "user_type",
        "low_vision"
    ).strip()


    question = request.form.get(
        "question",
        ""
    ).strip()


    profile_summary = request.form.get(
        "profile_summary",
        ""
    ).strip()


# ---------------------------------------------------------
# VALIDATION
# ---------------------------------------------------------

    if not image:

        return jsonify({

            "error":
                "Please select or capture an image first."

        }), 400


    if mode not in {
        "describe",
        "ocr",
        "ask",
        "important"
    }:

        return jsonify({

            "error":
                "Invalid analysis mode."

        }), 400


    # Validate language
    if language not in LANGUAGES:

        language = "en"


    if user_type not in {
        "low_vision",
        "blind"
    }:

        user_type = "low_vision"


    if (
        mode == "ask"
        and not question
    ):

        return jsonify({

            "error":
                "Please enter a question about the image."

        }), 400


    mime_type = image.mimetype or ""


    if mime_type not in ALLOWED_MIME_TYPES:

        return jsonify({

            "error":
                "Please use a JPG, PNG, or WEBP image."

        }), 400


    image_bytes = image.read()


    if not image_bytes:

        return jsonify({

            "error":
                "The selected image is empty."

        }), 400


# ---------------------------------------------------------
# BUILD PROMPT
# ---------------------------------------------------------

    prompt = build_prompt(

        mode=mode,

        language=language,

        user_type=user_type,

        question=question,

        profile_summary=profile_summary

    )


# ---------------------------------------------------------
# CALL AI
# ---------------------------------------------------------

    try:

        result = analyze_image(

            image_bytes,

            mime_type,

            prompt

        )

    except Exception as exc:

        print(
            "ANALYZE ERROR:",
            repr(exc)
        )

        return jsonify({

            "error":
                str(exc)

        }), 500


# ---------------------------------------------------------
# SAVE IMAGE
# ---------------------------------------------------------

    original_name = Path(

        image.filename
        or "camera-image.jpg"

    ).name


    extension = Path(
        original_name
    ).suffix.lower()


    if extension not in {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    }:

        extension = ".jpg"


    stored_name = (

        datetime.now().strftime(
            "%Y%m%d_%H%M%S"
        )

        + "_"

        + uuid4().hex[:8]

        + extension

    )


    (
        UPLOAD_FOLDER
        / stored_name
    ).write_bytes(
        image_bytes
    )


# ---------------------------------------------------------
# SAVE DATABASE RECORD
# ---------------------------------------------------------

    save_scan(

        original_name,

        mode,

        language,

        user_type,

        result

    )


# ---------------------------------------------------------
# RETURN RESPONSE
# ---------------------------------------------------------

    return jsonify({

        "success": True,

        "result": result,

        "filename": original_name,

        "mode": mode,

        "language": language,

        "language_name":
            LANGUAGES[language]["name"],

        "voice_language":
            LANGUAGES[language]["voice"],

        "user_type": user_type

    })


# =========================================================
# GET HISTORY
# =========================================================

@app.get("/history")
def history():

    return jsonify(
        get_history()
    )


# =========================================================
# DELETE ONE SCAN
# =========================================================

@app.delete("/history/<int:scan_id>")
def delete_history(scan_id):

    try:

        conn = sqlite3.connect(DB_FILE)

        cursor = conn.cursor()


        # Check whether scan exists
        cursor.execute(
            "SELECT id FROM scans WHERE id = ?",
            (scan_id,)
        )

        scan = cursor.fetchone()


        if not scan:

            conn.close()

            return jsonify({

                "success": False,

                "error":
                    "Scan not found."

            }), 404


        # Delete scan
        cursor.execute(
            "DELETE FROM scans WHERE id = ?",
            (scan_id,)
        )


        conn.commit()

        conn.close()


        return jsonify({

            "success": True,

            "message":
                "Scan deleted successfully.",

            "deleted_id":
                scan_id

        })


    except Exception as exc:

        print(
            "DELETE HISTORY ERROR:",
            repr(exc)
        )

        return jsonify({

            "success": False,

            "error":
                "Could not delete the scan."

        }), 500


# =========================================================
# CLEAR ALL HISTORY
# =========================================================

@app.delete("/history")
def clear_history():

    try:

        conn = sqlite3.connect(DB_FILE)

        cursor = conn.cursor()


        cursor.execute(
            "DELETE FROM scans"
        )


        deleted_count = cursor.rowcount


        conn.commit()

        conn.close()


        return jsonify({

            "success": True,

            "message":
                "All scan history deleted successfully.",

            "deleted_count":
                deleted_count

        })


    except Exception as exc:

        print(
            "CLEAR HISTORY ERROR:",
            repr(exc)
        )

        return jsonify({

            "success": False,

            "error":
                "Could not clear scan history."

        }), 500


# =========================================================
# FILE TOO LARGE
# =========================================================

@app.errorhandler(413)
def too_large(_):

    return jsonify({

        "error":
            "Image is too large. "
            "Maximum size is 8 MB."

    }), 413


# =========================================================
# GENERAL ERROR HANDLER
# =========================================================

@app.errorhandler(500)
def internal_error(_):

    return jsonify({

        "error":
            "An internal server error occurred."

    }), 500


# =========================================================
# INITIALIZE DATABASE
# =========================================================

init_db()


# =========================================================
# RUN APPLICATION
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )