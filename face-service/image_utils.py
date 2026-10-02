import base64
import io

from PIL import Image


MAX_IMAGE_SIZE = 5 * 1024 * 1024


def base64_to_image(image_data):
    """
    Convert a base64/data-URL image into a PIL RGB image.
    """

    if not image_data:
        raise ValueError("Image data is required")

    # Remove data URL prefix:
    # data:image/jpeg;base64,...
    if image_data.startswith("data:"):
        if "," not in image_data:
            raise ValueError("Invalid image data")

        image_data = image_data.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(
            image_data,
            validate=True
        )
    except Exception:
        raise ValueError("Invalid base64 image")

    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise ValueError("Image is too large")

    try:
        image = Image.open(
            io.BytesIO(image_bytes)
        )

        image = image.convert("RGB")

        return image

    except Exception:
        raise ValueError("Unable to read image")


def image_to_numpy(image):
    """
    Convert PIL image to NumPy array.
    """

    import numpy as np

    return np.array(image)