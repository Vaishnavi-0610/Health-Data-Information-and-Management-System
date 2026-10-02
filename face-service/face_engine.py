import face_recognition
import numpy as np


def detect_faces(image_array):
    """
    Detect faces in an image.

    Returns:
        List of face locations.
    """

    locations = face_recognition.face_locations(
        image_array,
        model="hog"
    )

    return locations


def generate_embedding(image_array):
    """
    Generate a 128-dimensional face embedding.

    Exactly one face must be present.
    """

    locations = detect_faces(image_array)

    # No face
    if len(locations) == 0:
        return {
            "success": False,
            "error": "No face detected"
        }

    # Multiple faces
    if len(locations) > 1:
        return {
            "success": False,
            "error": "Multiple faces detected"
        }

    # Generate encoding
    encodings = face_recognition.face_encodings(
        image_array,
        known_face_locations=locations
    )

    if not encodings:
        return {
            "success": False,
            "error": "Could not generate face embedding"
        }

    embedding = encodings[0]

    return {
        "success": True,
        "embedding": embedding.tolist()
    }


def compare_faces(probe_embedding, candidate_embedding):
    """
    Compare two face embeddings using cosine similarity.
    """

    probe = np.asarray(
        probe_embedding,
        dtype=np.float64
    )

    candidate = np.asarray(
        candidate_embedding,
        dtype=np.float64
    )

    if probe.shape != candidate.shape:
        raise ValueError(
            "Face embeddings have different dimensions"
        )

    probe_norm = np.linalg.norm(probe)
    candidate_norm = np.linalg.norm(candidate)

    if probe_norm == 0 or candidate_norm == 0:
        return 0.0

    similarity = np.dot(
        probe,
        candidate
    ) / (
        probe_norm * candidate_norm
    )

    return float(similarity)


def find_best_match(
    probe_embedding,
    candidates,
    threshold=0.60
):
    """
    Find the closest face among candidates.

    candidates format:

    [
        {
            "id": "patient123",
            "embedding": [...]
        }
    ]
    """

    best_id = None
    best_similarity = -1.0

    for candidate in candidates:

        candidate_id = candidate.get("id")
        candidate_embedding = candidate.get("embedding")

        if not candidate_id or not candidate_embedding:
            continue

        try:

            similarity = compare_faces(
                probe_embedding,
                candidate_embedding
            )

        except Exception:
            continue

        if similarity > best_similarity:

            best_similarity = similarity
            best_id = candidate_id

    matched = (
        best_id is not None
        and best_similarity >= threshold
    )

    return {
        "matched": matched,
        "match_id": best_id if matched else None,
        "similarity": float(best_similarity)
    }