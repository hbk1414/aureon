// Import is not needed for the shape registration

interface MetaballShape {
  cx1: number;
  cy1: number;
  r1: number;
  cx2: number;
  cy2: number;
  r2: number;
  maxDistance: number;
}

const MetaballPath = {
  type: 'metaball',
  shape: {
    cx1: 0,
    cy1: 0,
    r1: 0,
    cx2: 0,
    cy2: 0,
    r2: 0,
    maxDistance: 0
  },

  buildPath(ctx: CanvasRenderingContext2D, shape: MetaballShape) {
    const { cx1, cy1, r1, cx2, cy2, r2, maxDistance } = shape;
    
    const d = Math.sqrt((cx2 - cx1) ** 2 + (cy2 - cy1) ** 2);
    
    if (d > maxDistance || d <= Math.abs(r1 - r2)) {
      // Draw separate circles if too far apart or one inside the other
      ctx.arc(cx1, cy1, r1, 0, 2 * Math.PI);
      ctx.moveTo(cx2 + r2, cy2);
      ctx.arc(cx2, cy2, r2, 0, 2 * Math.PI);
      return;
    }

    if (d < r1 + r2) {
      // Create metaball effect when circles are close
      const u1 = Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d));
      const u2 = Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d));
      const angle = Math.atan2(cy2 - cy1, cx2 - cx1);
      
      const h = 2;
      const r = (r1 + r2) * 0.5;
      
      const p1x = cx1 + r1 * Math.cos(angle + u1);
      const p1y = cy1 + r1 * Math.sin(angle + u1);
      const p2x = cx1 + r1 * Math.cos(angle - u1);
      const p2y = cy1 + r1 * Math.sin(angle - u1);
      
      const p3x = cx2 + r2 * Math.cos(angle + Math.PI - u2);
      const p3y = cy2 + r2 * Math.sin(angle + Math.PI - u2);
      const p4x = cx2 + r2 * Math.cos(angle + Math.PI + u2);
      const p4y = cy2 + r2 * Math.sin(angle + Math.PI + u2);
      
      // Create smooth connecting curve
      const cp1x = p1x + h * Math.cos(angle - Math.PI / 2);
      const cp1y = p1y + h * Math.sin(angle - Math.PI / 2);
      const cp2x = p3x + h * Math.cos(angle - Math.PI / 2);
      const cp2y = p3y + h * Math.sin(angle - Math.PI / 2);
      
      const cp3x = p4x + h * Math.cos(angle + Math.PI / 2);
      const cp3y = p4y + h * Math.sin(angle + Math.PI / 2);
      const cp4x = p2x + h * Math.cos(angle + Math.PI / 2);
      const cp4y = p2y + h * Math.sin(angle + Math.PI / 2);
      
      // Draw the metaball path
      ctx.arc(cx1, cy1, r1, angle + u1, angle - u1);
      ctx.bezierCurveTo(cp4x, cp4y, cp3x, cp3y, p4x, p4y);
      ctx.arc(cx2, cy2, r2, angle + Math.PI + u2, angle + Math.PI - u2);
      ctx.bezierCurveTo(cp2x, cp2y, cp1x, cp1y, p1x, p1y);
    } else {
      // Draw separate circles
      ctx.arc(cx1, cy1, r1, 0, 2 * Math.PI);
      ctx.moveTo(cx2 + r2, cy2);
      ctx.arc(cx2, cy2, r2, 0, 2 * Math.PI);
    }
  }
};

export default MetaballPath;