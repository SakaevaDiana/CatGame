export default class CollisionSystem {
  constructor() {
    this.obstacles = [];
    this.bounds = { minX: -32, maxX: 32, minZ: -32, maxZ: 32 };
  }

  addRect(x, z, w, d, h = Infinity) {
    const obs = { x: x - w / 2, z: z - d / 2, w, d, h };
    this.obstacles.push(obs);
    return obs;
  }

  collides(px, pz, pw, pd, py = 0) {
    const minX = px - pw / 2, maxX = px + pw / 2;
    const minZ = pz - pd / 2, maxZ = pz + pd / 2;

    if (minX < this.bounds.minX || maxX > this.bounds.maxX) return true;
    if (minZ < this.bounds.minZ || maxZ > this.bounds.maxZ) return true;

    for (const o of this.obstacles) {
      if (py > o.h) continue;
      if (maxX > o.x && minX < o.x + o.w && maxZ > o.z && minZ < o.z + o.d) return true;
    }
    return false;
  }

  resolve(px, pz, pw, pd, dx, dz, py = 0) {
    const nx = px + dx, nz = pz + dz;
    if (!this.collides(nx, nz, pw, pd, py)) return { x: nx, z: nz };
    if (!this.collides(nx, pz, pw, pd, py)) return { x: nx, z: pz };
    if (!this.collides(px, nz, pw, pd, py)) return { x: px, z: nz };
    return { x: px, z: pz };
  }
}
