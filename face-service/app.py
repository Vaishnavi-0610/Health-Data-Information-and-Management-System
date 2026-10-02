from flask import Flask, request, jsonify
from flask_cors import CORS

import face_recognition
import numpy as np

import base64
import io

from PIL import Image


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        }
    },
)


# ============================================================
# IMAGE CONVERSION
# ============================================================

def b64_to_image(base64_str):
    """
    Convert a base64 image string into a PIL RGB image.
    """

    if not base64_str:
        raise ValueError("Image data is empty.")

    if base64_str.startswith("data:"):
        base64_str = base64_str.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(
            base64_str,
            validate=True
        )
    except Exception as exc:
        raise ValueError(
            f"Invalid base64 image data: {exc}"
        )

    if not image_bytes:
        raise ValueError("Decoded image is empty.")

    try:
        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")
    except Exception as exc:
        raise ValueError(
            f"Unable to decode image: {exc}"
        )

    return image


# ============================================================
# HOME
# ============================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "service": "CAREKEY Face Service",
        "status": "running",
        "port": 5001,
    })


# ============================================================
# HEALTH
# ============================================================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "status": "healthy",
    })


# ============================================================
# GENERATE FACE EMBEDDING
# ============================================================

@app.route("/embed", methods=["POST"])
def embed():

    data = request.get_json(
        silent=True
    ) or {}

    image_base64 = data.get("image")

    print("\n===================================")
    print("CAREKEY /embed")
    print("===================================")

    if not image_base64:
        return jsonify({
            "success": False,
            "error": "image required",
        }), 400

    try:

        print("Image received.")

        image = b64_to_image(
            image_base64
        )

        image_array = np.array(image)

        # ----------------------------------------------------
        # FACE DETECTION
        # ----------------------------------------------------

        face_locations = (
            face_recognition.face_locations(
                image_array,
                model="hog"
            )
        )

        print(
            "Detected faces:",
            len(face_locations)
        )

        if len(face_locations) == 0:

            print(
                "No face detected."
            )

            return jsonify({
                "success": False,
                "error": (
                    "No face detected. "
                    "Please position your face clearly "
                    "inside the camera frame."
                ),
            }), 400

        # ----------------------------------------------------
        # MULTIPLE FACE CHECK
        # ----------------------------------------------------

        if len(face_locations) > 1:

            print(
                "Multiple faces detected."
            )

            return jsonify({
                "success": False,
                "error": (
                    "Multiple faces detected. "
                    "Only one person should be visible."
                ),
            }), 400

        # ----------------------------------------------------
        # FACE ENCODING
        # ----------------------------------------------------

        encodings = (
            face_recognition.face_encodings(
                image_array,
                known_face_locations=face_locations
            )
        )

        if not encodings:

            print(
                "Face encoding failed."
            )

            return jsonify({
                "success": False,
                "error": (
                    "Unable to generate face embedding."
                ),
            }), 400

        embedding = encodings[0].tolist()

        # ----------------------------------------------------
        # VALIDATE EMBEDDING
        # ----------------------------------------------------

        if len(embedding) != 128:

            print(
                "Invalid embedding length:",
                len(embedding)
            )

            return jsonify({
                "success": False,
                "error": (
                    "Invalid face embedding generated."
                ),
            }), 500

        print(
            "Embedding generated successfully."
        )

        print(
            "Embedding dimensions:",
            len(embedding)
        )

        return jsonify({
            "success": True,
            "embedding": embedding,
        })

    except Exception as exc:

        print(
            "Embedding error:",
            str(exc)
        )

        return jsonify({
            "success": False,
            "error": str(exc),
        }), 500


# ============================================================
# FACE MATCHING
# ============================================================

@app.route("/match", methods=["POST"])
def match():

    data = request.get_json(
        silent=True
    ) or {}

    image_base64 = data.get("image")

    candidates = data.get(
        "candidates",
        []
    )

    print("\n===================================")
    print("CAREKEY /match")
    print("===================================")

    print(
        "Number of candidates:",
        len(candidates)
    )

    if not image_base64:

        return jsonify({
            "success": False,
            "error": "image required",
        }), 400

    if not isinstance(
        candidates,
        list
    ):

        return jsonify({
            "success": False,
            "error": "candidates must be an array",
        }), 400

    try:

        # ----------------------------------------------------
        # CONVERT PROBE IMAGE
        # ----------------------------------------------------

        image = b64_to_image(
            image_base64
        )

        image_array = np.array(image)

        # ----------------------------------------------------
        # DETECT FACE
        # ----------------------------------------------------

        face_locations = (
            face_recognition.face_locations(
                image_array,
                model="hog"
            )
        )

        print(
            "Probe faces detected:",
            len(face_locations)
        )

        if len(face_locations) == 0:

            return jsonify({
                "success": False,
                "error": (
                    "No face detected in the emergency scan."
                ),
            }), 400

        if len(face_locations) > 1:

            return jsonify({
                "success": False,
                "error": (
                    "Multiple faces detected. "
                    "Please scan one person at a time."
                ),
            }), 400

        # ----------------------------------------------------
        # GENERATE PROBE EMBEDDING
        # ----------------------------------------------------

        encodings = (
            face_recognition.face_encodings(
                image_array,
                known_face_locations=face_locations
            )
        )

        if not encodings:

            return jsonify({
                "success": False,
                "error": (
                    "Unable to generate face embedding."
                ),
            }), 400

        probe = np.asarray(
            encodings[0],
            dtype=np.float64
        )

        # ----------------------------------------------------
        # FIND BEST MATCH
        # ----------------------------------------------------

        best_id = None
        best_similarity = -1.0

        for candidate in candidates:

            if not isinstance(
                candidate,
                dict
            ):
                continue

            candidate_id = candidate.get(
                "id"
            )

            candidate_embedding = candidate.get(
                "embedding"
            )

            if not candidate_id:
                continue

            if not isinstance(
                candidate_embedding,
                list
            ):
                continue

            if len(candidate_embedding) != 128:
                print(
                    "Skipping candidate with invalid embedding:",
                    candidate_id
                )
                continue

            try:

                embedding = np.asarray(
                    candidate_embedding,
                    dtype=np.float64
                )

                probe_norm = np.linalg.norm(
                    probe
                )

                embedding_norm = np.linalg.norm(
                    embedding
                )

                if (
                    probe_norm == 0
                    or embedding_norm == 0
                ):
                    continue

                similarity = (
                    np.dot(
                        probe,
                        embedding
                    )
                    /
                    (
                        probe_norm
                        *
                        embedding_norm
                    )
                )

                print(
                    f"Candidate {candidate_id}: "
                    f"{similarity:.6f}"
                )

                if similarity > best_similarity:

                    best_similarity = (
                        similarity
                    )

                    best_id = (
                        candidate_id
                    )

            except Exception as exc:

                print(
                    f"Candidate {candidate_id} "
                    f"comparison failed:",
                    exc
                )

        # ----------------------------------------------------
        # MATCH THRESHOLD
        # ----------------------------------------------------

        # Prototype threshold.
        # This can be calibrated later using real test data.
        MATCH_THRESHOLD = 0.75

        if (
            best_id is None
            or best_similarity < MATCH_THRESHOLD
        ):

            print(
                "No matching patient."
            )

            print(
                "Best similarity:",
                best_similarity
            )

            return jsonify({
                "success": False,
                "match_id": None,
                "similarity": (
                    float(best_similarity)
                    if best_similarity >= 0
                    else 0.0
                ),
                "error": (
                    "No matching patient was found."
                ),
            })

        # ----------------------------------------------------
        # SUCCESSFUL MATCH
        # ----------------------------------------------------

        print(
            "MATCH FOUND"
        )

        print(
            "Patient ID:",
            best_id
        )

        print(
            "Similarity:",
            best_similarity
        )

        return jsonify({
            "success": True,
            "match_id": best_id,
            "similarity": float(
                best_similarity
            ),
        })

    except Exception as exc:

        print(
            "Matching error:",
            str(exc)
        )

        return jsonify({
            "success": False,
            "error": str(exc),
        }), 500


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print("\n===================================")
    print("CAREKEY FACE SERVICE")
    print("===================================")
    print("Server: http://127.0.0.1:5001")
    print("Embed:  POST /embed")
    print("Match:  POST /match")
    print("Health: GET  /health")
    print("===================================\n")

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )