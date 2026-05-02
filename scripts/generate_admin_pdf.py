from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUTPUT = "ADMIN-KURZUEBERSICHT-DOGHIKE.pdf"


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )

    styles = getSampleStyleSheet()
    title = styles["Title"]
    title.fontName = "Helvetica-Bold"
    title.fontSize = 20
    title.leading = 24

    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=12,
        spaceAfter=0,
    )

    small = ParagraphStyle(
        "Small",
        parent=body,
        fontSize=8.5,
        leading=11,
    )

    rows = [
        ["Bereich", "Fuer den Admin wichtig", "Wo aendern / pruefen"],
        [
            "Live-Touren",
            "Nur Daten aus public_hikes sind live in der App sichtbar. public_hikes_import ist nur die alte Import-Tabelle.",
            "Supabase: public_hikes",
        ],
        [
            "Status",
            "Nur approved ist oeffentlich sichtbar. draft bleibt versteckt.",
            "Feld status in public_hikes",
        ],
        [
            "Titel / Ort / Land",
            "Titel, Ort und Land direkt in der Live-Tour pflegen.",
            "title, location, country in public_hikes",
        ],
        [
            "Beschreibung",
            "Am sichersten notes nutzen. Die App liest auch description / beschreibung als Fallback.",
            "notes in public_hikes",
        ],
        [
            "Achtung",
            "Leere Werte, Leerzeichen oder null werden in der App nicht mehr angezeigt.",
            "hazard_notes in public_hikes",
        ],
        [
            "Parken / Einkehr",
            "Parkplatz- und Einkehrinfos erscheinen nur, wenn sie in der Live-Tour gepflegt sind.",
            "parking_info, restaurant_info in public_hikes",
        ],
        [
            "Wasser",
            "Wasser nutzt Zahlen: 0 kein Wasser, 1 wenig, 2 etwas, 3 viel.",
            "water_availability in public_hikes",
        ],
        [
            "Datum",
            "Datum ist optional. Wenn leer, wird es in der App nicht angezeigt.",
            "date in public_hikes",
        ],
        [
            "Tags",
            "Tags werden in der Suche und in den Tourvorschauen genutzt. Mehrere Begriffe koennen per Komma getrennt werden.",
            "tags oder tag/tag1/tag2... in public_hikes",
        ],
        [
            "Bilder per Link",
            "Direkt moeglich ueber image, image2, image3, image4 usw. Die App liest auch photo/foto/bild-Varianten.",
            "image/image2/... in public_hikes",
        ],
        [
            "Bilder per App",
            "Als Admin in der App: Tour oeffnen, Bearbeiten, Bilder auswaehlen, speichern. Mehrere Bilder gleichzeitig sind moeglich.",
            "DogHike App -> Oeffentliche Tour bearbeiten",
        ],
        [
            "Zusatzbilder",
            "Alternativ koennen Bilder sauber einzeln ueber die Bild-Tabelle verknuepft werden.",
            "public_hike_photos mit hike_id, photo_url, sort_order",
        ],
        [
            "Text aendern in der App",
            "Textaenderungen im Tour-Editor speichern direkt nach Supabase.",
            "DogHike App -> Oeffentliche Tour bearbeiten",
        ],
        [
            "Wichtigster Merksatz",
            "Wenn etwas in der App nicht erscheint, zuerst pruefen: richtige Tabelle? richtige Tour? status = approved?",
            "Meistens public_hikes statt public_hikes_import",
        ],
    ]

    table_data = []
    for row in rows:
        if row == rows[0]:
            table_data.append([Paragraph(f"<b>{cell}</b>", body) for cell in row])
        else:
            table_data.append([Paragraph(cell, small) for cell in row])

    table = Table(table_data, colWidths=[38 * mm, 84 * mm, 46 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#d8c6b7")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#2f241d")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d7d1cb")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#faf8f6")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    story = [
        Paragraph("DogHike - Admin Kurzauskunft", title),
        Spacer(1, 4 * mm),
        Paragraph(
            "Kurzuebersicht fuer die Pflege der offiziellen oeffentlichen Touren in Supabase und in der App.",
            body,
        ),
        Spacer(1, 6 * mm),
        table,
    ]

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
