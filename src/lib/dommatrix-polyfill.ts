/**
 * 服务端 minimal DOMMatrix polyfill，供 Vercel 等无 DOM 环境使用。
 * 仅在 API Route 中引入，不参与 Server Components 渲染。
 */
if (typeof globalThis.DOMMatrix === "undefined") {
  const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  type Matrix2D = { a: number; b: number; c: number; d: number; e: number; f: number };

  globalThis.DOMMatrix = class DOMMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;

    constructor(init?: number[] | string | Matrix2D) {
      if (Array.isArray(init) && init.length >= 6) {
        this.a = init[0];
        this.b = init[1];
        this.c = init[2];
        this.d = init[3];
        this.e = init[4];
        this.f = init[5];
      } else if (typeof init === "string" && init.startsWith("matrix")) {
        const n = init.replace(/matrix\(|\)/g, "").split(/,\s*/).map(Number);
        this.a = n[0] ?? 1;
        this.b = n[1] ?? 0;
        this.c = n[2] ?? 0;
        this.d = n[3] ?? 1;
        this.e = n[4] ?? 0;
        this.f = n[5] ?? 0;
      } else {
        this.a = identity.a;
        this.b = identity.b;
        this.c = identity.c;
        this.d = identity.d;
        this.e = identity.e;
        this.f = identity.f;
      }
    }

    static fromMatrix(other?: Matrix2D) {
      if (other) return new DOMMatrix([other.a, other.b, other.c, other.d, other.e, other.f]);
      return new DOMMatrix();
    }

    get m11() { return this.a; }
    get m12() { return this.b; }
    get m21() { return this.c; }
    get m22() { return this.d; }
    get m41() { return this.e; }
    get m42() { return this.f; }
    set m11(v) { this.a = v; }
    set m12(v) { this.b = v; }
    set m21(v) { this.c = v; }
    set m22(v) { this.d = v; }
    set m41(v) { this.e = v; }
    set m42(v) { this.f = v; }

    get is2D() { return true; }
    get isIdentity() {
      return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
    }

    translate(x: number, y: number) {
      this.e += x;
      this.f += y;
      return this;
    }

    scale(x: number, y?: number) {
      const sy = y ?? x;
      this.a *= x;
      this.b *= x;
      this.c *= sy;
      this.d *= sy;
      return this;
    }

    multiply(other: DOMMatrix) {
      const o = other as DOMMatrix;
      return new DOMMatrix([
        this.a * o.a + this.c * o.b,
        this.b * o.a + this.d * o.b,
        this.a * o.c + this.c * o.d,
        this.b * o.c + this.d * o.d,
        this.a * o.e + this.c * o.f + this.e,
        this.b * o.e + this.d * o.f + this.f,
      ]);
    }

    inverse() {
      const { a, b, c, d, e, f } = this;
      const det = a * d - b * c;
      if (Math.abs(det) < 1e-15) return new DOMMatrix();
      return new DOMMatrix([
        d / det, -b / det, -c / det, a / det,
        (c * f - d * e) / det, (b * e - a * f) / det,
      ]);
    }
  } as unknown as typeof globalThis.DOMMatrix;
}
