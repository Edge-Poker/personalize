"""Tres paletas candidatas, medidas antes de escolher.

O briefing da revisao pede "estudos internos de pelo menos 3 possibilidades".
Escolher paleta por gosto e facil; o que decide e se ela aguenta texto em cima
sem quebrar contraste - inclusive dentro dos blocos de sobreimpressao, que sao
o ponto onde quase toda paleta bonita falha.

    python3 scripts/estudo-paletas.py
"""

import math

PALETAS = {
    "A. escritorio sob luz fria": {
        "papel": "#DEE0E6",
        "tinta": "#171A33",
        "acento": "#AE1547",
        "bloco": "#D8D26B",
    },
    "B. ostra e clorofila": {
        "papel": "#E5E3DC",
        "tinta": "#22201C",
        "acento": "#5E6410",
        "bloco": "#C3D2CB",
    },
    "C. ultramar e ameixa": {
        "papel": "#E2E0E8",
        "tinta": "#1B1B4A",
        "acento": "#7A1F5C",
        "bloco": "#CDE0D6",
    },
}


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(h):
    r, g, b = (lin(c) for c in rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def multiplicar(a, b):
    """Sobreimpressao: e o que a tinta faz no papel quando uma cruza a outra."""
    return "#" + "".join(f"{int(x * y / 255):02X}" for x, y in zip(rgb(a), rgb(b)))


def oklch(h):
    r, g, b = (lin(c) for c in rgb(h))
    l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = (math.copysign(abs(v) ** (1 / 3), v) for v in (l_, m_, s_))
    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return L * 100, math.hypot(A, B), math.degrees(math.atan2(B, A)) % 360


for nome, p in PALETAS.items():
    print(f"\n{nome}")
    sobre_papel = [
        ("tinta sobre papel", p["tinta"], p["papel"], 4.5),
        ("acento sobre papel", p["acento"], p["papel"], 4.5),
        ("tinta sobre bloco", p["tinta"], p["bloco"], 4.5),
        ("acento sobre bloco", p["acento"], p["bloco"], 4.5),
        ("bloco sobre papel", p["bloco"], p["papel"], 1.4),
    ]
    for rotulo, frente, fundo, minimo in sobre_papel:
        r = contraste(frente, fundo)
        marca = "ok " if r >= minimo else "RUIM"
        print(f"  {marca} {rotulo:20s} {r:5.2f}:1  (min {minimo})")

    print("  sobreimpressao:")
    print(f"       acento x bloco = {multiplicar(p['acento'], p['bloco'])}")
    print(f"       tinta  x bloco = {multiplicar(p['tinta'], p['bloco'])}")

    L, C, H = oklch(p["acento"])
    print(f"  acento em oklch: L {L:.0f}%  C {C:.3f}  H {H:.0f} graus")
    if 15 <= H <= 65:
        print("       ATENCAO: matiz na faixa do terracota/laranja, que o briefing proibe.")
