import cv2
import numpy as np

# ===== НАСТРОЙКИ =====

IMAGE_PATH = "memory_sheet.jpg"

ROWS = 6
COLS = 9

# Насколько обрезать края ячейки
CELL_PADDING = 8

# =====================


def split_grid(img):
    h, w = img.shape[:2]

    cell_w = w / COLS
    cell_h = h / ROWS

    cells = []

    counter = 1

    for row in range(ROWS):
        for col in range(COLS):

            x1 = int(col * cell_w) + CELL_PADDING
            y1 = int(row * cell_h) + CELL_PADDING

            x2 = int((col + 1) * cell_w) - CELL_PADDING
            y2 = int((row + 1) * cell_h) - CELL_PADDING

            crop = img[y1:y2, x1:x2]

            cells.append({
                "id": counter,
                "image": crop
            })

            counter += 1

    return cells


def show_cell(cell):

    preview = cell["image"].copy()

    text = f"Frame #{cell['id']}"

    cv2.putText(
        preview,
        text,
        (10, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 255, 255),
        2
    )

    cv2.imshow("Memory Checker", preview)

def show_found_frames(cells, found_ids):

    found_cells = [c["image"] for c in cells if c["id"] in found_ids]

    if not found_cells:
        print("Кадры не найдены")
        return

    thumb_w = 200
    thumb_h = 120

    thumbs = []

    for idx, img in enumerate(found_cells):

        thumb = cv2.resize(img, (thumb_w, thumb_h))

        cv2.putText(
            thumb,
            str(found_ids[idx]),
            (5, 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

        thumbs.append(thumb)

    per_row = 4

    rows = []

    for i in range(0, len(thumbs), per_row):
        row = thumbs[i:i + per_row]

        while len(row) < per_row:
            row.append(np.zeros_like(thumbs[0]))

        rows.append(np.hstack(row))

    result = np.vstack(rows)

    cv2.imshow("Found Frames", result)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

def main():

    img = cv2.imread(IMAGE_PATH)

    if img is None:
        print(f"Не удалось открыть {IMAGE_PATH}")
        return

    cells = split_grid(img)

    found = []

    print("\nУправление:")
    print("Y или ПРОБЕЛ = кадр найден")
    print("N = пропустить")
    print("Q = завершить\n")

    for cell in cells:

        show_cell(cell)

        while True:

            key = cv2.waitKey(0) & 0xFF

            if key in [ord('y'), ord('Y'), 32]:
                found.append(cell["id"])
                break

            elif key in [ord('n'), ord('N')]:
                break

            elif key in [ord('q'), ord('Q')]:
                cv2.destroyAllWindows()

                print("\nНайденные кадры:")
                print(found)

                show_found_frames(cells, found)

                return

    cv2.destroyAllWindows()

    print("\nНайденные кадры:")
    print(found)

    show_found_frames(cells, found)


if __name__ == "__main__":
    main()