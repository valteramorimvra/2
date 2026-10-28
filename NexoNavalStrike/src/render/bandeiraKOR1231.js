// v1.2.31 — bandeira da Coreia do Sul (Taegukgi) desenhada em canvas (símbolo nacional, domínio público; proporções 3:2, trigramas simplificados).
export function desenhaKOR(x, W, H) {
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); const cx = W / 2, cy = H / 2, r = H * 0.25, ang = -Math.atan2(H, W); /* eixo do taeguk: diagonal ascendente, como na bandeira oficial */
  x.save(); x.translate(cx, cy); x.rotate(ang); x.fillStyle = '#cd2e3a'; x.beginPath(); x.arc(0, 0, r, Math.PI, 0); x.fill(); x.fillStyle = '#0047a0'; x.beginPath(); x.arc(0, 0, r, 0, Math.PI); x.fill();
  x.fillStyle = '#cd2e3a'; x.beginPath(); x.arc(r / 2, 0, r / 2, 0, Math.PI); x.fill(); x.fillStyle = '#0047a0'; x.beginPath(); x.arc(-r / 2, 0, r / 2, Math.PI, 0); x.fill(); x.restore();
  /* trigramas: 3 barras (cheia ou partida) por canto, orientadas para o centro */
  const barras = (px, py, rot, padrao) => { x.save(); x.translate(px, py); x.rotate(rot); x.fillStyle = '#000'; const bw = H * 0.27, bh = H * 0.032, g = H * 0.022; padrao.forEach((cheia, i) => { const y = (i - 1) * (bh + g); if (cheia) x.fillRect(-bw / 2, y - bh / 2, bw, bh); else { x.fillRect(-bw / 2, y - bh / 2, bw * 0.43, bh); x.fillRect(bw / 2 - bw * 0.43, y - bh / 2, bw * 0.43, bh); } }); x.restore(); };
  const d = Math.hypot(W, H), ux = W / d, uy = H / d, off = H * 0.57; /* cantos ao longo das diagonais */
  barras(cx - ux * off * 1.0, cy - uy * off * 1.0, ang + Math.PI / 2 - 0.0, [1, 1, 1]); barras(cx + ux * off, cy + uy * off, ang + Math.PI / 2, [0, 0, 0]);
  barras(cx - ux * off, cy + uy * off, -ang + Math.PI / 2 + Math.PI, [0, 1, 0]); barras(cx + ux * off, cy - uy * off, -ang + Math.PI / 2 + Math.PI, [1, 0, 1]);
}
