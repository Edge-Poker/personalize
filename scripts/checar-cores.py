"""Confere os contrastes do DESIGN.md e converte a paleta para OKLCH.

O DESIGN.md afirma numeros de contraste. Numero afirmado tem de ser numero
conferido, entao ele roda aqui. E a transicao entre temperamentos promete
interpolar matiz em OKLCH - para isso as cores precisam estar declaradas em
oklch() no CSS, nao em hex.

    python3 scripts/checar-cores.py
"""

import math

TEMPERAMENTOS = {
    "calmo": {"papel": "#E9EDE5", "acento": "#6F5518", "acento_vivo": "#8A6B1F"},
    "direto": {"papel": "#EFF1EC", "acento": "#0E4F5C", "acento_vivo": "#136B7C"},
    "autoral": {"papel": "#EDE8EA", "acento": "#7A2E42", "acento_vivo": "#9B3A54"},
}

TINTA = "#14302F"
TINTA_FRACA = "#4A6461"

# Minimos exigidos. O acento vivo so e usado em area grande (>= 24px ou
# elemento grafico), entao responde ao criterio de 3:1, nao ao de 4.5:1.
MINIMOS = {"tinta": 4.5, "tinta_fraca": 4.5, "acento": 4.5, "acento_vivo": 3.0}


def para_rgb(hexa):
    h = hexa.lstrip("#")
    return tuple(int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))


def linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminancia(hexa):
    r, g, b = (linear(c) for c in para_rgb(hexa))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    claro, escuro = max(la, lb), min(la, lb)
    return (claro + 0.05) / (escuro + 0.05)


def para_oklch(hexa):
    r, g, b = (linear(c) for c in para_rgb(hexa))

    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

    l_, m_, s_ = (math.copysign(abs(v) ** (1 / 3), v) for v in (l, m, s))

    ok_l = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    ok_a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    ok_b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

    c = math.hypot(ok_a, ok_b)
    h = math.degrees(math.atan2(ok_b, ok_a)) % 360
    return ok_l, c, h


falhas = []

print("CONTRASTE SOBRE O PAPEL DE CADA TEMPERAMENTO\n")
for nome, cores in TEMPERAMENTOS.items():
    papel = cores["papel"]
    print(f"  {nome}  (papel {papel})")
    alvos = {
        "tinta": TINTA,
        "tinta_fraca": TINTA_FRACA,
        "acento": cores["acento"],
        "acento_vivo": cores["acento_vivo"],
    }
    for rotulo, cor in alvos.items():
        razao = contraste(cor, papel)
        minimo = MINIMOS[rotulo]
        ok = razao >= minimo
        if not ok:
            falhas.append(f"{nome}/{rotulo}: {razao:.2f} < {minimo}")
        print(f"    {rotulo:12s} {cor}  {razao:5.2f}:1  (min {minimo})  {'ok' if ok else 'FALHA'}")
    print()

print("\nPALETA EM OKLCH (para colar no globals.css)\n")
for nome, cores in TEMPERAMENTOS.items():
    print(f"  /* {nome} */")
    for rotulo, cor in cores.items():
        l, c, h = para_oklch(cor)
        print(f"    --{rotulo:12s} oklch({l * 100:.1f}% {c:.3f} {h:.1f});   /* {cor} */")
    print()

for rotulo, cor in (("tinta", TINTA), ("tinta-fraca", TINTA_FRACA)):
    l, c, h = para_oklch(cor)
    print(f"  --{rotulo:12s} oklch({l * 100:.1f}% {c:.3f} {h:.1f});   /* {cor} */")

if falhas:
    print("\nFALHAS:")
    for f in falhas:
        print(f"  {f}")
    raise SystemExit(1)

print("\nTodos os pares passam no minimo exigido.")
